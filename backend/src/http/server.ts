import "dotenv/config";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { routeV2Auth } from "./routes/v2-auth.ts";
import { routeV2AdminDict } from "./routes/v2-admin-dict.ts";
import { routeV2BusinessDict } from "./routes/v2-business-dict.ts";
import { routeV2Dict } from "./routes/v2-dict.ts";
import { routeV2Exp } from "./routes/v2-exp.ts";
import { routeV2File } from "./routes/v2-file.ts";
import { routeV2Material } from "./routes/v2-material.ts";
import { routeV2Coursebook } from "./routes/v2-coursebook.ts";
import { routeV2Social } from "./routes/v2-social.ts";
import { routeV2Sys } from "./routes/v2-sys.ts";
import { routeV2SysOrgTypes } from "./routes/v2-sys-org-types.ts";
import { routeV2SysOrg } from "./routes/v2-sys-org.ts";
import { routeV2SysRole } from "./routes/v2-sys-role.ts";
import { routeV2RolePermission } from "./routes/v2-role-permission.ts";
import { warmUpAllRolePermissions } from "../infrastructure/repositories/v2-role-permission-repository.ts";
import { routeV2Homework } from "./routes/v2-homework.ts";
import { routeV2Question } from "./routes/v2-question.ts";
import { routeV2TeacherMaterialTypes } from "./routes/v2-teacher-material-types.ts";
import { routeV2OpsConsistency } from "./routes/v2-ops-consistency.ts";
import { routeV2OpsDictSync } from "./routes/v2-ops-dict-sync.ts";
import { routeV2OpsDataExport } from "./routes/v2-ops-data-export.ts";
import { routeV2OpsCache } from "./routes/v2-ops-cache.ts";
import { routeV2SysLog } from "./routes/v2-sys-log.ts";
import { routeV2SysFeedback } from "./routes/v2-sys-feedback.ts";
import { routeV2FeedbackAutoSubmit } from "./routes/v2-feedback-auto-submit.ts";
import { routeV2Class } from "./routes/v2-class.ts";
import { routeV2Student } from "./routes/v2-student.ts";
import { routeV2Parent } from "./routes/v2-parent.ts";
import { routeGroup } from "./routes/group.ts";
import { routeV2TeacherClassConfig } from "./routes/v2-teacher-class-config.ts";
import { routeV2Review } from "./routes/v2-review.ts";
import { routeV2Version } from "./routes/v2-version.ts";
import { parseCookies, verifyV2AccessToken } from "../lib/auth/v2-session.ts";

const port = Number(process.env.PORT ?? 4100);

function warnIfMinioEndpointIsLocalhostInProduction(): void {
  const endpoint = (process.env.MINIO_ENDPOINT ?? "http://localhost:9000").trim();
  const isProd = process.env.NODE_ENV === "production";
  const isLocalhost = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(endpoint);
  if (isProd && isLocalhost) {
    console.error("\x1b[31m%s\x1b[0m", `[bootstrap] MINIO_ENDPOINT is localhost in production: ${endpoint}. 请切换为可被宝山内测服务器访问的对象存储地址。`);
  }
}

warnIfMinioEndpointIsLocalhostInProduction();

function normalizeIncomingCoreUrl(rawUrl: string | undefined): string {
  const pathAndQuery = rawUrl && rawUrl.length > 0 ? rawUrl : "/";
  const q = pathAndQuery.indexOf("?");
  const pathOnly = q === -1 ? pathAndQuery : pathAndQuery.slice(0, q);
  const query = q === -1 ? "" : pathAndQuery.slice(q);
  let path = pathOnly;
  if (path === "/api/v2" || path.startsWith("/api/v2/")) path = path.slice(4) || "/";
  return path + query;
}

function buildCorsHeaders(origin: string | null): HeadersInit {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const requestOrigin = origin && origin.trim().length > 0 ? origin.trim() : null;
  const isProd = process.env.NODE_ENV === "production";
  const matchedOrigin = requestOrigin && allowedOrigins.includes(requestOrigin) ? requestOrigin : null;

  // 开发环境：若未配置白名单，直接回显请求 Origin，避免前后端分离调试时 CORS 空值。
  // 生产环境：仅回显白名单或显式配置的回退域名。
  const fallbackOrigin = process.env.CORS_FALLBACK_ORIGIN?.trim() || "";
  const allowOrigin = matchedOrigin ?? (!isProd ? requestOrigin ?? "" : fallbackOrigin);

  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers":
      "content-type,x-role,x-user-id,x-org-id,x-org-name,x-user-name,x-trace-id,x-tenant-id,x-app-id,x-subject-key",
    "access-control-allow-credentials": "true",
    "vary": "origin",
  };
}

const routes = [
  routeV2Auth,
  routeV2AdminDict,
  routeV2BusinessDict,
  routeV2Dict,
  routeV2File,
  routeV2Material,
  routeV2Coursebook,
  routeV2Social,
  routeV2Exp,
  routeV2SysOrgTypes,
  routeV2SysOrg,
  routeV2Class,
  routeV2Student,
  routeV2Parent,
  routeV2Sys,
  routeV2SysRole,
  routeV2RolePermission,
  routeGroup,
  routeV2Homework,
  routeV2Question,
  routeV2TeacherMaterialTypes,
  routeV2OpsConsistency,
  routeV2OpsDictSync,
  routeV2OpsDataExport,
  routeV2OpsCache,
  routeV2SysLog,
  routeV2FeedbackAutoSubmit,
  routeV2SysFeedback,
  routeV2TeacherClassConfig,
  routeV2Review,
  routeV2Version,
];

createServer(async (req, res) => {
  const startedAt = Date.now();
  const traceId = randomUUID();
  const corsHeaders = buildCorsHeaders(req.headers.origin ?? null);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.end();
    return;
  }
  const safeSend = (statusCode: number, body: string) => {
    if (res.headersSent) return;
    res.statusCode = statusCode;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("x-trace-id", traceId);
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    res.end(body);
  };
  const normalizedUrl = normalizeIncomingCoreUrl(req.url);
  // Actor 注入：默认不信任客户端传入 x-user-id/x-role 等身份头。
  // 通过 Cookie Session（v2_access_token）解析出 actor，再注入到下游路由。
  const incomingHeaders = { ...(req.headers as HeadersInit), "x-trace-id": traceId } as Record<string, string>;
  const pathname = normalizedUrl.split("?")[0] ?? "";
  const allowHeaderActor =
    process.env.ALLOW_HEADER_ACTOR === "true" && process.env.NODE_ENV !== "production";
  const isAuthRoute = pathname.startsWith("/v2/auth/");

  if (!allowHeaderActor && !isAuthRoute) {
    // 清理潜在伪造头，避免业务路由误信
    delete incomingHeaders["x-user-id"];
    delete incomingHeaders["x-user-name"];
    delete incomingHeaders["x-org-id"];
    delete incomingHeaders["x-role"];

    const cookies = parseCookies((req.headers as unknown as { cookie?: string }).cookie);
    const access = cookies.v2_access_token;
    if (access) {
      const actor = verifyV2AccessToken(access);
      if (actor) {
        incomingHeaders["x-user-id"] = actor.userId;
        if (actor.orgId) incomingHeaders["x-org-id"] = actor.orgId;
        if (actor.roleId) incomingHeaders["x-role"] = actor.roleId;
      }
    }
  }

  const request = new Request(`http://localhost:${port}${normalizedUrl}`, {
    method: req.method,
    headers: incomingHeaders,
    body: req.method && ["POST", "PUT", "PATCH"].includes(req.method) ? req : undefined,
    duplex: "half",
  } as RequestInit);
  try {
    let response: Response | null = null;
    for (const route of routes) {
      const r = await route(request);
      const ct = (r.headers.get("content-type") ?? "").toLowerCase();
      /** 无 body 的 404 表示「本路由未命中」；带 JSON 的 404（如 fail(...,404)）必须透传，否则会落到全局 NOT_FOUND */
      if (r.status !== 404 || ct.includes("application/json")) {
        response = r;
        break;
      }
    }
    if (!response) response = Response.json({ success: false, data: null, error: { message: "NOT_FOUND" } }, { status: 404 });
    const streamCt = response.headers.get("content-type") ?? "";
    const isStream = response.body && pathname.startsWith("/v2/file/stream/") && !streamCt.includes("application/json");
    if (isStream) {
      res.statusCode = response.status;
      res.setHeader("x-trace-id", traceId);
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      // Set-Cookie 必须以“多 header”形式透传，不能用逗号合并或覆盖。
      const headersAny = response.headers as unknown as { getSetCookie?: () => string[] };
      const setCookies = typeof headersAny.getSetCookie === "function" ? headersAny.getSetCookie() : [];
      if (setCookies.length > 0) res.setHeader("set-cookie", setCookies);
      response.headers.forEach((v, k) => {
        if (k.toLowerCase() === "set-cookie") return;
        res.setHeader(k, v);
      });
      const nodeReadable = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
      nodeReadable.on("error", (err) => {
        console.error("stream pipe error", err);
        try { res.end(); } catch { /* ignore */ }
      });
      nodeReadable.pipe(res);
      return;
    }
    res.statusCode = response.status;
    res.setHeader("x-trace-id", traceId);
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    {
      const headersAny = response.headers as unknown as { getSetCookie?: () => string[] };
      const setCookies = typeof headersAny.getSetCookie === "function" ? headersAny.getSetCookie() : [];
      if (setCookies.length > 0) res.setHeader("set-cookie", setCookies);
      response.headers.forEach((v, k) => {
        if (k.toLowerCase() === "set-cookie") return;
        res.setHeader(k, v);
      });
    }
    res.end(await response.text());
    const latencyMs = Date.now() - startedAt;
    console.log(`${req.method} ${req.url} status=${response.status} latencyMs=${latencyMs} traceId=${traceId}`);
  } catch (err) {
    console.error(`[server] unhandled error ${req.method} ${req.url}`, err);
    safeSend(500, JSON.stringify({ success: false, data: null, error: { message: "INTERNAL_SERVER_ERROR" } }));
  }
}).listen(port, () => {
  console.log(`bs-lab backend (V2) listening on :${port}`);
  // 预热角色权限缓存，确保非超管角色首次请求时有 PAGE_* 权限码
  warmUpAllRolePermissions().catch((err) => console.error("[permission-cache] startup warmup failed:", err));
});
