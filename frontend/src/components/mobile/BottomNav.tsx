"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/m", label: "视频广场", icon: "🎬" },
  { href: "/m/assistant", label: "魔法球", icon: "✨" },
  { href: "/m/profile", label: "我的", icon: "👤" },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/m") return pathname === "/m" || pathname.startsWith("/m/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="移动端底部导航"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90",
        "[@media(orientation:landscape)]:inset-y-0 [@media(orientation:landscape)]:left-0 [@media(orientation:landscape)]:right-auto [@media(orientation:landscape)]:w-20 [@media(orientation:landscape)]:border-t-0 [@media(orientation:landscape)]:border-r",
        "[@media(orientation:landscape)]:min-w-20",
      )}
    >
      <div
        className={cn(
          "grid grid-cols-3",
          "[@media(orientation:landscape)]:flex [@media(orientation:landscape)]:h-full [@media(orientation:landscape)]:flex-col [@media(orientation:landscape)]:items-stretch [@media(orientation:landscape)]:justify-center [@media(orientation:landscape)]:gap-2 [@media(orientation:landscape)]:p-3",
        )}
      >
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium transition-colors",
                "[@media(orientation:landscape)]:w-full [@media(orientation:landscape)]:justify-start [@media(orientation:landscape)]:rounded-2xl [@media(orientation:landscape)]:px-3 [@media(orientation:landscape)]:py-4",
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
