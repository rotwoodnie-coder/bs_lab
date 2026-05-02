"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMobileContext } from "@/contexts/MobileContext";
import { cn } from "@/lib/utils";

const items = [
  { href: "/m", label: "视频广场", icon: "🎬", kidIcon: "📚", middleIcon: "🎓" },
  { href: "/m/assistant", label: "魔法球", icon: "✨", kidIcon: "🪄", middleIcon: "🧭" },
  { href: "/m/profile", label: "我的", icon: "👤", kidIcon: "🐣", middleIcon: "🧑‍🎓" },
] as const;

const HIDDEN_ROUTES = ["/m/login", "/m/bind/child", "/m/bind/success"] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/m") return pathname === "/m" || pathname === "/m/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const { getSchoolStage } = useMobileContext();
  const variant = getSchoolStage();
  const isPrimary = variant === "primary";
  const hide = HIDDEN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (hide) return null;

  return (
    <nav
      aria-label="移动端底部导航"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-white/30 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60",
        isPrimary ? "shadow-[0_-12px_32px_rgba(244,114,182,0.16)]" : "bg-slate-100/90 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]",
        "[@media(orientation:landscape)]:inset-y-0 [@media(orientation:landscape)]:left-0 [@media(orientation:landscape)]:right-auto [@media(orientation:landscape)]:w-20 [@media(orientation:landscape)]:border-t-0 [@media(orientation:landscape)]:border-r",
        "[@media(orientation:landscape)]:min-w-20",
      )}
    >
      <div
        className={cn(
          "grid grid-cols-3 px-2 py-2",
          "[@media(orientation:landscape)]:flex [@media(orientation:landscape)]:h-full [@media(orientation:landscape)]:flex-col [@media(orientation:landscape)]:items-stretch [@media(orientation:landscape)]:justify-center [@media(orientation:landscape)]:gap-2 [@media(orientation:landscape)]:p-3",
        )}
      >
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          const icon = isPrimary ? item.kidIcon : item.middleIcon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition-colors",
                isPrimary ? "min-h-14 text-[13px]" : "min-h-10 text-[12px]",
                "[@media(orientation:landscape)]:w-full [@media(orientation:landscape)]:justify-start [@media(orientation:landscape)]:rounded-2xl [@media(orientation:landscape)]:px-3 [@media(orientation:landscape)]:py-4",
                active
                  ? isPrimary
                    ? "bg-white/80 text-rose-600 shadow-sm"
                    : "bg-slate-200 text-slate-900"
                  : isPrimary
                    ? "text-slate-600 hover:bg-white/55 hover:text-slate-900"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-900",
              )}
            >
              <span className={cn("leading-none", isPrimary ? "text-2xl" : "text-xl")}>{icon}</span>
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
