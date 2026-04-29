import { cn } from "./utils";

/** 与门户 / 管理模式切换联动的 Command Palette 与顶栏搜索触发器外观。 */
export type DashboardPaletteChrome = "portal" | "management";

export function dashboardCommandPaletteDialogContentClassName(mode: DashboardPaletteChrome) {
  return cn(
    "max-w-lg border border-border/60 bg-card/75 shadow-lg backdrop-blur-xl",
    mode === "portal" &&
      "border-brand-science/35 ring-2 ring-brand-science/20 [box-shadow:0_16px_48px_-14px_color-mix(in_oklab,var(--color-brand-science)_18%,transparent)]",
    mode === "management" &&
      "border-brand-management/30 ring-1 ring-brand-management/25 [box-shadow:0_14px_44px_-16px_color-mix(in_oklab,var(--color-brand-management)_14%,transparent)]",
  );
}

/** 顶栏宽版「搜索」按钮（桌面），min-h-11 满足触控 44px+ */
export function dashboardCommandSearchFieldClassName(mode: DashboardPaletteChrome) {
  return cn(
    "h-11 min-h-11 w-full justify-start gap-2 rounded-full border px-4 text-left text-sm text-muted-foreground shadow-xs backdrop-blur-md",
    mode === "portal" &&
      "border-brand-science/35 bg-card/85 hover:border-brand-science/45 hover:bg-card hover:text-foreground",
    mode === "management" &&
      "border-brand-management/30 bg-muted/25 shadow-inner ring-1 ring-inset ring-brand-management/25 hover:bg-muted/40 hover:text-foreground",
  );
}

/** 顶栏图标搜索按钮（移动），11×11 满足触控 44px+ */
export function dashboardCommandSearchIconFieldClassName(mode: DashboardPaletteChrome) {
  return cn(
    "size-11 min-h-11 min-w-11 shrink-0 rounded-full border shadow-xs backdrop-blur-md",
    mode === "portal" && "border-brand-science/35 bg-card/85",
    mode === "management" &&
      "border-brand-management/30 bg-muted/25 shadow-inner ring-1 ring-inset ring-brand-management/25",
  );
}
