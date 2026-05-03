import { getMysqlPool } from "../../infrastructure/mysql/mysql-client.ts";
import { loadV2UserContext } from "../../infrastructure/repositories/v2-user-context-repository.ts";
import { presignPublicUrl } from "../../infrastructure/storage/s3-storage.ts";

function ok(data: unknown): Response {
  return Response.json({ success: true, data, error: null });
}

function fail(msg: string, status = 400): Response {
  return Response.json({ success: false, data: null, error: { message: msg } }, { status });
}

export async function routeV2User(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/v2/user")) return new Response(null, { status: 404 });
    if (req.method !== "GET" || url.pathname !== "/v2/user/context") return new Response(null, { status: 404 });

    const userId = String(req.headers.get("x-user-id") ?? "").trim();
    if (!userId) return fail("未登录", 401);

    const pool = getMysqlPool();
    const context = await loadV2UserContext(pool, userId);
    if (!context) return fail("用户不存在", 404);

    const presignedLogo = await presignPublicUrl(context.userLogo);

    return ok({
      userId: context.userId,
      userName: context.userName,
      userNickName: context.userNickName,
      userLogo: presignedLogo,
      role: context.role,
      hasBinding: context.hasBinding,
      schoolLevelId: context.schoolLevelId,
      gradeId: context.gradeId,
      orgId: context.orgId,
    });
  } catch (err) {
    console.error("[v2-user]", err);
    return fail("服务内部错误", 500);
  }
}
