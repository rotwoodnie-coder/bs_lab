"use client";

import Link from "next/link";
import { MobileCard } from "@/components/mobile/MobileCard";
import { ChildSwitcher } from "@/components/mobile/ChildSwitcher";
import { useMobileContext } from "@/contexts/MobileContext";

const HOME_DATA = {
  student_001: {
    title: "风力实验 · 小明专属",
    list: [
      { title: "安全实验：自制简易风向标", desc: "420s · 基础实验", href: "/m/video/video_demo" },
      { title: "相关实验 1", desc: "360s · 推荐", href: "/m/video/video_demo_1" },
    ],
  },
  student_002: {
    title: "光学实验 · 小红专属",
    list: [
      { title: "安全实验：彩虹投影", desc: "360s · 基础实验", href: "/m/video/video_demo_1" },
      { title: "相关实验 2", desc: "480s · 推荐", href: "/m/video/video_demo" },
    ],
  },
  default: {
    title: "实验推荐",
    list: [
      { title: "安全实验：自制简易风向标", desc: "420s · 基础实验", href: "/m/video/video_demo" },
      { title: "相关实验 1", desc: "360s · 推荐", href: "/m/video/video_demo_1" },
    ],
  },
} as const;

function HomeContent() {
  const { userContext, currentChildId, currentChild } = useMobileContext();
  const isParent = userContext?.role?.toLowerCase().includes("parent") ?? true;
  const data = currentChildId === "student_002" ? HOME_DATA.student_002 : currentChildId === "student_001" ? HOME_DATA.student_001 : HOME_DATA.default;

  return (
    <div className="space-y-4 p-4">
      {isParent ? <ChildSwitcher /> : null}
      <MobileCard title={data.title} subtitle={currentChild ? `当前查看：${currentChild.studentUserName}` : "为你推荐今天最适合的实验"}>
        <div className="grid gap-3 md:grid-cols-2">
          {data.list.map((item) => (
            <Link key={item.title} href={item.href} className="rounded-3xl border p-4 hover:bg-muted/50">
              <div className="text-base font-semibold">{item.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{item.desc}</div>
            </Link>
          ))}
        </div>
      </MobileCard>
    </div>
  );
}

export default function MobileHomePage() {
  return <HomeContent />;
}
