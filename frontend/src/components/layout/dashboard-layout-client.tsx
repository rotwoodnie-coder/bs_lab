"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  sonnerToast,
} from "@bs-lab/ui";
import { Bell, Bug, FlaskConical, Link as LinkIcon, MessageSquarePlus, Sparkles } from "@bs-lab/ui/icons";

import { AppShell } from "@/components/layout/app-shell";
import type { AppShellSidebarContext } from "@/components/layout/app-shell/types";
import { FeedbackSubmitDialog } from "@/components/business/feedback/feedback-submit-dialog";
import { useResourceCenterPolicy } from "@/components/layout/resource-center-policy-context";
import { DashboardCommandPalette } from "@/components/layout/dashboard-command-palette";
import { useAppMode } from "@/context/app-mode-context";
import { RESOURCE_CENTER_NAV_ID } from "@/config/resource-center-policy";
import {
  defaultViewModeForRole,
  findDashboardNavHref,
  getPrimaryNavItemsForRole,
  isPathAccessibleByStudent,
  isRouteAllowedInPortal,
  resolveDashboardNavId,
  toAppShellNavItems,
  type AppViewMode,
} from "@/config/nav-config";
import { getModeSwitchToastMessage } from "@/lib/mode-switch-toast";
import {
  getManagementDeniedRedirectPath,
  isManagementPathAllowedForRole,
} from "@/lib/rbac/management-access";
import { fetchV2Profile, postV2Logout, postV2SwitchRole } from "@/lib/v2/v2-auth-api";
import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { cn } from "@/lib/utils";
import { materialStorageBrowserHref } from "@/lib/material-asset-url";
import { UserRole, userRoleLabelZh } from "@/types/auth";
import { useSessionActor } from "@/hooks/use-session-actor";
import { useAuth } from "@/hooks/use-auth";

const AVATAR_FALLBACK: Record<UserRole, string> = {
  Role_Student: "学",
  Role_Parent: "家",
  Role_Teacher: "师",
  Role_Researcher: "研",
  Role_School_Admin: "校",
  Role_District_Admin: "区",
  Role_Sys_Admin: "超",
};

function buildLoginHref(pathname: string, searchParams: URLSearchParams): string {
  const next = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  return `/login?next=${encodeURIComponent(next)}`;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("auth");
      bc.onmessage = (ev) => {
        if (ev?.data?.type !== "logout") return;
        router.replace(buildLoginHref(pathname, searchParams));
      };
    } catch {
      bc = null;
    }
    (async () => {
      try {
        const profile = await fetchV2Profile();
        if (cancelled) return;
        // 家长门禁：未通过绑定前，只允许进入绑定页（/profile/family）。
        const roleLower = String(profile.userRoleId ?? "").trim().toLowerCase();
        const isParent = roleLower === "role_parent" || roleLower === "parent";
        const approvedCount = Number((profile as any).parentBindingSummary?.approvedCount ?? 0);
        const pathOnly = (pathname ?? "").split("?")[0] ?? "";
        // 家长门禁：未通过绑定时只允许进入绑定页；已通过绑定时自动跳转到家长实验室。
        if (isParent) {
          const allowed = new Set<string>(["/profile/family"]);
          if (approvedCount <= 0) {
            if (!allowed.has(pathOnly)) {
              router.replace("/profile/family");
              return;
            }
          } else {
            // 已审核通过的家长如果还在绑定页，自动跳转到家长实验室
            if (allowed.has(pathOnly)) {
              router.replace("/parent/lab");
              return;
            }
          }
        }
        if (profile.userRoleId === "Role_Sys_Admin") {
          setReady(true);
          return;
        }
        setReady(true);
      } catch {
        if (cancelled) return;
        router.replace(buildLoginHref(pathname, searchParams));
      }
    })();
    return () => {
      cancelled = true;
      try {
        bc?.close();
      } catch {
        /* ignore */
      }
    };
  }, [pathname, router, searchParams]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        正在校验登录状态…
      </div>
    );
  }

  return <>{children}</>;
}

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const session = useSessionActor();
  const auth = useAuth();
  const role = session.role;
  const roleHydrated = session.hydrated;
  const { viewMode, setViewMode, consumePendingModeSwitchToast, menuConfigRevision } = useAppMode();
  const { getEffectiveForRole } = useResourceCenterPolicy();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [bindings, setBindings] = React.useState<Array<{ orgId: string; roleId: string; orgName: string | null; roleName: string | null }>>([]);
  const [switching, setSwitching] = React.useState(false);
  const [parentBindingApproved, setParentBindingApproved] = React.useState(false);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);

  const pathOnly = pathname.split("?")[0] || pathname;
  /** `useSearchParams()` 返回对象引用可能每帧变化，勿直接放入 effect 依赖，否则门户路由守卫会高频重跑。 */
  const searchParamsKey = searchParams.toString();
  const isHomePath = pathOnly === "/" || pathOnly === "";

  React.useEffect(() => {
    if (!consumePendingModeSwitchToast()) return;
    sonnerToast.success(getModeSwitchToastMessage(role, viewMode));
  }, [viewMode, role, consumePendingModeSwitchToast]);


  // 真实身份上下文：来自后端 profile.userRoleBindings（sys_user_role）。
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchV2Profile();
        if (cancelled) return;
        const list = Array.isArray(p.userRoleBindings) ? p.userRoleBindings : [];
        setBindings(
          list
            .map((x) => ({
              orgId: String((x as any).orgId ?? ""),
              roleId: String((x as any).roleId ?? ""),
              orgName: (x as any).orgName != null ? String((x as any).orgName) : null,
              roleName: (x as any).roleName != null ? String((x as any).roleName) : null,
            }))
            .filter((x) => x.orgId.length > 0 && x.roleId.length > 0),
        );
        const approvedCount = Number((p as any).parentBindingSummary?.approvedCount ?? 0);
        setParentBindingApproved(approvedCount > 0);
      } catch {
        setBindings([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Portal route guard: depend on searchParamsKey, not searchParams — Next can give a new object each render.
  React.useEffect(() => {
    if (!roleHydrated) return;
    if (role === UserRole.SUPER_ADMIN) return;
    if (pathOnly.startsWith("/console/operations/")) {
      router.replace(getManagementDeniedRedirectPath(role));
    return;
    }
    if (role === UserRole.STUDENT) {
      if (!isPathAccessibleByStudent(pathOnly)) {
        setViewMode("portal", { overlay: false, suppressToast: true });
        router.replace("/");
        sonnerToast.error("无权访问", {
          description: "学生账号无法打开该管理类页面，已为你返回门户首页。",
        });
        return;
      }
    }
    if (viewMode !== "portal") return;
    if (isRouteAllowedInPortal(pathname, searchParams, role)) return;
    setViewMode("management", { suppressToast: true });
  }, [viewMode, pathname, pathOnly, searchParamsKey, role, roleHydrated, setViewMode, router]);

  React.useEffect(() => {
    if (!roleHydrated) return;
    if (role === UserRole.SUPER_ADMIN) return;
    if (viewMode !== "management") return;
    if (isManagementPathAllowedForRole(pathOnly, role)) return;
    const dest = getManagementDeniedRedirectPath(role);
    router.replace(dest);
    sonnerToast.error("无权访问", {
      description: "该页面不属于当前身份的工作范围，已切换回默认工作台。",
    });
  }, [viewMode, pathOnly, role, roleHydrated, router]);

  const managementWorkspaceTone = React.useMemo(() => {
    if (viewMode !== "management") return "default" as const;
    if (role === UserRole.SUPER_ADMIN) return "superAdmin" as const;
    if (role === UserRole.RESEARCHER) return "researcher" as const;
    if (role === UserRole.SCHOOL_ADMIN) return "schoolAdmin" as const;
    return "default" as const;
  }, [viewMode, role]);

  const primaryDefs = React.useMemo(() => {
    /** 家长未绑定时：侧栏仅显示"绑定孩子"入口 */
    if (role === UserRole.PARENT && !parentBindingApproved && viewMode === "management") {
      return [
        {
          id: "parent-bind",
          label: "绑定孩子",
          href: "/profile/family",
          Icon: LinkIcon,
        },
      ];
    }
    const defs = getPrimaryNavItemsForRole(role, viewMode);
    if (viewMode === "portal") return defs;
    const rc = getEffectiveForRole(role);
    return defs.filter(
      (d) => d.id !== RESOURCE_CENTER_NAV_ID || rc.moduleEnabled,
    );
  }, [role, viewMode, getEffectiveForRole, menuConfigRevision, parentBindingApproved]);
  const navItems = React.useMemo(() => toAppShellNavItems(primaryDefs), [primaryDefs]);

  const isReviewWorkbench = pathname.startsWith("/console/review/experiments");
  const isConsoleWorkbench = pathname.startsWith("/console");

  /** 依赖 `searchParamsKey` 而非 `searchParams`：避免 Next 每帧新对象引用导致侧栏与受控组件链重算抖动。 */
  const activeNavId = React.useMemo(() => {
    const base = resolveDashboardNavId(pathname, role, searchParams, viewMode);
    if (viewMode === "portal") return base;
    const rc = getEffectiveForRole(role);
    if (
      !rc.moduleEnabled &&
      (pathname.startsWith("/resources") || base === RESOURCE_CENTER_NAV_ID)
    ) {
      return primaryDefs[0]?.id ?? base;
    }
    return base;
  }, [pathname, role, searchParamsKey, viewMode, getEffectiveForRole, primaryDefs]);

  const handleNavSelect = React.useCallback(
    (id: string) => {
      const href = findDashboardNavHref(role, id, viewMode);
      if (href) router.push(href);
    },
    [router, role, viewMode],
  );

  const mobileTitle = React.useMemo(() => {
    const label = primaryDefs.find((d) => d.id === activeNavId)?.label;
    return label ?? "首页";
  }, [activeNavId, primaryDefs]);

  const headerCenterSlot = (
    <div className="min-w-0 w-full">
      <DashboardCommandPalette />
    </div>
  );

  const sidebarBrandSlot = (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-2.5 rounded-lg px-1 py-0.5 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 md:size-10">
        <FlaskConical className="size-5 text-primary md:size-[22px]" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold tracking-tight text-foreground md:text-base">科学实验云 · 管理后台</p>
        <p className="truncate text-xs text-muted-foreground">实验教学平台</p>
      </div>
    </Link>
  );

  /** 移动端顶栏：紧凑品牌；桌面端品牌置于侧栏顶部 */
  const logoSlot = (
    <Link
      href="/"
      className="flex min-h-11 min-w-0 items-center gap-2 rounded-md py-1 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <FlaskConical className="size-4 text-primary" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold text-foreground">科学实验云</p>
      </div>
    </Link>
  );

  const roleMeta = React.useMemo(() => {
    switch (role) {
      case UserRole.TEACHER:
        return {
          label: "教师",
          detail: auth.user.teachingSubjects.length > 0
            ? `教学绑定 ${auth.user.teachingSubjects.length} 项`
            : "未绑定教学学科",
        };
      case UserRole.STUDENT:
        return {
          label: "学生",
          detail: auth.user.orgName ? `所属组织 ${auth.user.orgName}` : "学习身份",
        };
      case UserRole.PARENT:
        return {
          label: "家长",
          detail: auth.user.parentBindingSummary?.approvedCount
            ? `已绑定 ${auth.user.parentBindingSummary.approvedCount} 名孩子`
            : "待绑定孩子",
        };
      case UserRole.RESEARCHER:
        return { label: "教研员", detail: "教研与资源管理" };
      case UserRole.SCHOOL_ADMIN:
        return { label: "学校管理员", detail: auth.user.orgName ? auth.user.orgName : "学校管理" };
      case UserRole.DISTRICT_ADMIN:
        return { label: "区管理员", detail: auth.user.orgName ? auth.user.orgName : "区级管理" };
      case UserRole.SUPER_ADMIN:
        return { label: "超级管理员", detail: "系统治理与配置" };
      default:
        return { label: userRoleLabelZh(role), detail: "" };
    }
  }, [auth.user.orgName, auth.user.parentBindingSummary?.approvedCount, auth.user.teachingSubjects.length, role]);

  const userSlot = (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 min-h-11 min-w-11 shrink-0 rounded-full"
            aria-label={`帐户与角色：${userRoleLabelZh(role)}，个人设置`}
          >
            <Avatar className="size-8 border border-border md:size-9">
              {auth.user.userLogo?.trim() ? (
                <AvatarImage src={materialStorageBrowserHref(auth.user.userLogo.trim())} alt="头像" />
              ) : null}
              <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                {AVATAR_FALLBACK[role]}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[min(100vw-2rem,18rem)]">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">当前身份</DropdownMenuLabel>
          <div className="px-2 pb-2">
            <div className="text-sm font-medium text-foreground">{roleMeta.label}</div>
            {roleMeta.detail ? <div className="mt-0.5 text-xs text-muted-foreground">{roleMeta.detail}</div> : null}
          </div>
          {bindings.length > 0 ? (
            <div className="space-y-1 px-1 pb-1">
              <div className="px-1 pt-1 text-xs text-muted-foreground">可切换身份</div>
              {bindings.map((b) => (
                <DropdownMenuItem
                  key={`${b.orgId}::${b.roleId}`}
                  disabled={switching}
                  onClick={async () => {
                    if (switching) return;
                    setSwitching(true);
                    try {
                      await postV2SwitchRole({ orgId: b.orgId, roleId: b.roleId });
                      sonnerToast.success("已切换身份");
                      router.refresh();
                      router.replace(pathname);
                    } catch (e) {
                      sonnerToast.error(e instanceof Error ? e.message : "切换失败");
                    } finally {
                      setSwitching(false);
                    }
                  }}
                >
                  {(b.roleName ?? b.roleId) + (b.orgName ? ` · ${b.orgName}` : "")}
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="px-2 py-1 text-xs text-muted-foreground">未配置可切换身份（sys_user_role）。</div>
          )}
          {role === UserRole.TEACHER ? (
            <div className="border-t border-border px-2 pt-2">
              <div className="text-xs text-muted-foreground">教学属性</div>
              {auth.user.teachingSubjects.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {auth.user.teachingSubjects.map((s) => (
                    <span key={s.subjectId} className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground">
                      {s.subjectName}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-1 text-xs text-muted-foreground">未绑定教学学科</div>
              )}
              {auth.user.teachingResearchGroups.length > 0 ? (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {auth.user.teachingResearchGroups.map((g) => (
                    <div key={g.groupId}>{g.groupName}</div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <DropdownMenuItem onClick={() => router.push("/messages")}>消息</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/profile")}>个人中心</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>系统设置</DropdownMenuItem>
          <DropdownMenuItem
            disabled={loggingOut}
            onClick={async () => {
              if (loggingOut) return;
              setLoggingOut(true);
              try {
                await postV2Logout();
              } catch {
                // 忽略网络/重复登出等异常，仍然走前端兜底清理与跳转
              } finally {
                try {
                  new BroadcastChannel("auth").postMessage({ type: "logout" });
                } catch {
                  /* ignore */
                }
                sonnerToast.success("已退出登录");
                router.replace(buildLoginHref("/", new URLSearchParams()));
                router.refresh();
                setLoggingOut(false);
              }
            }}
          >
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const headerTrailingSlot = null;

  const sidebarFooterSlot = React.useCallback(
    (ctx: AppShellSidebarContext) => (
      <div className="border-t border-border pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-2 text-muted-foreground hover:text-foreground",
            ctx.collapsed ? "min-h-11 px-0 justify-center" : "px-2",
          )}
          onClick={() => setFeedbackOpen(true)}
          aria-label="反馈与建议"
        >
          <MessageSquarePlus className={cn("size-4 shrink-0", ctx.collapsed ? "size-5" : undefined)} />
          {!ctx.collapsed ? <span className="text-xs font-medium">反馈与建议</span> : null}
        </Button>
      </div>
    ),
    [feedbackOpen],
  );

  return (
    <AppShell
      viewMode={viewMode}
      managementWorkspaceTone={managementWorkspaceTone}
      logoSlot={logoSlot}
      sidebarTopSlot={sidebarBrandSlot}
      userSlot={userSlot}
      headerCenterSlot={headerCenterSlot}
      headerTrailingSlot={headerTrailingSlot}
      modeSwitchSlot={null}
      navItems={navItems}
      activeNavId={activeNavId}
      onNavSelect={handleNavSelect}
      mobileHeaderTitle={mobileTitle}
      sidebarFooterSlot={sidebarFooterSlot}
    >
      {isHomePath ? (
        <div className="-mx-4 w-[calc(100%+2rem)] min-w-0 bg-muted/25 sm:-mx-6 sm:w-[calc(100%+3rem)]">
          <div
            className={cn(
              DASHBOARD_MAIN_CONTAINER_CLASS,
              "space-y-4 pb-6 pt-1",
              (isReviewWorkbench || isConsoleWorkbench) &&
                "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col",
            )}
          >
            {children}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            DASHBOARD_MAIN_CONTAINER_CLASS,
            "space-y-4",
            (isReviewWorkbench || isConsoleWorkbench) && "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col",
          )}
        >
          {children}
        </div>
      )}

      {/* 浮动 Bug 上报按钮 */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="sm"
          className="gap-1.5 rounded-full bg-foreground text-background shadow-lg hover:bg-foreground/90"
          onClick={() => setFeedbackOpen(true)}
          aria-label="上报 Bug"
        >
          <Bug className="size-3.5" />
          <span className="text-xs font-medium">上报 Bug</span>
        </Button>
      </div>

      <FeedbackSubmitDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </AppShell>
  );
}

function DashboardShellSuspense({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          加载工作台导航…
        </div>
      }
    >
      <AuthGate>
        <DashboardShellInner>{children}</DashboardShellInner>
      </AuthGate>
    </React.Suspense>
  );
}

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return <DashboardShellSuspense>{children}</DashboardShellSuspense>;
}
