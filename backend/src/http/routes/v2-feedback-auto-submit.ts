/**
 * V2 反馈自动提交路由
 * 前缀：/v2/feedback/auto-submit
 *
 * 前端 GlobalErrorSentinel 在捕获运行时错误时首先尝试此路由，
 * 失败后降级到 POST /v2/sys/feedback。
 *
 * 与 POST /v2/sys/feedback 的区别：
 * - 不接受 x-user-name/x-role/x-org-id/x-org-name 等身份头（优先从 Session 读取）
 * - 自动标明 reporter 为 "auto-capture"
 * - 直接写入 BUG 类型反馈
 */
import { z } from "zod";
import { createSysFeedback, type SysFeedbackReporter, type SysFeedbackEnv } from "../../infrastructure/repositories/v2-sys-feedback-repository.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}
function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

const autoSubmitSchema = z.object({
  errorMessage: z.string().optional(),
  errorStack: z.string().optional(),
  componentStack: z.string().optional(),
  href: z.string().optional(),
  userAgent: z.string().optional(),
  sessionHash: z.string().optional(),
  source: z.string().optional(),
  issueClass: z.string().optional(),
  title: z.string().min(1, "标题不能为空").max(200, "标题不能超过 200 字"),
  content: z.string().optional(),
  env: z
    .object({
      url: z.string().optional(),
      ua: z.string().optional(),
      issueClass: z.string().optional(),
      componentStack: z.string().optional(),
    })
    .optional(),
});

export async function routeV2FeedbackAutoSubmit(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    if (pathname !== "/v2/feedback/auto-submit") return new Response(null, { status: 404 });

    if (req.method !== "POST") return new Response(null, { status: 404 });

    const body = autoSubmitSchema.parse(await req.json());

    const actorId = req.headers.get("x-user-id") ?? undefined;

    const reporter: SysFeedbackReporter = {
      userId: actorId ?? "",
      name: "auto-capture",
      role: req.headers.get("x-role") ?? "",
      orgId: req.headers.get("x-org-id") ?? "",
      orgName: req.headers.get("x-org-name") ?? "",
    };

    const env: SysFeedbackEnv = {
      url: body.href ?? body.env?.url ?? "",
      ua: body.userAgent ?? body.env?.ua ?? "",
      browser: "auto-capture",
      errorStack: body.errorStack ?? "",
      error_stack_brief: (body.errorStack ?? "").split("\n").slice(0, 3).join("\n"),
    };

    const title = body.title || `运行时错误：${body.issueClass ?? "UNKNOWN"}`;

    const record = await createSysFeedback(
      {
        type: "BUG",
        title,
        content: body.content || body.errorStack || "",
        reporter,
        env,
        issueFingerprint: body.sessionHash ?? null,
      },
      actorId,
    );

    return ok(record);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail(`参数校验失败：${err.errors[0]?.message ?? "未知字段"}`, 400);
    }
    if (err instanceof Error && err.message === "FEEDBACK_CREATE_FAILED") {
      return fail("反馈写入失败", 500);
    }
    console.error("[v2-feedback-auto-submit]", err);
    return fail("服务内部错误", 500);
  }
}
