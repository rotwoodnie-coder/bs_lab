import { UserRole } from "@/types/auth";

function resolveApiBase(): string {
  const env = process.env.NEXT_PUBLIC_NEW_CORE_API_BASE?.trim();
  if (env) return env;
  // 本地开发默认走“同源”基址，配合 next.config rewrites 将 /v2/* 代理到后端，
  // 避免跨域 + credentials 导致的 Cookie/CORS 问题。
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return process.env.NEXT_PUBLIC_NEW_CORE_API_BASE?.trim() || "http://localhost:4100";
}

const apiBase = resolveApiBase();

/**
 * 与标准实验目录、教材书架等库表 `tenant_id` 对齐；种子默认 `district-001`。
 * 身份 `x-org-id` 常为组织树节点，不等同于租户，不可混用。
 */
export function getExperimentCatalogTenantId(): string {
  const env = process.env.NEXT_PUBLIC_EXPERIMENT_CATALOG_TENANT_ID?.trim();
  return env || "district-001";
}

export function getMediaSubjectKey(): string {
  return process.env.NEXT_PUBLIC_MEDIA_SUBJECT_KEY ?? "SYSTEM:bootstrap";
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = apiBase.trim().replace(/\/+$/, "");
  /** 核心服务若仍配置为 …/v1 基址，/v2 路径必须落在主机根下，避免拼成 …/v1/v2/… */
  const hostBase = base.replace(/\/v1$/, "");
  if (normalizedPath.startsWith("/v2/")) {
    try {
      const baseForUrl = hostBase.includes("://") ? hostBase : `http://${hostBase}`;
      const { origin } = new URL(baseForUrl);
      /** V2 固定挂在主机根 /v2；基址若误带 /api 等路径，避免拼成 …/api/v2/… 导致后端整链 NOT_FOUND */
      return `${origin}${normalizedPath}`;
    } catch {
      return `${hostBase}${normalizedPath}`;
    }
  }
  if (base.endsWith("/v1") && normalizedPath.startsWith("/v1/")) {
    return `${base}${normalizedPath.slice(3)}`;
  }
  return `${base}${normalizedPath}`;
}

export function roleToHeader(role: UserRole): string {
  switch (role) {
    case UserRole.RESEARCHER:
      return "Role_Researcher";
    case UserRole.DISTRICT_ADMIN:
      return "Role_District_Admin";
    case UserRole.SUPER_ADMIN:
      return "Role_Sys_Admin";
    case UserRole.TEACHER:
      return "Role_Teacher";
    case UserRole.PARENT:
      return "Role_Parent";
    case UserRole.STUDENT:
      return "Role_Student";
    case UserRole.SCHOOL_ADMIN:
    default:
      return "Role_School_Admin";
  }
}

export function toAsciiHeaderValue(value: string): string {
  return encodeURIComponent(value);
}

export type CoreApiActor = {
  role: UserRole;
  userId: string;
  userName: string;
  orgId: string;
  orgName?: string;
  tenantId?: string;
  appId?: string;
};

export function buildCoreApiJsonHeaders(actor: CoreApiActor): Record<string, string> {
  return {
    "content-type": "application/json",
    "x-role": roleToHeader(actor.role),
    "x-user-id": actor.userId,
    "x-user-name": toAsciiHeaderValue(actor.userName),
    "x-org-id": actor.orgId,
    "x-org-name": actor.orgName ? toAsciiHeaderValue(actor.orgName) : "",
    "x-subject-key": getMediaSubjectKey(),
    ...(actor.tenantId?.trim() ? { "x-tenant-id": actor.tenantId.trim() } : {}),
    ...(actor.appId?.trim() ? { "x-app-id": actor.appId.trim() } : {}),
  };
}

/** 用于 GET 流式资源（不传 content-type）。 */
export function buildCoreApiReadHeaders(actor: CoreApiActor): Record<string, string> {
  return {
    "x-role": roleToHeader(actor.role),
    "x-user-id": actor.userId,
    "x-user-name": toAsciiHeaderValue(actor.userName),
    "x-org-id": actor.orgId,
    "x-org-name": actor.orgName ? toAsciiHeaderValue(actor.orgName) : "",
    "x-subject-key": getMediaSubjectKey(),
    ...(actor.tenantId?.trim() ? { "x-tenant-id": actor.tenantId.trim() } : {}),
    ...(actor.appId?.trim() ? { "x-app-id": actor.appId.trim() } : {}),
  };
}
