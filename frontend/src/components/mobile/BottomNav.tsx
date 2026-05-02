"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/m", label: "视频广场", icon: "🎬" },
  { href: "/m/assistant", label: "魔法球", icon: "✨" },
  { href: "/m/profile", label: "我的", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:w-20 md:border-t-0 md:border-r md:landscape:flex md:landscape:flex-col md:landscape:items-center md:landscape:justify-center">
      <div className="grid grid-cols-3 md:grid-cols-1 md:gap-2 md:p-3">
        {items.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/m" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-3 text-xs font-medium transition md:rounded-2xl",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
