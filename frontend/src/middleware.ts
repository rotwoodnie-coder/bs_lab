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

/** 从 v2_access_token cookie 中提取 role_id（不验证签名，仅 base64 解码 payload） */
function decodeRoleFromCookie(req: NextRequest): string | null {
  const cookie = req.cookies.get(TOKEN_COOKIE);
  if (!cookie?.value) return null;
  const dotIdx = cookie.value.indexOf(".");
  if (dotIdx <= 0) return null;
  const payloadB64 = cookie.value.slice(0, dotIdx);
  try {
    const json = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.role_id === "string" && json.role_id.length > 0 ? json.role_id : null;
  } catch {
    return null;
  }
}

// ── 路径归一化 ──────────────────────────────────────────────

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

// ── 守卫规则 ────────────────────────────────────────────────

const ALLOWED_PUBLIC_PREFIXES = [
  "/_next",       // Next.js 静态资源
  "/favicon",     // 图标
  "/api/",        // 接口（后端已有权限校验）
  "/v2/",         // 反向代理到后端
  "/login",       // 登录页
  "/__nextjs",    // Next.js 开发工具
];

/** 管理后台受保护路径前缀 */
const PROTECTED_MANAGEMENT_PREFIXES = [
  "/console/",
  "/admin/",
  "/researcher/",
  "/ops/",
];

function isPathAllowed(path: string, roleId: string | null): boolean {
  // 公开路径一律放行
  if (ALLOWED_PUBLIC_PREFIXES.some((p) => path.startsWith(p))) return true;

  // 未登录或会话过期，只允许公开路径
  if (!roleId) return false;

  // 非管理路径放行
  if (!PROTECTED_MANAGEMENT_PREFIXES.some((p) => path.startsWith(p))) return true;

  // ── 运维中心：仅超管 ──
  if (path.startsWith("/console/operations/")) {
    return roleId === "Role_Sys_Admin";
  }

  // ── 校管 ──
  if (roleId === "Role_School_Admin") {
    if (path.startsWith("/researcher/")) return false;
    if (path.startsWith("/console/review/") && !path.startsWith("/console/review/student-works")) return false;
    if (path.startsWith("/admin/")) return false;
    return true;
  }

  // ── 教研员 ──
  if (roleId === "Role_Researcher") {
    if (path.startsWith("/console/settings/system/")) return false;
    return true;
  }

  // 其他角色（教师、学生、家长、区管等）默认放行
  return true;
}

// ── 入口 ────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const path = normalizePath(pathname);

  // 公开路径直接放行
  if (ALLOWED_PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p))) {
    return NextResponse.next();
  }

  const roleId = decodeRoleFromCookie(req);

  if (!isPathAllowed(path, roleId)) {
    const url = req.nextUrl.clone();
    // 无角色 → 未登录，跳到登录页
    // 有角色但无权 → 跳到首页
    url.pathname = roleId ? "/" : "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
