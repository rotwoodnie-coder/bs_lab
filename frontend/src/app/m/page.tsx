"use client";

import Link from "next/link";
import { MobileCard } from "@/components/mobile/MobileCard";
import { useMobileContext } from "@/contexts/MobileContext";
import { resolveMobileAudience } from "@/components/mobile/mobile-role";
import { cn } from "@/lib/utils";

const HOME_DATA = {
  student_001: {
    title: "风力实验 · 小明专属",
    subtitle: "大标题 + 风格化背景，轻松进入实验广场",
    list: [
      { title: "安全实验：自制简易风向标", desc: "王老师 · 420s · 基础实验", href: "/m/video/video_demo", accent: "from-orange-400 to-amber-500" },
      { title: "相关实验 1", desc: "王老师 · 360s · 推荐", href: "/m/video/video_demo_1", accent: "from-fuchsia-500 to-pink-500" },
      { title: "创意材料：风车小屋", desc: "王老师 · 480s · 观察任务", href: "/m/video/video_demo", accent: "from-cyan-400 to-sky-500" },
    ],
  },
  student_002: {
    title: "光学实验 · 小红专属",
    subtitle: "大标题 + 风格化背景，轻松进入实验广场",
    list: [
      { title: "安全实验：彩虹投影", desc: "王老师 · 360s · 基础实验", href: "/m/video/video_demo_1", accent: "from-rose-400 to-red-500" },
      { title: "相关实验 2", desc: "王老师 · 480s · 推荐", href: "/m/video/video_demo", accent: "from-violet-500 to-purple-600" },
      { title: "光影观察记录", desc: "王老师 · 300s · 课后打卡", href: "/m/video/video_demo_1", accent: "from-emerald-400 to-teal-500" },
    ],
  },
  teacher: {
    title: "教师视频广场",
    subtitle: "更高信息密度的静态视频库，便于快速浏览与引用",
    searchHint: "搜索实验名称、年级、知识点",
    list: [
      { title: "课堂演示：浮力实验", desc: "王老师 · 6 分钟 · 三年级 · 被引用 12 次", href: "/m/video/video_demo", accent: "from-sky-500 to-cyan-600" },
      { title: "实验拆解：光的折射", desc: "王老师 · 8 分钟 · 四年级 · 被引用 9 次", href: "/m/video/video_demo_1", accent: "from-violet-500 to-fuchsia-600" },
      { title: "安全规范：酒精灯使用", desc: "王老师 · 5 分钟 · 全学段 · 被引用 21 次", href: "/m/video/video_demo", accent: "from-emerald-500 to-teal-600" },
      { title: "材料准备：纸风车课堂", desc: "王老师 · 7 分钟 · 二年级 · 被引用 12 次", href: "/m/video/video_demo_1", accent: "from-amber-500 to-orange-600" },
      { title: "课后延伸：观察记录模板", desc: "王老师 · 4 分钟 · 三年级 · 被引用 5 次", href: "/m/video/video_demo", accent: "from-rose-500 to-pink-600" },
      { title: "审核参考：作品评价示例", desc: "王老师 · 9 分钟 · 教师精选 · 被引用 18 次", href: "/m/video/video_demo_1", accent: "from-slate-500 to-slate-700" },
    ],
  },
  default: {
    title: "实验推荐",
    subtitle: "继续浏览静态推荐内容",
    list: [
      { title: "安全实验：自制简易风向标", desc: "420s · 基础实验", href: "/m/video/video_demo", accent: "from-slate-500 to-slate-700" },
      { title: "相关实验 1", desc: "360s · 推荐", href: "/m/video/video_demo_1", accent: "from-slate-500 to-slate-600" },
    ],
  },
} as const;

function TeacherSearchBar() {
  return (
    <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-3 backdrop-blur">
      <div className="flex items-center gap-3 rounded-[1.25rem] bg-white/95 px-4 py-3 text-slate-500 shadow-inner">
        <span className="text-lg">🔎</span>
        <span className="text-sm">搜索实验名称、年级、知识点</span>
      </div>
    </div>
  );
}

function HomeContent() {
  const { userContext, currentChildId, currentChild } = useMobileContext();
  const audience = resolveMobileAudience({ schoolLevelId: userContext?.schoolLevelId, role: userContext?.role });
  const isStudent = audience === "primary" || audience === "middle";
  const isPrimary = audience === "primary";
  const isTeacher = audience === "teacher";
  const data = isTeacher
    ? HOME_DATA.teacher
    : currentChildId === "student_002"
      ? HOME_DATA.student_002
      : currentChildId === "student_001"
        ? HOME_DATA.student_001
        : HOME_DATA.default;
  const headerTitle = isTeacher ? data.title : isStudent ? data.title : data.title;
  const headerSubtitle = isTeacher
    ? data.subtitle
    : isStudent
      ? data.subtitle
      : currentChild
        ? `当前查看：${currentChild.studentUserName}`
        : data.subtitle;

  return (
    <div className="space-y-4 p-4 md:p-5">
      <section
        className={cn(
          "overflow-hidden rounded-[2rem] border border-white/40 bg-gradient-to-br p-5 text-white shadow-xl shadow-slate-900/10",
          isTeacher ? "from-slate-900 via-slate-800 to-indigo-950" : isPrimary ? "from-cyan-500 via-sky-500 to-indigo-600" : "from-slate-700 via-slate-800 to-slate-950",
        )}
      >
        <div className="absolute" aria-hidden="true" />
        <div className="relative space-y-3">
          <div className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
            {isTeacher ? "教师端视频广场" : "学生端视频广场"}
          </div>
          <h1 className={cn("font-black leading-tight", isTeacher ? "text-2xl" : isPrimary ? "text-3xl" : "text-2xl")}>{headerTitle}</h1>
          <p className="max-w-xl text-sm text-white/80">{headerSubtitle}</p>
          {isTeacher ? <TeacherSearchBar /> : null}
          <div className={cn("mt-4 grid gap-3", isTeacher ? "grid-cols-3" : isStudent && isPrimary ? "grid-cols-1" : "grid-cols-2")}>
            {isTeacher ? (
              <div className="rounded-3xl bg-white/15 p-4 backdrop-blur">
                <div className="text-xs text-white/70">信息密度</div>
                <div className="mt-1 text-lg font-semibold">双列瀑布流</div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {isTeacher ? (
        <div className="columns-2 gap-3 space-y-3 md:columns-3">
          {data.list.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="mb-3 block break-inside-avoid overflow-hidden rounded-[1.75rem] border border-border/60 bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={cn("h-24 rounded-[1.5rem] bg-gradient-to-br", item.accent)} />
              <div className="mt-4 text-base font-semibold leading-snug">{item.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{item.desc}</div>
              <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">引用次数：静态数据</div>
            </Link>
          ))}
        </div>
      ) : audience === "middle" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.list.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group overflow-hidden rounded-[1.75rem] border border-border/60 bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={cn("h-28 rounded-[1.5rem] bg-gradient-to-br", item.accent)} />
              <div className="mt-4 text-base font-semibold">{item.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{item.desc}</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data.list.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-4 rounded-[1.75rem] border border-border/60 bg-background p-4 shadow-sm transition active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={cn("h-20 w-20 shrink-0 rounded-[1.5rem] bg-gradient-to-br", item.accent)} />
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold">{item.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileHomePage() {
  return <HomeContent />;
}
