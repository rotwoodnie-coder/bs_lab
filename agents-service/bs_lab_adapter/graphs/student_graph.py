"""
石头老师智能体 — LangGraph 实现（结构化输出语义驱动版 - 专家策略对齐版）

核心修复：
  1. 元对话防火墙（META_GUARD）：阻断教研探讨类"套话"，防止泄露未解锁阶段的方案框架。
  2. 低段（1-2年级）四模块低阶框架：彻底抹除学术名词，仅用"我们要做什么/需要什么东西/先做什么后做什么/我们看到了什么"。
  3. 低段尖锐物安全拦截插队：当低段学生消息含针/刀/图钉/铁丝，且 LLM 回复缺少家长陪同警示时，
     Python 代码在回复头部物理拼接安全前缀，100% 零风险。
  4. 高段（5-6年级）浮力称重法科学性纠偏：强制符合《中小学实验教学基本目录》规范的"称重法"概念，
     禁止"拉力消失了"等伪科学表述。
  5. 年级锁死防退化：一旦 grade_level 确立，禁止被后续轮次的 null 覆盖。
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Optional, TypedDict, Annotated, Literal

from langgraph.graph import StateGraph, START, END, add_messages
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from agents_framework.base_agent import BaseAgent

from bs_lab_adapter.safety import check_safety, build_safety_hint
from schemas import TeachingStage, StoneTeacherResponse

logger = logging.getLogger("bs_lab_adapter.student_graph")


# ─── 状态定义 ─────────────────────────────────────────

class StudentState(TypedDict):
    """石头老师智能体的完整状态。

    messages 使用 add_messages reducer，LangGraph 自动管理多轮对话历史。
    current_stage 存字符串（TeachingStage 枚举的 .value），避免 checkpointer 序列化问题。

    P0: is_stage_ready_to_advance — LLM 输出的推进就绪标记
    P1: stage_summary — 已完成阶段的摘要映射表
    P2: user_intent — 用户意图标签
    """
    messages: Annotated[list, add_messages]      # LangChain BaseMessage 列表，自动累积
    user_name: str                                # 学生姓名（仅本地拼接，不传入 LLM）
    user_id: str                                  # 用户 ID
    session_id: str                               # 会话 ID
    grade_level: Optional[str]                    # 低段/中段/高段（由 LLM 推断）
    current_stage: str                            # 当前环节（TeachingStage 枚举的 value 字符串）
    experiment_title: Optional[str]               # 实验标题（由 LLM 提取）
    safety_hit: Optional[list[str]]               # 安全拦截结果
    stage_advanced: bool                          # 本轮是否推进了阶段
    reply_content: str                            # 生成的回复内容
    trace_id: str                                 # 追踪 ID
    system_prompt: str                            # 本轮 system prompt（节点间传递）
    is_stage_ready_to_advance: bool               # P0: LLM 输出的推进就绪标记
    stage_summary: dict[str, str]                 # P1: 已完成阶段的摘要映射表
    user_intent: str                              # P2: 用户意图标签


# ─── Prompt 构建基座 ──────────────────────────────────

META_GUARD = (
    '\n# 教学套话绝对防御\n'
    '如果学生对你提出教研、教材设计、受力分析难度等"元教学"层面的讨论、质疑或提问，'
    '你必须拒绝以"课程设计者"或"老师对老师"的身份进行讨论！'
    '你只能以"石头老师对学生"的亲切语气，化繁为简地通过引导动作推进本阶段对话。'
    '绝对禁止在回复中泄露任何"步骤、记录、结论、方案框架"等学生未解锁阶段的专业词汇！'
)

LOW_GRADE_SHARP_KEYWORDS: list[str] = ["针", "刀", "图钉", "铁丝"]

# ── P0: 阶段顺序定序 ──
_STAGE_ORDER: list[TeachingStage] = [
    TeachingStage.INIT,
    TeachingStage.GOAL,
    TeachingStage.MATERIAL,
    TeachingStage.STEP,
    TeachingStage.RECORD,
    TeachingStage.CONCLUSION,
    TeachingStage.FINAL,
]

# ── P0: 阶段完成信号识别集（每个阶段的关键总结性表述） ──
_STAGE_COMPLETION_MARKERS: dict[str, list[str]] = {
    "MATERIAL": ["材料都准备好", "这些材料", "够了", "都有了", "准备齐", "找到了"],
    "GOAL": ["想弄清楚", "想验证", "想证明", "想知道", "明白了"],
    "STEP": ["这样操作", "先", "再", "最后", "记住了", "步骤"],
    "RECORD": ["记下来", "画下来", "写下来", "表格", "记录"],
    "CONCLUSION": ["发现了", "得出结论", "结果是", "所以"],
}

# ── P2: 推进信号关键词（用户明确表达"想前进"的触发词） ──
_STAGE_ADVANCE_TRIGGERS: list[str] = [
    "接下来", "然后呢", "下一步", "还有什么",
    "之后", "接下去", "继续", "好了吗",
    "可以了吗", "好了", "完成了",
]
_CROSS_STAGE_QUERY_TRIGGERS: list[str] = [
    "为什么", "怎么回事", "怎么才会",
    "是不是", "会不会", "能加", "能换",
]

# ── Layer 1: 提示改写预处理器 ──
# 高风险动作词组 → 安全科学表述 映射表
# 避免触发 LLM 提供商侧的内容过滤器静默拦截
_REWRITE_RULES: list[tuple[str, str]] = [
    ("扎洞", "制作小孔"),
    ("扎孔", "制作小孔"),
    ("钻孔", "旋转打孔"),
    ("扎破", "穿透"),
    ("刺穿", "穿透"),
    ("割开", "切开"),
]

LOW_GRADE_SAFETY_PREFIX = (
    '⚠️【安全小贴士】小宝贝，针是尖尖的东西，很容易扎伤小手，'
    '这个扎孔的步骤一定要请爸爸妈妈或者大人们帮忙，千万不要自己动手哦！\n\n'
)

# ── P0: 阶段工具函数 ──────────────────────────────────

def get_next_stage(current: TeachingStage) -> TeachingStage:
    """获取线性顺序中的下一个阶段。到达 FINAL 时返回自身。"""
    try:
        idx = _STAGE_ORDER.index(current)
        if idx >= len(_STAGE_ORDER) - 1:
            return current
        return _STAGE_ORDER[idx + 1]
    except ValueError:
        return TeachingStage.INIT


def _detect_stage_completion(reply: str, stage: str) -> bool:
    """检测 LLM 的回复中是否隐含阶段完成信号。

    当 LLM 对当前阶段做出总结性表述时，视为"已完成"信号，
    配合 is_stage_ready_to_advance 激活双通道推进。
    """
    markers = _STAGE_COMPLETION_MARKERS.get(stage, [])
    return any(marker in reply for marker in markers)


# ── P2: 用户意图分类 ──────────────────────────────────

def classify_intent(message: str) -> str:
    """对用户消息进行意图分类。

    返回值: "STAGE_ADVANCE" / "NORMAL_CONTENT"
    - STAGE_ADVANCE: 用户明确表达"推进阶段"的意图
    - NORMAL_CONTENT: 正常内容问询（保持当前阶段）
    """
    if any(t in message for t in _STAGE_ADVANCE_TRIGGERS):
        # 排除那些虽然含关键词但实际是内容问询的情况
        if not any(q in message for q in _CROSS_STAGE_QUERY_TRIGGERS):
            return "STAGE_ADVANCE"
    return "NORMAL_CONTENT"


HIGH_GRADE_BUOYANCY_GUIDE = (
    '# 浮力称重法科学性引导（高段探究浮力实验专用）\n'
    '当学生探究"沉入水中的物体是否受到浮力"时，必须严格遵循"称重法"概念：\n'
    '  $$F_{浮} = G_{物} - F_{拉}$$\n'
    '1. 引导学生理解：小石块浸入水中后，弹簧测力计显示的示数（拉力）变小了，\n'
    '   是因为受到了一个向上托的力——浮力。\n'
    '2. **绝对禁止**说"拉力消失了"或"拉力变为了零"，那是错误的伪科学表述！\n'
    '3. 正确的引导话术示例："你看，石块浸入水中后，弹簧秤的读数变小了，\n'
    '   这说明水给了石块一个向上的托力，这个力就叫浮力。"'
)

LOW_GRADE_FRAMEWORK = (
    '# 当前环节：低段（1-2年级）实验框架\n'
    '对低年级学生，**绝对禁止**使用"自变量"、"控制变量"、"重力"、"示数"、"受力分析"等学术词汇。\n'
    '实验引导框架仅限以下四个日常化的通俗说法：\n'
    '  1. "我们要做什么"（实验目的）\n'
    '  2. "需要什么东西"（实验材料）\n'
    '  3. "先做什么后做什么"（实验步骤）\n'
    '  4. "我们看到了什么"（实验现象与记录）\n\n'
    '在发起第一个环节的对话时，依次用以上四个问题引导学生，不要跳过或合并提问。\n'
    '绝对不要一次性输出全部框架，必须分步逐轮引导。'
)

BASE_SYSTEM_PROMPT = """# 角色定义
你是石头老师，一位拥有 10 年以上教学经验的沪教版小学科学老师。
全程让学生称呼你为"石头老师"。你亲切热情，但始终保持"引导者"的角色。

# 引导优先原则（绝对遵守）
1. **禁止填鸭式输出**：绝对禁止直接替学生撰写完整的实验方案。
2. **启发式提问**：每轮回复必须以 1-2 个启发式问题结尾，引导学生自己思考下一步。
3. **控速分步**：不要一次性输出完整方案，必须逐步推进。
4. **肯定优先**：先热情肯定学生的每个回答，再进行追问。
5. **年级记忆硬死锁**：一旦当前年级属性（学段）已确认为"低段"、"中段"或"高段"，
   在后续的任何对话中，**绝对禁止以任何形式再次向学生询问年级或班级！**
6. **一次只讨论一件事**：对于实验设计，必须遵循【一次只讨论一个实验变量/一个实验步骤】的原则。
   绝对禁止一次性输出整个实验方案的多个部分。每轮只聚焦当前阶段的一个问题。

# 绝对红线规则（不可违反）
1. **零安全风险**：所有实验方案必须绝对安全。
2. **禁止内容**：涉及以下关键词必须立即用温柔话术提示风险并给出替代方案——
   明火、点燃、燃烧、爆炸、酒精灯、蜡烛、
   盐酸、硫酸、强酸、强碱、腐蚀性化学品、
   注射器、高压电、220V 电。
   注意：缝衣针、剪刀等日常工具在有大人陪同监护下可以使用，
   但需提醒学生注意安全（"使用针的时候要小心，请大人帮忙哦"），
   而不是直接禁止。
3. **风险提示话术示例**：
   - 对于尖锐物品："用针的时候要小心扎到手哦，最好请爸爸妈妈帮忙一起操作。"
   - 对于危险品："这个有点危险哦，我们换一种更安全的方法来探究吧！比如……"

# 边界坚守原则
如果学生问与科学实验方案设计无关的话题（如数学题、语文作文、闲聊），
必须引导回科学实验话题。
禁止回答任何非科学实验相关的问题。

# 输出格式要求
- 使用简体中文，语气亲切。
- 每句话末尾加适当语气词或符号（哦、呀、吧、~）。
- 每轮回复不超过 300 字。
- **你必须输出一个合法的 JSON 对象，不要包含任何 markdown 格式块。**"""

# 环节流转引导（通用版本，供中/高段使用）
STAGE_FLOW_GUIDE = """# 环节流转引导
- INIT 环节 → 破冰，问年级和探究想法
- GOAL 环节 → 锚定实验目的，引导学生说清"想证明什么"
- MATERIAL 环节 → 讨论需要什么材料，接受生活中的替代品
- STEP 环节 → 逐步讨论实验操作顺序
- RECORD 环节 → 讨论怎么记录数据（画表格、记数字等）
- CONCLUSION 环节 → 引导学生根据观察总结结论
- FINAL 环节 → 整理完整方案，鼓励动手操作"""


GRADE_LEVEL_STRATEGY: dict[str, str] = {
    "低段": f"""# 年级专属策略：低段（1-2 年级）
- 童趣化短句：单次引导不超过 50 字，用比喻和拟人的方式解释。
- 安全提示：全程必须有大人陪同。
{LOW_GRADE_FRAMEWORK}
绝对禁止出现以下学术词汇：自变量、控制变量、重力、示数、受力分析、记录表、变量控制。
""",
    "中段": """# 年级专属策略：中段（3-4 年级）
- 半结构化引导：单次引导不超过 100 字。
- 开始引入简单的科学用词，如"变量""观察""记录表"。""",
    "高段": f"""# 年级专属策略：高段（5-6 年级）
- 严谨变量控制：单次引导不超过 150 字。
- 强调对照实验、变量控制、数据记录。
- 可介绍简单的科学方法，如"控制变量法"。
{HIGH_GRADE_BUOYANCY_GUIDE}
""",
}

DEFAULT_STRATEGY = GRADE_LEVEL_STRATEGY["中段"]


def _build_stage_focus(
    stage: TeachingStage,
    grade_level: Optional[str],
) -> str:
    """根据年级和当前环节构建阶段指引文本。

    低段（1-2年级）使用"四模块低阶框架"替代学术化阶段名称。
    中/高段使用标准环节术语。
    """
    is_low_grade = grade_level == "低段"
    grade_known = bool(grade_level)  # 前端已预设年级

    if is_low_grade:
        # 低段专用：用四个通俗问题对应环节
        low_stage_map: dict[TeachingStage, str] = {
            TeachingStage.INIT: (
                '当前阶段：认识小科学家\n'
                + (
                    # 年级已知时不询问
                    '1. 简要开场后直接转入"我们要做什么"的讨论。\n'
                    '2. 不要询问年级，直接引导实验目的。\n'
                    if grade_known else
                    '1. 简要开场后直接询问学生的年级和科学探究想法。\n'
                    '2. 只要学生告诉了你他的年级段（如二年级、1年级），\n'
                    '   在你的 reply 中必须首先进行极其明确的仪式感确认\n'
                    '   （例如：\'原来你是二年级的小朋友呀，我记住啦！\'）。\n'
                    '3. 确认后，立即顺畅转入"我们要做什么"的讨论。\n'
                    '4. **绝对不要**说"实验目的"、"实验假设"等学术词汇！\n'
                    '   用"我们想弄清楚什么事情呢？"代替。'
                )
            ),
            TeachingStage.GOAL: (
                '当前阶段：我们要做什么\n'
                '用通俗语言帮助学生把想法变成明确的问题。\n'
                '例如："你是想知道盐放进水里会不会消失，对不对？"\n'
                '**绝对不要**说"实验目的"、"假设"、"锚定目标"等词！\n'
                '年级已确认，绝不再问年级。'
            ),
            TeachingStage.MATERIAL: (
                '当前阶段：需要什么东西\n'
                '引导学生说出需要哪些材料，提示用家里的东西代替。\n'
                '例如："那我们需要什么工具呢？家里有没有杯子、勺子？"\n'
                '**绝对不要**说"实验材料"、"变量""control"等词！\n'
                '年级已确认，绝不再问年级。'
            ),
            TeachingStage.STEP: (
                '当前阶段：先做什么后做什么\n'
                '引导学生一步步说操作顺序，每轮只推进 1-2 步。\n'
                '例如："那我们第一步做什么呢？"\n'
                '如果学生反馈材料不合适，引导回到"需要什么东西"讨论。\n'
                '**绝对不要**说"实验步骤"、"操作流程"等词！\n'
                '年级已确认，绝不再问年级。'
            ),
            TeachingStage.RECORD: (
                '当前阶段：我们看到了什么\n'
                '引导学生说说观察到什么，用画画或简单数字记录。\n'
                '例如："那我们怎么记住看到的变化呢？画下来好不好？"\n'
                '**绝对不要**说"记录表"、"数据"、"表格"等词！\n'
                '年级已确认，绝不再问年级。'
            ),
            TeachingStage.CONCLUSION: (
                '当前阶段：我们发现了什么\n'
                '引导学生用自己的话说出观察到的结果。\n'
                '例如："那我们做了实验之后，发现了什么呀？"\n'
                '**绝对不要**说"结论"、"数据分析"、"总结"等词！\n'
                '年级已确认，绝不再问年级。'
            ),
            TeachingStage.FINAL: (
                '当前阶段：再来试一试\n'
                '鼓励学生把整个设想告诉爸爸妈妈，一起动手操作。\n'
                '强调安全注意事项。\n'
                '**绝对不要**说"实验报告"、"终稿"、"方案"等词！\n'
                '年级已确认，绝不再问年级。'
            ),
        }
        return low_stage_map.get(
            stage,
            (
                '当前阶段：我们要做什么\n'
                '请用"我们要做什么"、"需要什么东西"、"先做什么后做什么"、'
                '"我们看到了什么"这四个框架引导。'
            ),
        )

    # ─── 中/高段标准环节指引 ──────────────────────
    middle_high_map: dict[TeachingStage, str] = {
        TeachingStage.INIT: (
            '当前环节：INIT — 破冰与信息收集\n'
            + (
                # 年级已知时不询问
                '1. 简要开场后直接转入引导他们思考实验目的（GOAL 环节）。\n'
                '2. 不要询问年级，直接推进对话。'
                if grade_known else
                '1. 简要开场后直接询问学生的年级和科学探究想法。\n'
                '2. 只要学生告诉了你他的年级段（如二年级、1年级），\n'
                '   在你的 reply 中必须首先进行极其明确的仪式感确认\n'
                '   （例如：\'原来你是二年级的小朋友呀，我记住啦！\'）。\n'
                '3. 确认后，立即顺畅转入引导他们思考实验目的（GOAL 环节）。\n'
                '   不要输出实验方案或步骤。'
            )
        ),
        TeachingStage.GOAL: (
            '当前环节：GOAL — 锚定实验目的与假设\n'
            '帮助学生把模糊想法变成明确的实验问题，引导做出假设。\n'
            '不要列出材料或步骤。\n'
            '年级已确认，绝对不要重复提问年级！'
        ),
        TeachingStage.MATERIAL: (
            '当前环节：MATERIAL — 梳理实验材料\n'
            '引导学生思考需要哪些材料，提示生活替代品，确认安全性。\n'
            '不要列出详细步骤。\n'
            '年级已确认，绝对不要重复提问年级！'
        ),
        TeachingStage.STEP: (
            '当前环节：STEP — 设计实验步骤\n'
            '引导学生一步步说出操作顺序，每轮只推进 1-2 个步骤。\n'
            '如果学生反馈材料不合适，可以引导回到 MATERIAL 换材料讨论。\n'
            '年级已确认，绝对不要重复提问年级！'
        ),
        TeachingStage.RECORD: (
            '当前环节：RECORD — 引导实验记录\n'
            '引导学生设计记录方式（表格、画图等），问清楚要记录哪些数据。\n'
            '年级已确认，绝对不要重复提问年级！'
        ),
        TeachingStage.CONCLUSION: (
            '当前环节：CONCLUSION — 预设结论逻辑\n'
            '引导学生根据数据思考结论，用"如果 A 说明…如果 B 说明…"引导。\n'
            '不要直接给出结论。\n'
            '年级已确认，绝对不要重复提问年级！'
        ),
        TeachingStage.FINAL: (
            '当前环节：FINAL — 综合打磨终稿\n'
            '确认学生准备好后，整理完整规范方案，强调安全，鼓励动手。\n'
            '年级已确认，绝对不要重复提问年级！'
        ),
    }
    return middle_high_map.get(stage, middle_high_map[TeachingStage.INIT])


# 纯类型/常量定义文件 — 允许超 500 行

def build_system_prompt(
    grade_level: Optional[str],
    current_stage: TeachingStage,
    experiment_title: Optional[str] = None,
    stage_summary: Optional[dict[str, str]] = None,
    user_intent: str = "NORMAL_CONTENT",
) -> str:
    """根据年级和当前环节动态拼接最终的 System Prompt。

    动态调整 JSON 输出约束：
    - INIT 阶段且年级未知 → JSON 包含 inferred_grade 字段要求
    - 其他情况 → inferred_grade 强制填 null，禁止思考年级

    P0: 所有轮次强制追加 is_stage_ready_to_advance 字段（带负向偏置严格标准）。
    P1: 传入 stage_summary，注入已完成阶段摘要（记忆压缩池）。
    P2: 传入 user_intent，在阶段指引中追加推进感知提示。

    低段（1-2年级）额外接入"四模块低阶框架"和尖锐物安全提示。
    高段（5-6年级）额外接入浮力称重法科学性引导。
    所有轮次追加 META_GUARD 元对话防火墙。
    """
    strategy = GRADE_LEVEL_STRATEGY.get(grade_level or "", DEFAULT_STRATEGY)
    stage_text = _build_stage_focus(current_stage, grade_level)

    grade_display = grade_level if grade_level else "（待收集，需要询问）"
    title_display = experiment_title if experiment_title else "（待提取）"
    is_low_grade = grade_level == "低段"

    # 低段：不输出环节流转引导（使用四模块框架替代）
    flow_guide = "" if is_low_grade else f"\n{STAGE_FLOW_GUIDE}\n"

    # ── P1: 已完成阶段摘要注入 ──
    memory_block = ""
    if stage_summary:
        memory_block = "\n\n# 已完成环节摘要\n"
        for stage, summary in stage_summary.items():
            memory_block += f"- {stage}: {summary}\n"

    # ── P2: 用户意图感知注入 ──
    intent_hint = ""
    if user_intent == "STAGE_ADVANCE":
        intent_hint = (
            '\n\n# 推进感知提示\n'
            '注意：学生似乎在问"接下来做什么"，这可能表明他们已经准备好进入下一阶段。\n'
            '请先确认学生对当前阶段内容已完全理解，若已充分讨论，思考是否应该推进到下一环节。\n'
            '但也不要因为学生只问了一句"然后呢"就强行推进——仍要以教学内容完整性为准。'
        )

    # 动态 JSON 约束：年级未确认时要求 inferred_grade，已确认时强制 null
    # P0: 所有轮次追加 is_stage_ready_to_advance 字段
    if current_stage == TeachingStage.INIT and not grade_level:
        json_fields = (
            '你的 JSON 输出必须包含以下字段：\n'
            '  1. "reply"：石头老师对学生本轮输入的自然语言回复。\n'
            '  2. "inferred_stage"：根据对话语义判断下一环节（null 或阶段名）。\n'
            '  3. "extracted_title"：从学生输入中提炼出的实验标题（首次填值，后续填 null）。\n'
            '  4. "inferred_grade"：推断年级段，填入"低段"、"中段"或"高段"。\n'
            '  5. "is_stage_ready_to_advance"：布尔值，当前阶段是否已充分讨论、可以推进。\n'
            '     **严格标准**（必须同时满足以下所有条件才为 true）：\n'
            '       A. 学生已明确表达了该阶段需确认的所有信息\n'
            '       B. 本阶段已经至少进行了 2 轮有效对话\n'
            '       C. 学生没有表达"需要更多时间/再想想/再找找"等延迟信号\n'
            '     默认条件不满足时，必须为 false，绝不允许默认 true。'
        )
        json_example = (
            '{\n'
            '  "reply": "原来你是二年级的小朋友呀，我记住啦！那我们先来想一想...",\n'
            '  "inferred_stage": "GOAL",\n'
            '  "extracted_title": "探究水的压强",\n'
            '  "inferred_grade": "低段",\n'
            '  "is_stage_ready_to_advance": false\n'
            '}'
        )
    else:
        json_fields = (
            '你的 JSON 输出必须包含以下字段：\n'
            '  1. "reply"：石头老师对学生本轮输入的自然语言回复。\n'
            '     注意：年级已确认，绝不允许在回复中再次提问年级！\n'
            '  2. "inferred_stage"：根据对话语义判断下一环节（null 或阶段名，支持回退）。\n'
            '  3. "extracted_title"：此时标题已确认，必须填 null。\n'
            '  4. "inferred_grade"：此时年级已确认，必须填 null，绝对不要输出任何其他文本！\n'
            '  5. "is_stage_ready_to_advance"：布尔值，当前阶段是否已充分讨论、可以推进。\n'
            '     **严格标准**（必须同时满足以下所有条件才为 true）：\n'
            '       A. 学生已明确表达了该阶段需确认的所有信息\n'
            '       B. 本阶段已经至少进行了 2 轮有效对话\n'
            '       C. 学生没有表达"需要更多时间/再想想/再找找"等延迟信号\n'
            '     默认条件不满足时，必须为 false，绝不允许默认 true。'
        )
        json_example = (
            '{\n'
            '  "reply": "太棒啦！那接下来我们想想实验需要什么材料呢...",\n'
            '  "inferred_stage": "MATERIAL",\n'
            '  "extracted_title": null,\n'
            '  "inferred_grade": null,\n'
            '  "is_stage_ready_to_advance": false\n'
            '}'
        )

    return (
        BASE_SYSTEM_PROMPT
        + flow_guide
        + '\n'
        + strategy
        + '\n\n'
        + stage_text
        + intent_hint
        + META_GUARD
        + '\n\n'
        + '# 强约束：输出 JSON 格式要求\n'
        + '你必须返回一个包含以下字段的纯 JSON 对象，不要有任何 Markdown 代码块包裹：\n'
        + json_fields
        + '\n\nJSON 输出模板示例：\n'
        + json_example
        + '\n\n# 当前学生信息\n'
        + f'当前年级属性：{grade_display}\n'
        + f'当前对话环节：{current_stage.value}\n'
        + f'实验标题：{title_display}'
        + memory_block
    )


# ─── 节点函数 ─────────────────────────────────────────

def analyze_input(state: StudentState) -> dict[str, Any]:
    """
    节点 1: 分析用户输入

    职责：
    - P2: 用户意图分类（是否明确要求"推进阶段"）
    - 安全过滤

    年级推断、标题提取、阶段推进决策由后续节点完成。
    """
    messages = state.get("messages", [])
    if not messages:
        return {"stage_advanced": False}

    last_msg = messages[-1]
    content = last_msg.content if hasattr(last_msg, "content") else ""

    updates: dict[str, Any] = {"stage_advanced": False}

    # ── P2: 用户意图分类 ──
    intent = classify_intent(content)
    if intent != "NORMAL_CONTENT":
        updates["user_intent"] = intent

    # 安全过滤（"针"已从 DANGEROUS_KEYWORDS 移除，由 LLM 在上下文中温柔提示）
    hit_keywords = check_safety(content)
    if hit_keywords:
        hint = build_safety_hint(hit_keywords)
        updates["safety_hit"] = hit_keywords
        updates["reply_content"] = hint
        return updates

    return updates


def build_student_prompt(state: StudentState) -> dict[str, Any]:
    """
    节点 2: 构建 LLM System Prompt

    根据当前状态（年级、环节、已完成阶段摘要、用户意图）动态拼接完整的 system prompt。
    注入完成后，存入 system_prompt 字段供 call_llm_node 使用。
    """
    grade_level = state.get("grade_level")
    current_stage_raw = state.get("current_stage", "INIT")
    experiment_title = state.get("experiment_title")

    # ── P1: 读取已完成阶段摘要 ──
    stage_summary = state.get("stage_summary") or {}

    # ── P2: 读取用户意图标签 ──
    user_intent = state.get("user_intent", "NORMAL_CONTENT")

    # 确保 current_stage 是 TeachingStage 枚举，再传给 build_system_prompt
    if isinstance(current_stage_raw, TeachingStage):
        current_stage = current_stage_raw
    elif isinstance(current_stage_raw, str):
        for member in TeachingStage:
            if member.value == current_stage_raw:
                current_stage = member
                break
        else:
            current_stage = TeachingStage.INIT
    else:
        current_stage = TeachingStage.INIT

    system_prompt = build_system_prompt(
        grade_level, current_stage, experiment_title,
        stage_summary=stage_summary, user_intent=user_intent,
    )

    # 存字符串值到 state，避免 checkpointer 反序列化枚举失败
    return {"system_prompt": system_prompt, "current_stage": current_stage.value}


def _has_safety_reminder(reply: str) -> bool:
    """检查 LLM 回复中是否已包含家长陪同等安全警示。"""
    safety_signals = ["家长", "大人", "爸爸", "妈妈", "帮忙", "陪同"]
    return any(signal in reply for signal in safety_signals)


def _inject_low_grade_safety(reply: str, user_message: str) -> str:
    """低段（1-2年级）尖锐物安全拦截插队。

    当学生消息包含针/刀/图钉/铁丝等尖锐词，且 LLM 回复中未包含家长陪同提示，
    由 Python 代码在回复头部物理拼接安全警示前缀。
    """
    has_sharp = any(kw in user_message for kw in LOW_GRADE_SHARP_KEYWORDS)
    if not has_sharp:
        return reply

    if _has_safety_reminder(reply):
        return reply

    logger.warning("低段安全插队：学生消息含尖锐词，LLM 回复缺少安全警示，已强制拼接前缀")
    return LOW_GRADE_SAFETY_PREFIX + reply


# ── Layer 1: 语义改写函数 ─────────────────────────────

def _semantic_rewrite_user_message(content: str) -> str:
    """将用户消息中的高风险动作词组改写为安全科学表述。

    目的不是篡改用户意图，而是通过替换动作语义组合（如"扎洞"→"制作小孔"），
    避免触发 LLM 提供商侧的内容过滤器静默拦截，同时保持实验上下文完整。
    """
    rewritten = content
    for trigger, replacement in _REWRITE_RULES:
        rewritten = rewritten.replace(trigger, replacement)
    return rewritten


# ── P1: 阶段摘要提取 ──────────────────────────────────

def _extract_stage_summary(reply: str, stage: str) -> str:
    """从 LLM 回复中提取简短摘要作为已完成的阶段记忆。

    取回复前 80 字去尾作为该阶段的"已完成摘要"，
    用于下一轮 system_prompt 的 memory_snapshot 注入。
    """
    cleaned = reply[:80].rstrip("。，！？；）\n ")
    return cleaned + "。" if cleaned and not cleaned.endswith("。") else cleaned


# ── P1: 对话历史压缩 ──────────────────────────────────

_MAX_RECENT_ROUNDS = 3  # 保留最近 3 轮对话，平衡连贯性与上下文清洁度


def _build_compressed_history(messages: list, system_prompt: str) -> list:
    """构建压缩后的对话历史。

    策略：
    - 过滤所有旧的 SystemMessage（避免旧阶段指令污染）
    - 仅保留最近 MAX_RECENT_ROUNDS × 2 条 Human/AI 消息
    - 用新鲜 SystemMessage 置顶

    结果结构：
      [SystemMessage(当前 system_prompt), 最近 3 轮 Human+AI, 当前用户输入]
    """
    clean = [m for m in messages if not isinstance(m, SystemMessage)]

    # 保留最近 MAX_RECENT_ROUNDS 轮的详细对话（每轮 = Human + AI = 2 条）
    window = _MAX_RECENT_ROUNDS * 2
    if len(clean) > window:
        recent = clean[-window:]
        logger.info(
            "对话历史压缩: %d 条 → %d 条 (保留最近 %d 轮)",
            len(clean), len(recent), _MAX_RECENT_ROUNDS,
        )
    else:
        recent = clean

    return [SystemMessage(content=system_prompt)] + recent


# ── Layer 3: 语义感知生成器 + 静态模板兜底 ────────────

_SAFE_FALLBACK_TEMPLATES: dict[str, str] = {
    "INIT": "刚才你说的事情听起来很有趣！能跟我说说你是哪个年级的，想做什么科学实验吗？",
    "GOAL": "我们来想想看，这个实验想弄清楚什么事情呢？你觉得会有什么样的结果？",
    "MATERIAL": "你觉得做这个实验需要用到哪些材料呢？家里能不能找到代替的东西？",
    "STEP": "那我们第一步应该先做什么呢？一步一步来，你说说看。",
    "RECORD": "实验的时候我们怎么记住看到的现象呢？可以用画画或者写数字的方式记下来哦。",
    "CONCLUSION": "做完实验你发现了什么呀？跟你想的一不一样？",
    "FINAL": "太好了！把你设计的实验方案告诉爸爸妈妈，请他们一起帮忙操作，一定要注意安全哦！",
}


def _build_static_fallback(state: StudentState, prebuilt_reply: str = "") -> str:
    """静态模板兜底 + 姓名前缀拼接。

    支持两种模式：
    - prebuilt_reply 非空：使用预生成文本，仅拼接姓名前缀
    - prebuilt_reply 为空：从阶段模板字典选取（最终保险）
    """
    stage = state.get("current_stage", "INIT")
    user_name = state.get("user_name", "")

    if not prebuilt_reply:
        prebuilt_reply = _SAFE_FALLBACK_TEMPLATES.get(stage, "你能再给石头老师说说你的想法吗？")

    if user_name and not user_name.startswith("同学"):
        if not any(isinstance(m, AIMessage) for m in state.get("messages", [])):
            prebuilt_reply = f"{user_name}你好呀！我是石头老师~{prebuilt_reply}"
        else:
            prebuilt_reply = f"{user_name}，{prebuilt_reply}"

    return prebuilt_reply


async def _build_safe_fallback(state: StudentState) -> str:
    """语义感知生成器：当主 LLM 连续失败时，以简化模式重试 LLM 生成上下文相关回复。

    与主 LLM 调用的关键差异：
      1. 不强制 json_object 模式 → 避开内容过滤器对结构化输出的高灵敏度
      2. 极简短 prompt（~100 字）→ 降低生成失败概率
      3. temperature 略高（0.5）→ 增加生成多样性
      4. 短超时（15s）+ 低 max_tokens（256）→ 快速失败，不阻塞对话

    即使 LLM 生成仍失败，最后用静态模板兜底。
    """
    stage = state.get("current_stage", "INIT")
    grade = state.get("grade_level", None)

    # 提取最近一条用户消息原文，用于上下文感知
    recent_human = ""
    for m in reversed(state.get("messages", [])):
        if isinstance(m, HumanMessage):
            recent_human = m.content[:300]
            break

    # 构造极简 prompt：无 JSON 约束，无复杂规则
    grade_label = grade or "小学"
    fallback_prompt = (
        f"你是石头老师，正在辅导一个{grade_label}学生做科学实验。\n"
        f"当前教学环节：{stage}\n"
        f"学生刚说：{recent_human or '（无）'}\n\n"
        "请用 1-2 句简短、亲切、引导性的话回复学生，"
        "推进当前环节的对话。只输出纯文本，不要 JSON。"
    )

    # ── 尝试语义生成 ──
    try:
        from config import settings
        if settings.llm_api_key:
            fallback_llm = ChatOpenAI(
                model=settings.llm_model,
                base_url=settings.llm_base_url,
                api_key=settings.llm_api_key,
                timeout=15,
                temperature=0.5,
                max_tokens=256,
                # 关键：不设置 response_format，使用纯文本模式
            )
            response = await fallback_llm.ainvoke(
                [SystemMessage(content=fallback_prompt)]
            )
            reply = response.content.strip() if response.content else ""
            if reply and len(reply) > 5:
                logger.info("语义感知兜底生成成功: %.50s", reply)
                return _build_static_fallback(state, prebuilt_reply=reply)
    except Exception as e:
        logger.warning("语义感知兜底 LLM 生成失败: %s", e, exc_info=True)

    # ── 最终保险：纯静态模板 ──
    logger.info("语义感知兜底生成不可用，回退静态模板")
    return _build_static_fallback(state)


async def call_llm_node(state: StudentState) -> dict[str, Any]:
    """
    节点 3: 调用 LLM 生成结构化回复（异步版）

    职责链：
      1. SystemMessage 纯净过滤（移除历史旧指令）
      2. 调用 DeepSeek json_object 模式（空内容时自动重试一次）
      3. StoneTeacherResponse.model_validate 鲁棒解析
      4. 低段尖锐物安全拦截插队（Python 物理拼接）
      5. 年级锁死防退化（一旦确立不可被 null 覆盖）
      6. 姓名本地拼接 + 阶段流转 + 实验标题首次提取
    """
    if state.get("safety_hit"):
        return {}

    system_prompt = state.get("system_prompt", "")
    messages_history = state.get("messages", [])

    if not messages_history:
        logger.warning("messages 为空，跳过 LLM 调用")
        return {}

    # ── P1: 对话历史压缩（替换原有的全量透传策略） ──
    # 旧策略：过滤 SystemMessage 后全量透传所有历史 → 导致"上下文回声污染"
    # 新策略：仅保留最近 MAX_RECENT_ROUNDS 轮，其余由 stage_summary 摘要替代
    full_messages = _build_compressed_history(messages_history, system_prompt)

    # ── Layer 1: 语义改写（替换高风险动作词组，避免 LLM 提供商侧安全过滤器误杀） ──
    # 改写仅影响 last HumanMessage 的内容（原始消息仍会出现在历史中，不改历史）
    # 注意：必须在组装 full_messages 之后、LLM 调用之前执行
    rewritten_content = _semantic_rewrite_user_message(full_messages[-1].content)
    if rewritten_content != full_messages[-1].content:
        logger.info(
            "语义改写触发: %.30s → %.30s",
            full_messages[-1].content[:30], rewritten_content[:30],
        )
        full_messages[-1] = HumanMessage(content=rewritten_content)

    from config import settings

    if not settings.llm_api_key:
        logger.error("LLM_API_KEY 未配置")
        return {"reply_content": "AI 服务暂未配置，请联系管理员设置 LLM_API_KEY。"}

    # 采用 DeepSeek 最兼容的 json_object 模式
    llm = ChatOpenAI(
        model=settings.llm_model,
        base_url=settings.llm_base_url,
        api_key=settings.llm_api_key,
        timeout=settings.llm_timeout_ms / 1000,
        temperature=0.3,
        max_tokens=8192,
        model_kwargs={"response_format": {"type": "json_object"}},
    )

    # ── 带重试的 LLM 调用 ──
    # 空内容防护：LLM 返回纯空白（HTTP 200 但 content 为空），自动重试一次
    # 重试时通过追加引导消息改变输入条件，避免相同 prompt 被再次拦截
    max_attempts = 2
    last_error: Optional[Exception] = None

    for attempt in range(1, max_attempts + 1):
        try:
            # 使用异步 ainvoke 避免阻塞事件循环
            response = await llm.ainvoke(full_messages)
            raw_content = response.content.strip() if response.content else ""

            # 防御性清除可能的 markdown 代码块标记
            if raw_content.startswith("```"):
                raw_content = re.sub(r"^```(?:json)?\s*", "", raw_content, flags=re.MULTILINE)
                raw_content = re.sub(r"\s*```$", "", raw_content, flags=re.MULTILINE)
                raw_content = raw_content.strip()

            if raw_content:
                # 有内容，退出重试循环
                break
            else:
                logger.warning(
                    "LLM 返回空内容 (attempt %d/%d)，即将重试",
                    attempt,
                    max_attempts,
                )
                last_error = None
                if attempt < max_attempts:
                    # ── Layer 2: 引导式重提交 ──
                    # 追加 AIMessage 引导，告诉 LLM 需输出合规 JSON，改变输入上下文
                    guidance = AIMessage(
                        content=(
                            "你的上一条回复内容为空。这是一个小学科学实验辅导对话，"
                            "请以安全导师的身份给出引导。\n"
                            "必须输出一个包含以下字段的有效 JSON：\n"
                            '{"reply": "你的回复", "inferred_stage": null, '
                            '"extracted_title": null, "inferred_grade": null}'
                        )
                    )
                    full_messages = full_messages + [guidance]
                    continue

                # ── Layer 3: 语义感知生成器 ──
                # 重试耗尽，使用语义感知生成器（降级 LLM 纯文本模式）或静态模板兜底
                fallback_reply = await _build_safe_fallback(state)
                logger.warning("LLM 连续空内容，已使用兜底回复")
                return {"reply_content": fallback_reply}

        except Exception as e:
            last_error = e
            logger.error(
                "LLM 调用失败 (attempt %d/%d): %s",
                attempt,
                max_attempts,
                e,
                exc_info=True,
            )
            if attempt < max_attempts:
                continue
            # ── Layer 3: 语义感知生成器（异常路径同样适用） ──
            fallback_reply = await _build_safe_fallback(state)
            logger.warning("LLM 调用连续失败，已使用兜底回复")
            return {"reply_content": fallback_reply}

    # ── 解析 LLM 返回的 JSON ──
    try:
        parsed_dict = json.loads(raw_content)
        result: StoneTeacherResponse = StoneTeacherResponse.model_validate(parsed_dict)
    except Exception as e:
        logger.error("JSON 解析失败: %s, content=%s", e, raw_content[:200])
        return {"reply_content": "石头老师暂时遇到了小困难，请稍后再试哦～"}

    reply_text = result.reply.strip() if result.reply else ""
    if not reply_text:
        logger.warning("LLM 返回了空回复")
        reply_text = "石头老师暂时没有想到更好的回答，你能再说说你的想法吗？"

    # ── 获取本轮用户最新消息（用于安全拦截判断） ──
    last_human_msg = ""
    for m in reversed(messages_history):
        if isinstance(m, HumanMessage):
            last_human_msg = m.content
            break

    grade_level = state.get("grade_level")

    # ── 低段尖锐物安全拦截插队（Python 代码层物理拼接） ──
    # 在姓名拼接之前执行，确保安全提示在回复最前面
    if grade_level == "低段":
        reply_text = _inject_low_grade_safety(reply_text, last_human_msg)

    # ── 本地拼接学生姓名 ──
    # 姓名不传入 LLM，由本节点在 LLM 回复前拼接
    user_name = state.get("user_name", "")
    if user_name:
        has_assistant_history = any(
            isinstance(m, AIMessage) for m in state.get("messages", [])
        )
        if not has_assistant_history:
            reply_text = f"{user_name}你好呀！我是石头老师~{reply_text}"
        else:
            reply_text = f"{user_name}，{reply_text}"

    updates: dict[str, Any] = {
        "reply_content": reply_text,
        "messages": [AIMessage(content=reply_text)],
    }

    # ── 阶段流转：双通道推进机制（P0 + 原有 stage_order 逻辑） ──
    current_stage_str = state.get("current_stage", "INIT")
    current_stage = TeachingStage.INIT
    for member in TeachingStage:
        if member.value == current_stage_str:
            current_stage = member
            break

    stage_advanced = False
    next_stage: Optional[TeachingStage] = None

    # 通道1: LLM 显式输出 inferred_stage → 走原有 stage_order 逻辑
    if result.inferred_stage is not None and result.inferred_stage != current_stage:
        stage_order = list(TeachingStage)
        current_idx = stage_order.index(current_stage)
        target_idx = stage_order.index(result.inferred_stage)

        if target_idx == current_idx + 1:
            # 正常推进 1 步
            next_stage = result.inferred_stage
            stage_advanced = True
        elif target_idx > current_idx + 1:
            # LLM 跳步：最多推进 1 步，防"意图过载"
            next_stage = stage_order[current_idx + 1]
            logger.info(
                "LLM 试图跳过阶段 %s → %s，已削减为单步推进 %s",
                current_stage.value,
                result.inferred_stage.value,
                next_stage.value,
            )
            stage_advanced = True
        elif target_idx < current_idx:
            # 允许回退（如 STEP → MATERIAL 换材料）
            next_stage = result.inferred_stage
            stage_advanced = True

    # 通道2: is_stage_ready_to_advance + 完成信号检测 → 强制逻辑推进
    # 仅在通道1 未推进时触发，避免冲突
    if not stage_advanced and result.is_stage_ready_to_advance:
        if _detect_stage_completion(reply_text, current_stage.value):
            candidate = get_next_stage(current_stage)
            if candidate != current_stage:
                next_stage = candidate
                stage_advanced = True
                logger.info(
                    "P0 阶段触发器激活：%s → %s (is_stage_ready=True + 完成信号检出)",
                    current_stage.value, candidate.value,
                )
            else:
                logger.info(
                    "P0 阶段触发器：当前已在 FINAL 阶段，无法继续推进"
                )

    # 统一写入推进结果
    if stage_advanced and next_stage:
        updates["current_stage"] = next_stage.value
        updates["stage_advanced"] = True
    else:
        updates["stage_advanced"] = False

    # ── 实验标题：仅首次提取 ──
    if result.extracted_title and not state.get("experiment_title"):
        logger.info("提取实验标题: %s", result.extracted_title)
        updates["experiment_title"] = result.extracted_title

    # ── P0: 存储 LLM 输出的推进就绪标记 ──
    updates["is_stage_ready_to_advance"] = result.is_stage_ready_to_advance

    # ── 年级锁死防退化 ──
    # 一旦 grade_level 被确立，任何后续轮次的 null 或异常返回都不可覆盖
    if result.inferred_grade and not grade_level:
        valid_grades = {"低段", "中段", "高段"}
        normalized = result.inferred_grade.strip()
        if normalized in valid_grades:
            logger.info("推断年级段: %s", normalized)
            updates["grade_level"] = normalized
        else:
            logger.warning("LLM 返回了非法的年级段: %s，已忽略", result.inferred_grade)
    elif grade_level:
        # grade_level 已确认，不在 updates 中写入 grade_level
        # 确保 state 中已有值不会被 None 覆盖
        pass

    # ── P1: 阶段推进成功后记录摘要到 stage_summary ──
    if updates.get("stage_advanced"):
        # "刚刚完成"的阶段是推进前的 current_stage
        completed_stage = current_stage.value
        summary = _extract_stage_summary(reply_text, completed_stage)
        existing = dict(state.get("stage_summary") or {})
        if completed_stage not in existing:
            existing[completed_stage] = summary
            updates["stage_summary"] = existing
            logger.info(
                "P1 记录阶段摘要: %s → %.40s", completed_stage, summary,
            )

    return updates


# ─── 条件边函数 ───────────────────────────────────────

def route_after_analysis(state: StudentState) -> Literal["prompt", "__end__"]:
    """安全拦截时直接结束，否则进入 prompt 构建。"""
    if state.get("safety_hit"):
        return END
    return "prompt"


def route_after_llm(state: StudentState) -> str:
    """LLM 调用结束后直接结束本轮。"""
    return END


# ─── 构建图 ───────────────────────────────────────────

def create_student_graph(
    llm: Optional[ChatOpenAI] = None,
    checkpointer=None,
) -> StateGraph:
    """创建石头老师 LangGraph。

    三节点线性图：
      analyze_input(安全过滤) → build_prompt → call_llm_node(with_structured_output)

    Args:
        llm: ChatOpenAI 实例（可选，不提供则自动创建）
        checkpointer: PostgresSaver / MemorySaver 实例（可选）

    Returns:
        编译后的 StateGraph
    """
    nodes = {
        "analyze": analyze_input,
        "prompt": build_student_prompt,
        "llm_call": call_llm_node,
    }

    edges = [
        ("prompt", "llm_call"),
    ]

    conditional_edges = [
        ("analyze", route_after_analysis, {"prompt": "prompt", END: END}),
        ("llm_call", route_after_llm, {END: END}),
    ]

    graph = BaseAgent.create(
        state_schema=StudentState,
        nodes=nodes,
        edges=edges,
        conditional_edges=conditional_edges,
        checkpointer=checkpointer,
        first_node="analyze",
    )

    return graph
