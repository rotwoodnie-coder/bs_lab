/**
 * Next.js 服务端中间件（Edge Runtime）
 *
 * 基础路由守卫：在请求到达客户端前就完成角色路径拦截。
 * - 读取 v2_access_token cookie，base64url 解码 payload 获取 role_id
 * - 与 `normalizePath()` 匹配，对不合法的角色-路径组合返回 302 重定向
 *
 * 注意：中间件仅做基础路径级过滤，不验证 token 签名。
 *       真正授权由后端 API 的 assertPageRead 等守卫完成。
 */
import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "v2_access_token";
const REDIRECT_COUNT_PARAM = "__mw_redirect_count";

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/") + "====".slice(str.length % 4 || 4);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  let buffer = 0;
  let bits = 0;
  for (const char of base64) {
    if (char === "=") break;
    const val = chars.indexOf(char);
    if (val === -1) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

type AccessTokenPayload = { role_id?: unknown; has_binding?: unknown };

function decodeSessionFromCookie(req: NextRequest): { roleId: string | null; hasBinding: boolean } {
  const bindingCookie = req.cookies.get("bs_has_binding");
  const forcedBinding = bindingCookie?.value === "1";
  const cookie = req.cookies.get(TOKEN_COOKIE);
  if (!cookie?.value) return { roleId: null, hasBinding: false };
  const dotIdx = cookie.value.indexOf(".");
  if (dotIdx <= 0) return { roleId: null, hasBinding: false };
  try {
    const json = JSON.parse(base64UrlDecode(cookie.value.slice(0, dotIdx))) as AccessTokenPayload;
    const roleId = typeof json.role_id === "string" && json.role_id.length > 0 ? json.role_id : null;
    return { roleId, hasBinding: forcedBinding || json.has_binding === true };
  } catch {
    return { roleId: null, hasBinding: false };
  }
}

function isParentRole(roleId: string | null): boolean {
  const value = String(roleId ?? "").trim().toLowerCase();
  return value === "role_parent" || value === "parent";
}

function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0] || pathname;
  const segments = path.split("/").filter(Boolean);
  const resolved: string[] = [];
  for (const seg of segments) {
    if (seg === ".") continue;
    if (seg === "..") {
      resolved.pop();
      continue;
    }
    resolved.push(seg);
  }
  return "/" + resolved.join("/");
}

const PUBLIC_PREFIXES = ["/_next", "/favicon", "/mockServiceWorker.js", "/api/", "/v2/", "/login", "/__nextjs"];
const MOBILE_PUBLIC_PATHS = ["/m/login", "/m/bind/child"];
const MANAGEMENT_PREFIXES = ["/console/", "/admin/", "/researcher/", "/ops/"];

function isStaticAssetPath(path: string): boolean {
  return /\.(?:css|js|map|png|jpg|jpeg|gif|webp|svg|ico|json|txt|woff2?|ttf|otf)$/i.test(path);
}

function isWhitelistedPath(path: string): boolean {
  if (PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))) return true;
  if (MOBILE_PUBLIC_PATHS.includes(path)) return true;
  if (isStaticAssetPath(path)) return true;
  return false;
}

function isSafeMobileRedirectPath(path: string): boolean {
  return path.startsWith("/m") && !MOBILE_PUBLIC_PATHS.includes(path) && (path === "/m" || path.startsWith("/m/"));
}

function readRedirectCount(req: NextRequest): number {
  const raw = req.nextUrl.searchParams.get(REDIRECT_COUNT_PARAM);
  const count = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function buildSafeRedirect(req: NextRequest, pathname: string, destination: string, reason: string) {
  const redirectCount = readRedirectCount(req);
  if (redirectCount >= 1) {
    const response = new NextResponse(`请求被阻止：检测到重复重定向（${reason}），请从首页重新进入。`, {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
    response.cookies.set(REDIRECT_COUNT_PARAM, "1", { path: "/m", sameSite: "lax" });
    return response;
  }

  const url = req.nextUrl.clone();
  url.pathname = destination;
  url.searchParams.delete("redirect");
  if (isSafeMobileRedirectPath(pathname)) {
    url.searchParams.set("redirect", pathname);
  }
  url.searchParams.set(REDIRECT_COUNT_PARAM, String(redirectCount + 1));
  const response = NextResponse.redirect(url);
  response.cookies.set(REDIRECT_COUNT_PARAM, String(redirectCount + 1), { path: "/m", sameSite: "lax" });
  return response;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const path = normalizePath(pathname);

  if (!path.startsWith("/m")) {
    return NextResponse.next();
  }

  if (isWhitelistedPath(path)) return NextResponse.next();

  const { roleId, hasBinding } = decodeSessionFromCookie(req);

  if (!roleId) {
    return path === "/m/login" ? NextResponse.next() : buildSafeRedirect(req, pathname, "/m/login", "未登录");
  }

  if (isParentRole(roleId) && !hasBinding) {
    if (path === "/m/bind/child") return NextResponse.next();
    return buildSafeRedirect(req, pathname, "/m/bind/child", "家长未绑定");
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
