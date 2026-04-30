"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Spinner } from "@bs-lab/ui";

import type { AppViewMode } from "@/config/nav-config";
import { defaultViewModeForRole, MENU_CONFIG_CHANGED_EVENT } from "@/config/nav-config";
import { userRoleLabelZh, UserRole } from "@/types/auth";
import { useSessionActor } from "@/hooks/use-session-actor";

const STORAGE_KEY = "bs_lab_view_mode";
const LEGACY_STORAGE_KEY = "bs-lab-app-view-mode";

const MODE_OVERLAY_MS = 720;

function readStoredMode(): AppViewMode | null {
  if (typeof window === "undefined") return null;
  const raw =
    window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
  return raw === "portal" || raw === "management" ? raw : null;
}

export type SetViewModeOptions = {
  /** 用户显式切换时展示过渡；路由守卫自动切入管理台时不展示 */
  overlay?: boolean;
  /** 为 true 时清除「待弹出切换成功 Toast」标记（如路由守卫强制回管理台） */
  suppressToast?: boolean;
};

type AppModeContextValue = {
  viewMode: AppViewMode;
  setViewMode: (mode: AppViewMode, options?: SetViewModeOptions) => void;
  toggleMode: () => void;
  /** 若存在用户触发的模式切换，消费一次并返回 true（用于展示 Toast） */
  consumePendingModeSwitchToast: () => boolean;
  /**
   * localStorage 菜单覆盖变更时递增，供侧栏等依赖 `getPrimaryNavItemsForRole` 的组件强制重算。
   */
  menuConfigRevision: number;
};

const AppModeContext = React.createContext<AppModeContextValue | null>(null);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = React.useState<AppViewMode>("portal");
  const [menuConfigRevision, setMenuConfigRevision] = React.useState(0);
  const [hydrated, setHydrated] = React.useState(false);
  /** Once true, the role-based default viewMode has been applied (distinguishes user-initiated toggle from initial guess). */
  const initialRoleAppliedRef = React.useRef(false);
  const [modeOverlay, setModeOverlay] = React.useState(false);
  const [overlayMessage, setOverlayMessage] = React.useState("");
  const overlayTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUserModeToastRef = React.useRef(false);
  const session = useSessionActor();

  const requestOverlayForTargetMode = React.useCallback((targetMode: AppViewMode) => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    const roleName = userRoleLabelZh(session.role ?? UserRole.STUDENT);
    setOverlayMessage(`正在加载 ${roleName} 视图…`);
    setModeOverlay(true);
    overlayTimerRef.current = setTimeout(() => {
      setModeOverlay(false);
      overlayTimerRef.current = null;
    }, MODE_OVERLAY_MS);
  }, []);

  // 首屏绘制前同步，避免先以 portal 渲染再切 management 时触发子树大范围切换（曾与 shell 动画叠加造成双主栏）
  React.useLayoutEffect(() => {
    const stored = readStoredMode();
    if (stored) {
      setViewModeState(stored);
    } else {
      // 未加载 profile 前先以 portal 为默认；待会话身份 hydrated 后可由路由守卫自动切换。
      setViewModeState("portal");
    }
    try {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy === "portal" || legacy === "management") {
        if (!window.localStorage.getItem(STORAGE_KEY)) {
          window.localStorage.setItem(STORAGE_KEY, legacy);
        }
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Once session is loaded, force the role-default viewMode (overrides the initial guess).
  React.useEffect(() => {
    if (!hydrated) return;
    if (!session.hydrated) return;
    if (initialRoleAppliedRef.current) return;
    initialRoleAppliedRef.current = true;
    const userDefault = defaultViewModeForRole(session.role);
    setViewModeState(userDefault);
    try {
      window.localStorage.setItem(STORAGE_KEY, userDefault);
    } catch {
      /* ignore */
    }
  }, [hydrated, session.hydrated, session.role]);

  // Persist to localStorage only on user-initiated toggle (role-default sync handled above).
  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (!initialRoleAppliedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode, hydrated]);

  React.useEffect(() => {
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const bump = () => setMenuConfigRevision((n) => n + 1);
    window.addEventListener(MENU_CONFIG_CHANGED_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(MENU_CONFIG_CHANGED_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const consumePendingModeSwitchToast = React.useCallback(() => {
    if (!pendingUserModeToastRef.current) return false;
    pendingUserModeToastRef.current = false;
    return true;
  }, []);

  const setViewMode = React.useCallback(
    (mode: AppViewMode, options?: SetViewModeOptions) => {
      setViewModeState((prev) => (prev === mode ? prev : mode));
      if (options?.suppressToast) pendingUserModeToastRef.current = false;
      if (options?.overlay) {
        pendingUserModeToastRef.current = true;
        requestOverlayForTargetMode(mode);
      }
    },
    [requestOverlayForTargetMode],
  );

  const toggleMode = React.useCallback(() => {
    const next = viewMode === "portal" ? "management" : "portal";
    setViewMode(next, { overlay: true });
  }, [setViewMode, viewMode]);

  const value = React.useMemo(
    () => ({
      viewMode,
      setViewMode,
      toggleMode,
      consumePendingModeSwitchToast,
      menuConfigRevision,
    }),
    [viewMode, setViewMode, toggleMode, consumePendingModeSwitchToast, menuConfigRevision],
  );

  return (
    <AppModeContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {modeOverlay ? (
          <motion.div
            key="app-mode-overlay"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label="切换视图中"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-background/45 backdrop-blur-xl supports-[backdrop-filter]:bg-background/30"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4 rounded-2xl border border-border/35 bg-card/45 px-10 py-8 shadow-lg backdrop-blur-md"
            >
              <Spinner className="size-8 text-muted-foreground" />
              {overlayMessage ? (
                <p className="max-w-[min(100%,20rem)] px-4 text-center text-sm text-foreground">
                  {overlayMessage}
                </p>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AppModeContext.Provider>
  );
}

export function useAppMode(): AppModeContextValue {
  const ctx = React.useContext(AppModeContext);
  if (!ctx) {
    throw new Error("useAppMode must be used within AppModeProvider");
  }
  return ctx;
}
