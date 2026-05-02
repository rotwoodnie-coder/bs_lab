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

// ── Token 解码 ──────────────────────────────────────────────

const TOKEN_COOKIE = "v2_access_token";

/**
 * base64url 解码（纯 JS，不依赖 atob / Buffer，兼容 Edge Runtime）。
 */
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
  const payloadB64 = cookie.value.slice(0, dotIdx);
  try {
    const json = JSON.parse(base64UrlDecode(payloadB64)) as AccessTokenPayload;
    const roleId = typeof json.role_id === "string" && json.role_id.length > 0 ? json.role_id : null;
    const hasBinding = forcedBinding || json.has_binding === true;
    return { roleId, hasBinding };
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

const ALLOWED_PUBLIC_PREFIXES = ["/_next", "/favicon", "/mockServiceWorker.js", "/api/", "/v2/", "/login", "/__nextjs"];
const MOBILE_WHITELIST_PREFIXES = ["/m/login", "/m/bind/child"];
const PROTECTED_MANAGEMENT_PREFIXES = ["/console/", "/admin/", "/researcher/", "/ops/"];

function isPathAllowed(path: string, roleId: string | null): boolean {
  if (ALLOWED_PUBLIC_PREFIXES.some((p) => path.startsWith(p))) return true;
  if (!roleId) return false;
  if (!PROTECTED_MANAGEMENT_PREFIXES.some((p) => path.startsWith(p))) return true;
  return true;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const path = normalizePath(pathname);
  const { roleId, hasBinding } = decodeSessionFromCookie(req);
  console.log(`[MW] path=${req.nextUrl.pathname}, has_binding=${hasBinding}`);

  if (ALLOWED_PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p))) return NextResponse.next();
  if (path === "/m/login" || path === "/m/bind/child") return NextResponse.next();

  if (path.startsWith("/m")) {
    if (!roleId) {
      if (path === "/m/login") return NextResponse.next();
      const url = req.nextUrl.clone();
      url.pathname = "/m/login";
      url.searchParams.set("redirect", "/m");
      return NextResponse.redirect(url);
    }
    if (isParentRole(roleId) && !hasBinding) {
      if (path === "/m/bind/child") return NextResponse.next();
      const url = req.nextUrl.clone();
      url.pathname = "/m/bind/child";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!isPathAllowed(path, roleId)) {
    const url = req.nextUrl.clone();
    url.pathname = roleId ? "/" : "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
