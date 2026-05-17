/**
 * AI 聊天服务
 *
 * 职责：
 * 1. 调用云端 LLM API 生成回复
 * 2. 记录完整调用日志到 ai_task_log（含 request_text / response_text）
 * 3. 将 AI 产出写入 ai_task_draft 草稿表
 * 4. 支持非流式与 SSE 流式两种输出模式
 *
 * 角色感知（2026-05 新增）：
 *   - Teacher：专业、结构化，给出可直接用于课堂的实验步骤
 *   - Student：通俗易懂，举生活例子
 *   - Researcher：结合课标要求，分析教学价值
 *
 * 对话历史（2026-05 新增）：
 *   - 从 ai_task_log 查询最近 4 轮成功对话作为上下文
 *
 * 健壮性：
 * - 超时：30s 超时熔断
 * - 重试：最多 1 次自动重试（仅对 retryable 错误）
 * - 错误分类：网络超时/5xx → retryable；API 4xx → 非 retryable
 * - traceId 透传：从请求头 x-trace-id 获取，或自动生成
 */
import { randomUUID } from "node:crypto";
import { getMysqlPool } from "../infrastructure/mysql/mysql-client.ts";
import {
  insertAiTaskLog,
  updateAiTaskLog,
  insertAiTaskDraft,
  listRecentChatHistory,
} from "../infrastructure/repositories/v2-ai-repository.ts";
import { getPromptContent } from "./AiPromptService.ts";
import type { AiChatRequest, AiChatResponse } from "../domain/v2-ai/v2-ai-types.ts";

// ─── 环境变量配置 ───────────────────────────────────

// 优先使用 LLM_* 系列变量（通用），回退到 AI_CHAT_* 系列（旧兼容）
const LLM_API_KEY = (process.env.LLM_API_KEY ?? process.env.AI_CHAT_QWEN_API_KEY ?? process.env.DEEPSEEK_API_KEY ?? "").trim();
const LLM_BASE_URL = (process.env.LLM_BASE_URL ?? process.env.AI_CHAT_BASE_URL ?? "https://api.deepseek.com").trim().replace(/\/+$/, "");
const LLM_MODEL = (process.env.LLM_MODEL ?? process.env.AI_CHAT_MODEL ?? "deepseek-chat").trim();
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 30_000);

// ─── 错误 ────────────────────────────────────────────

export class AiChatServiceError extends Error {
  code: string;
  retryable: boolean;
  constructor(code: string, message: string, retryable = false) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.name = "AiChatServiceError";
  }
}

// ─── 安全常量 ──────────────────────────────────────────

/**
 * 危险关键词列表（用于规则 1B 安全预检前置判断）
 * 当学生想法涉及以下关键词时，AI 必须走安全拦截分支而非鼓励分支。
 * 与 Prompt 中 "【火/明火/点燃/燃烧/爆炸/刀/针/烫/热水/电/腐蚀/酸/碱】" 一一对应。
 */
const DANGEROUS_KEYWORDS = [
  "火", "明火", "点燃", "燃烧", "爆炸",
  "刀", "针", "烫", "热水",
  "电", "腐蚀", "酸", "碱",
] as const;

const DANGEROUS_KEYWORDS_PROMPT = "【火/明火/点燃/燃烧/爆炸/刀/针/烫/热水/电/腐蚀/酸/碱】";

// ─── System Prompt（角色感知）────────────────────────

/**
 * 构建石头老师的完整系统提示词
 *
 * 严格遵循「石头老师智能体完整实现方案」规范 V2，覆盖：
 * 1. 角色身份与合规性定义（Persona & Compliance）
 * 2. 分龄分层引导架构（Tiered Pedagogical Logic）
 * 3. 全流程分步引导协议（Step-by-Step Workflow）
 * 4. 安全防御系统（Zero Risk Guardrail）
 * 5. 特殊场景应对机制（Exception Handling）
 *
 * @param userRole - x-role header 值，如 "Role_Teacher" / "Role_Student"
 * @param schoolLevelId - 学生角色的学段 ID（"primary"），非学生角色可传空
 * @param userName - 用户真实姓名，用于个性化对话开场（如"xxx同学"）
 */
export function buildSystemPrompt(userRole: string, schoolLevelId?: string | null, userName?: string | null): string {
  const role = userRole.startsWith("Role_") ? userRole.slice(5) : userRole;
  const displayName = userName?.trim() || "同学";

  if (role === "Student") {
    return buildStudentPrompt(displayName, schoolLevelId);
  }

  // 教师/研究员/默认角色：保持原有风格
  const base = "你是一个初中科学实验助教。你的职责是帮助用户完成实验方案的设计。\n\n通用要求：\n1. 用简体中文回复，语言简洁清晰。\n2. 如果不确定具体实验参数，给出通用建议并提醒用户根据实际情况调整。\n3. 不要编造不存在的实验数据或危险等级。";
  const roleTail = getRoleTail(role);
  return `${base}\n\n${roleTail}`;
}

/**
 * 构建石头老师的完整系统提示词（三阶分龄版）
 *
 * 面向小学 1-6 年级学生角色。**三个学段的 Prompt 全部嵌入**，
 * 由 LLM 根据学生自报的年级自行匹配对应层级的引导框架。
 * 参考："我是二年级" → LLM 自动选择低段 4 模块框架；
 * "我是五年级" → LLM 自动选择高段 9 节规范框架。
 *
 * @param displayName - 学生真实姓名，如"小明"；用于在对话中固定称呼
 * @param _schoolLevelId - 保留参数，预留后续精确匹配（当前未使用，全部嵌入让 LLM 自适配）
 */
function buildStudentPrompt(displayName: string, _schoolLevelId?: string | null): string {
  return `# 角色定义

你是石头老师，一位亲切热情的小学科学老师。你的学生叫 ${displayName}。全程让学生称呼你为**石头老师**。

# 核心规则（必须严格遵守）

1. 每句话末尾加表情符号（😊👍😆🎉等），语气亲切热情。
2. 先热情肯定学生的每个回答（"太棒啦！""你这个思路很棒呀！"）。
3. 绝对不说"受力分析""压强公式"等术语，改用"向上的力""水的力气"等通俗表达。
4. 每轮回复必须**以提问结尾**，引导学生继续思考。
5. 禁止直接给出答案或实验步骤，必须通过反问让学生自己说出来。
6. 如果学生说"给我完整的方案"或类似请求（如"给我方案""完整的方案"），你必须立刻输出以下九点模板（不得增减顺序）：
   一、提出问题
   二、做出假设
   三、实验目的
   四、实验材料
   五、实验步骤（用数字列表）
   六、实验记录表格（用Markdown表格，|列名|）
   七、实验结果分析
   八、实验结论
   九、安全注意事项
7. 除了输出完整方案外，每轮回复不超过200字。

# 对话示例（严格模仿以下风格和结构）

以下是石头老师与一位六年级学生的完整对话。你必须严格模仿石头老师的语气、节奏和引导方式。

---

学生：我想探究沉在水中物体是否受到了水的浮力
石头老师：哇，这个想法超赞呀！那咱们先想想"我们要做什么"，要不就试试看看沉在水里的东西，有没有被水向上托的力，你觉得咋样？接下来想一想，为了完成这个事儿，"需要什么东西"呢，你家里有没有小石块、绳子、弹簧秤呀？

学生：六年级了，我还没学受力分析呢
石头老师：没关系呀，咱们不用管那么复杂的东西！你只需要想，石头沉到水底，有没有一个"向上的力"在推它就行啦！那咱们先一起设计实验来感受这个力好不好？你觉得第一步该做什么呢？

学生：我觉得先把小石块用绳子拴住，挂在弹簧秤上测一下重量
石头老师：太棒啦！你这个思路很棒呀！咱们把步骤先捋一捋：先把石头挂在弹簧秤上，记下读数；然后把石头慢慢放进水里，看看弹簧秤的读数有没有变化。你觉得读数会变大还是变小呀？

学生：我觉得放进水里会变轻
石头老师：哇，猜得很准呀！那咱们为了验证这个猜想，需要把数据记下来，画个表格。你觉得表格应该有几列呢？

学生：两列吧，一列是状态，一列是示数
石头老师：对啦！一列写"状态"（比如空气中、水中），一列写"弹簧秤示数"，这样一比就能看出有没有变化啦！那你觉得测完以后，数据能告诉我们什么结论呢？

学生：受了向上的力
石头老师：太棒啦！你看，你自己已经总结出结论啦！石头沉到水里，确实受到了水向上的托力，这就是浮力呀！那做实验的时候，有没有什么需要注意的安全事项呢？

学生：把石头缓慢放入水中，不要碰到底
石头老师：对呀，你考虑得很周到！除了这个，还要注意别让水洒到弹簧秤上，用干布擦一下再读数更准哦！

学生：好了石头老师，给我这个完整的方案吧
石头老师：好的，下面就是完整的实验方案👇

一、提出问题：沉在水中的物体是否受到水的浮力？

二、做出假设：沉在水中的物体受到水向上的托力。

三、实验目的：通过测量物体在空气中和水中的重量变化，验证浮力的存在。

四、实验材料：小石块、细绳子、弹簧秤（或测力计）、一杯水、干布。

五、实验步骤：
1. 用绳子拴住小石块，挂在弹簧秤下，记录在空气中的读数。
2. 将小石块慢慢放入水中，直到完全浸没，不碰杯底和杯壁。
3. 记录弹簧秤在水中的读数。
4. 用干布擦干弹簧秤，重复实验2-3次。

六、实验记录表格：
| 状态 | 弹簧秤示数（N） |
|------|----------------|
| 空气中 | |
| 水中 | |

七、实验结果分析：比较两次读数，水中的示数是否变小。

八、实验结论：如果水中的示数变小，说明沉在水中的物体受到了水向上的托力，即浮力。

九、安全注意事项：
- 使用弹簧秤前检查是否归零。
- 放入水中时动作要慢，避免水花溅到弹簧秤。
- 实验后擦干器材，防止生锈。
- 请在大人的陪同下完成实验。`;
}

function getRoleTail(role: string): string {
  switch (role) {
    case "Teacher":
      return "当前和你对话的是一位中小学科学教师，有教学经验。\n\n语气要求：专业、结构化。\n重点：请给出可直接用于课堂的实验步骤，并标注安全注意事项。\n回答应包含：实验目标、所需材料、详细步骤（含安全提示）、预期现象或数据记录建议。";
    case "Student":
      return "";
    case "Researcher":
      return "当前和你对话的是一位教育研究者或教研员，关注课程设计与教学价值。\n\n语气要求：数据导向、分析性。\n重点：请结合课标要求，分析实验设计的教学价值。\n可包括：实验对知识点理解的作用、常见教学难点与应对建议、数据记录与分析的方法建议。";
    default:
      return "语气要求：清晰、友好。\n重点：如果用户询问实验方案，请给出结构化的实验步骤、所需材料、安全注意事项。\n如果用户的问题与实验教学无关，礼貌地引导回实验主题。";
  }
}

/**
 * 解析系统提示词：优先从 DB prompt 模板加载，失败时回退到硬编码
 *
 * 加载优先级：
 *   1. AiPromptService.getPromptContent() 查询 DB 活性模板
 *   2. DB 不可用或无模板 → 回退到 buildSystemPrompt() 硬编码
 */
export async function resolveSystemPrompt(
  userRole: string,
  schoolLevelId?: string | null,
  userName?: string | null,
): Promise<string> {
  const role = userRole.startsWith("Role_") ? userRole.slice(5) : userRole;
  const vars: Record<string, string | null | undefined> = {
    userName: userName?.trim() || null,
    schoolLevelId: schoolLevelId ?? null,
  };

  try {
    const dbPrompt = await getPromptContent(role, vars);
    if (dbPrompt !== null) {
      return dbPrompt;
    }
  } catch {
    // DB 查询异常，走硬编码 fallback
  }

  return buildSystemPrompt(userRole, schoolLevelId, userName);
}

// ─── LLM 消息类型 ────────────────────────────────────

interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LlmResponseBody {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

// ─── 对话历史 ─────────────────────────────────────────

const MAX_HISTORY_ROUNDS = 10;

/** 从 ai_task_log 查询用户最近的对话历史（按角色过滤，避免旧版教师风格回复污染石头老师身份） */
export async function buildChatHistory(userId: string, userRole?: string): Promise<LlmMessage[]> {
  console.log("[buildChatHistory] querying for", userId.substring(0, 8), "role:", userRole);
  const history = await listRecentChatHistory(userId, MAX_HISTORY_ROUNDS * 2, userRole);
  console.log("[buildChatHistory] got", history.length, "items");
  return history.map((h) => ({
    role: h.role as "user" | "assistant",
    content: h.content,
  }));
}

// ─── LLM 调用（非流式）────────────────────────────────

async function callLlm(
  messages: LlmMessage[],
  traceId: string,
): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
  if (!LLM_API_KEY) {
    throw new AiChatServiceError("LLM_NOT_CONFIGURED", "LLM API 密钥未配置，请设置环境变量 LLM_API_KEY", false);
  }

  const apiPath = LLM_BASE_URL.endsWith("/v1") ? "/chat/completions" : "/v1/chat/completions";
  const url = `${LLM_BASE_URL}${apiPath}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${LLM_API_KEY}`,
        "x-trace-id": traceId,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        max_tokens: 8192,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const isRetryable = response.status >= 500 || response.status === 429;
      throw new AiChatServiceError(
        `LLM_HTTP_${response.status}`,
        `LLM API 返回错误 (${response.status}): ${body.slice(0, 200)}`,
        isRetryable,
      );
    }

    const data = (await response.json()) as LlmResponseBody;
    const choice = data.choices?.[0];
    if (!choice?.message?.content) {
      throw new AiChatServiceError("LLM_EMPTY_RESPONSE", "LLM 返回了空结果", false);
    }

    return {
      content: choice.message.content,
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    };
  } catch (err) {
    if (err instanceof AiChatServiceError) throw err;
    if ((err as Error)?.name === "AbortError") {
      throw new AiChatServiceError("LLM_TIMEOUT", `LLM 请求超时 (${LLM_TIMEOUT_MS}ms)`, true);
    }
    throw new AiChatServiceError("LLM_NETWORK_ERROR", `LLM 网络请求失败: ${(err as Error)?.message ?? String(err)}`, true);
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── LLM 调用（流式）─────────────────────────────────

export async function* callLlmStream(
  messages: LlmMessage[],
  traceId: string,
): AsyncGenerator<{ token: string; usage?: { promptTokens: number; completionTokens: number } }> {
  console.log("[callLlmStream] ENTERED function body");
  if (!LLM_API_KEY) {
    throw new AiChatServiceError("LLM_NOT_CONFIGURED", "LLM API 密钥未配置，请设置环境变量 LLM_API_KEY", false);
  }

  const apiPath = LLM_BASE_URL.endsWith("/v1") ? "/chat/completions" : "/v1/chat/completions";
  const url = `${LLM_BASE_URL}${apiPath}`;
  console.log("[callLlmStream] url:", url, "model:", LLM_MODEL, "hasKey:", !!LLM_API_KEY, "msgCount:", messages.length);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  console.log("[callLlmStream] about to fetch...");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${LLM_API_KEY}`,
        "x-trace-id": traceId,
        accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        max_tokens: 8192,
        temperature: 0.3,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.log("[callLlmStream] LLM API returned", response.status, body.slice(0, 200));
      const isRetryable = response.status >= 500 || response.status === 429;
      throw new AiChatServiceError(
        `LLM_HTTP_${response.status}`,
        `LLM API 返回错误 (${response.status}): ${body.slice(0, 200)}`,
        isRetryable,
      );
    }
    console.log("[callLlmStream] LLM API status:", response.status, "ok");

    const reader = response.body?.getReader();
    if (!reader) {
      throw new AiChatServiceError("LLM_NO_BODY", "LLM 响应无 body", false);
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    let promptTokens = 0;
    let completionTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (jsonStr === "[DONE]") continue;

        try {
          const json = JSON.parse(jsonStr) as {
            choices?: Array<{ delta: { content?: string }; finish_reason?: string }>;
            usage?: { prompt_tokens: number; completion_tokens: number };
          };
          const token = json.choices?.[0]?.delta?.content ?? "";
          if (token) {
            fullContent += token;
            yield { token };
          }
          if (json.usage) {
            promptTokens = json.usage.prompt_tokens ?? 0;
            completionTokens = json.usage.completion_tokens ?? 0;
          }
        } catch {
          // 跳过无法解析的 SSE 行
        }
      }
    }

    // 处理剩余 buffer
    if (buffer.trim()) {
      const line = buffer.trim();
      if (line.startsWith("data:")) {
        const jsonStr = line.slice(5).trim();
        if (jsonStr !== "[DONE]") {
          try {
            const json = JSON.parse(jsonStr) as { usage?: { prompt_tokens: number; completion_tokens: number } };
            if (json.usage) {
              promptTokens = json.usage.prompt_tokens ?? 0;
              completionTokens = json.usage.completion_tokens ?? 0;
            }
          } catch { /* ignore */ }
        }
      }
    }

    console.log("[callLlmStream] done, fullContent length:", fullContent.length, "promptTokens:", promptTokens, "completionTokens:", completionTokens);
    yield { token: "", usage: { promptTokens, completionTokens } };
  } catch (err) {
    console.error("[callLlmStream] caught:", err instanceof Error ? err.message : String(err));
    if (err instanceof AiChatServiceError) throw err;
    if ((err as Error)?.name === "AbortError") {
      throw new AiChatServiceError("LLM_TIMEOUT", `LLM 请求超时 (${LLM_TIMEOUT_MS}ms)`, true);
    }
    throw new AiChatServiceError("LLM_NETWORK_ERROR", `LLM 网络请求失败: ${(err as Error)?.message ?? String(err)}`, true);
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── 主入口（非流式）─────────────────────────────────

/**
 * 处理 AI 聊天请求（非流式）
 */
export async function handleAiChat(
  input: AiChatRequest,
  actor: { userId: string; userRole: string; schoolLevelId?: string | null; userName?: string | null },
  traceId?: string,
): Promise<AiChatResponse> {
  const tid = traceId ?? randomUUID();
  const pool = getMysqlPool();

  // 构建 system prompt + 对话历史 + 当前用户消息
  const systemPrompt = await resolveSystemPrompt(actor.userRole, actor.schoolLevelId, actor.userName);
  const history = await buildChatHistory(actor.userId, actor.userRole);

  // 检测"索要完整方案"意图，追加模板强制指令
  const isRequestingFullPlan = /完整方案|给我方案|给我.*方案|完整的方案/.test(input.message);

  const messages: LlmMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
    ...(isRequestingFullPlan
      ? [{
          role: "system" as const,
          content: "【强制指令】学生正在索要完整实验方案。你必须严格按照以下九点模板输出，不得增减顺序，不得额外寒暄：\n一、提出问题\n二、做出假设\n三、实验目的\n四、实验材料\n五、实验步骤（用数字列表）\n六、实验记录表格（用Markdown表格）\n七、实验结果分析\n八、实验结论\n九、安全注意事项",
        }]
      : []),
    { role: "user", content: input.message },
  ];

  // Step 1: 插入审计日志（pending），写入 request_text
  const logId = await insertAiTaskLog({
    userId: actor.userId,
    userRole: actor.userRole,
    taskType: "generate_scheme",
    status: "pending",
    contextRefType: input.contextRefType,
    contextRefId: input.contextRefId,
    traceId: tid,
    requestText: input.message,
  });

  const startedAt = Date.now();

  try {
    // Step 2: 调用 LLM（首次失败时自动重试一次）
    let llmResult: { content: string; promptTokens: number; completionTokens: number };

    try {
      llmResult = await callLlm(messages, tid);
    } catch (firstErr) {
      if (firstErr instanceof AiChatServiceError && firstErr.retryable) {
        llmResult = await callLlm(messages, tid);
      } else {
        throw firstErr;
      }
    }

    const durationMs = Date.now() - startedAt;

    // Step 3: 更新日志为 success（含 response_text）
    await updateAiTaskLog(logId, {
      status: "success",
      promptTokens: llmResult.promptTokens,
      completionTokens: llmResult.completionTokens,
      durationMs,
      responseText: llmResult.content,
    });

    // Step 4: 写入草稿表
    const draftPayload = {
      type: "chat_reply",
      content: llmResult.content,
      userMessage: input.message,
      contextRefType: input.contextRefType ?? null,
      contextRefId: input.contextRefId ?? null,
    };

    const draftId = await insertAiTaskDraft({
      userId: actor.userId,
      taskType: "generate_scheme",
      draftJson: draftPayload,
      status: "pending",
      source: "web",
    });

    return {
      reply: llmResult.content,
      logId,
      draftId,
    };
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const origErr = err instanceof Error ? err : new Error(String(err));
    const errorMsg = err instanceof AiChatServiceError
      ? `[${err.code}] ${err.message}`
      : `[UNKNOWN] ${(err as Error)?.message ?? String(err)}`;

    console.error("[AiChatService] handleAiChat error:", errorMsg, "stack:", origErr.stack);

    await updateAiTaskLog(logId, {
      status: "failed",
      durationMs,
      errorMessage: errorMsg,
    });

    throw err;
  }
}

// ─── 主入口（流式）───────────────────────────────────

/**
 * 处理 AI 聊天请求（流式）
 * 通过 AsyncGenerator 逐步产出 token，调用方负责按 SSE 格式写入响应
 */
export async function* handleAiChatStream(
  input: AiChatRequest,
  actor: { userId: string; userRole: string; schoolLevelId?: string | null; userName?: string | null },
  traceId?: string,
): AsyncGenerator<string> {
  const tid = traceId ?? randomUUID();
  console.log("[handleAiChatStream] generating, tid:", tid.substring(0, 8));

  // 构建 system prompt + 对话历史 + 当前用户消息
  const systemPrompt = await resolveSystemPrompt(actor.userRole, actor.schoolLevelId, actor.userName);
  console.log("[handleAiChatStream] building history...");
  const history = await buildChatHistory(actor.userId, actor.userRole);
  console.log("[handleAiChatStream] history built, count:", history.length);

  // 检测"索要完整方案"意图，追加模板强制指令
  const isRequestingFullPlan = /完整方案|给我方案|给我.*方案|完整的方案/.test(input.message);

  const messages: LlmMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
    ...(isRequestingFullPlan
      ? [{
          role: "system" as const,
          content: "【强制指令】学生正在索要完整实验方案。你必须严格按照以下九点模板输出，不得增减顺序，不得额外寒暄：\n一、提出问题\n二、做出假设\n三、实验目的\n四、实验材料\n五、实验步骤（用数字列表）\n六、实验记录表格（用Markdown表格）\n七、实验结果分析\n八、实验结论\n九、安全注意事项",
        }]
      : []),
    { role: "user", content: input.message },
  ];

  // Step 1: 插入审计日志（pending），写入 request_text
  const logId = await insertAiTaskLog({
    userId: actor.userId,
    userRole: actor.userRole,
    taskType: "generate_scheme",
    status: "pending",
    contextRefType: input.contextRefType,
    contextRefId: input.contextRefId,
    traceId: tid,
    requestText: input.message,
  });

  const startedAt = Date.now();
  let durationMs = 0;
  console.log("[handleAiChatStream] log inserted:", logId.substring(0, 12));
  let fullResponse = "";
  let promptTokens = 0;
  let completionTokens = 0;
  let llmError: Error | null = null;

  try {
    // 首次调用，失败时自动重试一次
    let streamIter: AsyncGenerator<{ token: string; usage?: { promptTokens: number; completionTokens: number } }>;
    try {
      streamIter = callLlmStream(messages, tid);
    } catch (firstErr) {
      if (firstErr instanceof AiChatServiceError && firstErr.retryable) {
        streamIter = callLlmStream(messages, tid);
      } else {
        throw firstErr;
      }
    }

    console.log("[handleAiChatStream] meta yield, logId:", logId, "entering token loop...");
    // 发送 logId 让前端关联
    yield `data: ${JSON.stringify({ type: "meta", logId })}\n\n`;

    let tokenCount = 0;

    try {
      for await (const chunk of callLlmStream(messages, tid)) {
        tokenCount++;
        if (chunk.token) {
          fullResponse += chunk.token;
          yield `data: ${JSON.stringify({ type: "token", data: chunk.token })}\n\n`;
        }
        if (chunk.usage) {
          promptTokens = chunk.usage.promptTokens;
          completionTokens = chunk.usage.completionTokens;
        }
      }
    } catch (firstErr) {
      // 如果第一次调用失败且可重试，再试一次
      if (firstErr instanceof AiChatServiceError && firstErr.retryable) {
        console.log("[handleAiChatStream] retrying LLM call...");
        for await (const chunk of callLlmStream(messages, tid)) {
          tokenCount++;
          if (chunk.token) {
            fullResponse += chunk.token;
            yield `data: ${JSON.stringify({ type: "token", data: chunk.token })}\n\n`;
          }
          if (chunk.usage) {
            promptTokens = chunk.usage.promptTokens;
            completionTokens = chunk.usage.completionTokens;
          }
        }
      } else {
        throw firstErr;
      }
    }

    console.log("[handleAiChatStream] stream done, tokens:", tokenCount, "fullResponse len:", fullResponse.length);

    // Step 3: 写入草稿
    const draftPayload = {
      type: "chat_reply",
      content: fullResponse,
      userMessage: input.message,
      contextRefType: input.contextRefType ?? null,
      contextRefId: input.contextRefId ?? null,
    };

    console.log("[handleAiChatStream] inserting draft...");
    const draftId = await insertAiTaskDraft({
      userId: actor.userId,
      taskType: "generate_scheme",
      draftJson: draftPayload,
      status: "pending",
      source: "web",
    });
    console.log("[handleAiChatStream] draft inserted:", draftId);

    // 更新日志为 success
    durationMs = Date.now() - startedAt;
    await updateAiTaskLog(logId, {
      status: "success",
      promptTokens,
      completionTokens,
      durationMs,
      responseText: fullResponse,
    });

    // 发送完成事件，附带 draftId
    yield `data: ${JSON.stringify({ type: "done", draftId })}\n\n`;
  } catch (err) {
    llmError = err instanceof Error ? err : new Error(String(err));
    const durationMs = Date.now() - startedAt;
    const errorMsg = err instanceof AiChatServiceError
      ? `[${err.code}] ${err.message}`
      : `[UNKNOWN] ${(llmError as Error)?.message ?? String(err)}`;

    await updateAiTaskLog(logId, {
      status: "failed",
      durationMs,
      errorMessage: errorMsg,
    });

    yield `data: ${JSON.stringify({ type: "error", data: errorMsg })}\n\n`;
  }

  yield "data: [DONE]\n\n";
}
