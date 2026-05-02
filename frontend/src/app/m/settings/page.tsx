"use client";

import Link from "next/link";
import { MobileCard } from "@/components/mobile/MobileCard";
import { useMobileContext } from "@/contexts/MobileContext";
import { cn } from "@/lib/utils";

const SETTING_ITEMS = [
  { title: "账号与安全", desc: "密码、登录设备与基础安全设置", href: "#account" },
  { title: "通知偏好", desc: "消息提醒、任务通知与学习提醒", href: "#notification" },
  { title: "隐私设置", desc: "作品可见性、互动权限与数据展示", href: "#privacy" },
  { title: "关于我们", desc: "版本信息、帮助与反馈入口", href: "#about" },
] as const;

const COOKIE_KEYS = ["bs_has_binding", "role", "role_id", "has_binding", "token", "access_token", "refresh_token", "bs_token", "v2_access_token", "v2_refresh_token"];

function clearLoginCookies() {
  if (typeof document === "undefined") return;
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  const hostParts = ["", "; path=/", "; path=/m"];
  const domain = window.location.hostname ? `; domain=${window.location.hostname}` : "";

  COOKIE_KEYS.forEach((key) => {
    hostParts.forEach((path) => {
      document.cookie = `${key}=; expires=${expires}${path}${domain}`;
    });
  });
}

function resolveVariant(schoolLevelId?: string | null) {
  const value = String(schoolLevelId ?? "").toLowerCase();
  if (value.includes("middle") || value.includes("junior") || value.includes("初中") || value.includes("中学") || value.includes("high") || value.includes("senior")) {
    return "middle";
  }
  return "primary";
}

export default function MobileSettingsPage() {
  const { userContext } = useMobileContext();
  const variant = resolveVariant(userContext?.schoolLevelId);

  return (
    <div className={cn("space-y-4 p-4", variant === "primary" ? "pb-24" : "pb-24") }>
      <MobileCard title="设置" subtitle={userContext?.userNickName ?? "当前账号的静态设置页"}>
        <div className="space-y-3">
          {SETTING_ITEMS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center justify-between rounded-3xl border bg-background px-4 py-4 transition hover:bg-muted/40 active:scale-[0.99]"
            >
              <div>
                <div className="text-sm font-semibold text-foreground">{item.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <span className="text-muted-foreground">›</span>
            </Link>
          ))}
        </div>
      </MobileCard>

      <MobileCard title="退出登录" subtitle="仅前端本地退出，不调用 API">
        <button
          type="button"
          onClick={() => {
            clearLoginCookies();
            window.location.href = "/m/login";
          }}
          className="w-full rounded-3xl bg-red-500 px-4 py-4 text-base font-semibold text-white shadow-lg shadow-red-500/25 transition active:scale-[0.99] hover:bg-red-600"
        >
          退出登录
        </button>
      </MobileCard>
    </div>
  );
}
