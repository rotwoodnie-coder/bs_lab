"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMobileContext } from "@/contexts/MobileContext";
import { resolveMobileAudience } from "@/components/mobile/mobile-role";
import { ChildSwitcher } from "@/components/mobile/ChildSwitcher";
import { cn } from "@/lib/utils";
import { buildApiUrl } from "@/lib/core-api-shared";

const MAGIC_PROFESSOR = {
  name: "魔法教授",
  avatar: "🧙‍♂️",
  defaultLines: ["想做什么实验？", "点击场景卡片试试吧！"],
  scenePrompts: {
    student_001: "风力场景很有趣，先试试自制风向标吧！",
    student_002: "光学场景已经准备好，去看看彩虹投影实验。",
    default: "先选择一个场景，再开始你的魔法实验。",
  },
  experimentPrompts: {
    student_001: "建议先观察风的方向，再动手制作风向标。",
    student_002: "试着调整光源角度，看看彩虹会怎么变化。",
    default: "选择一个实验卡片，魔法教授会继续提示你。",
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

const ACCENT_PALETTE = [
  "from-orange-400 to-amber-500",
  "from-fuchsia-500 to-pink-500",
  "from-cyan-400 to-sky-500",
  "from-rose-400 to-red-500",
  "from-violet-500 to-purple-600",
  "from-emerald-400 to-teal-500",
  "from-sky-500 to-cyan-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-slate-500 to-slate-700",
] as const;

type VideoCard = {
  title: string;
  desc: string;
  href: string;
  accent: string;
  refCount?: number;
};

/** 降级静态数据：确保每组至少 3 条 */
const HOME_DATA: Record<string, { title: string; subtitle: string; searchHint?: string; list: VideoCard[] }> = {
  student_001: {
    title: "探索广场",
    subtitle: "大标题 + 风格化背景，轻松进入实验广场",
    list: [
      { title: "安全实验：自制简易风向标", desc: "王老师 · 420s · 基础实验", href: "/m/video/video_demo", accent: "from-orange-400 to-amber-500" },
      { title: "相关实验 1", desc: "王老师 · 360s · 推荐", href: "/m/video/video_demo_1", accent: "from-fuchsia-500 to-pink-500" },
      { title: "创意材料：风车小屋", desc: "王老师 · 480s · 观察任务", href: "/m/video/video_demo", accent: "from-cyan-400 to-sky-500" },
    ],
  },
  student_002: {
    title: "科学小实验",
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
      { title: "创意手工：纸杯电话", desc: "300s · 动手实践", href: "/m/video/video_demo", accent: "from-teal-500 to-cyan-600" },
    ],
  },
};

function MagicProfessorBubble({ lines }: { lines: string[] }) {
  return (
    <div className="inline-flex flex-col gap-1 rounded-[1.4rem] rounded-tl-md border border-cyan-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg shadow-cyan-950/10">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>
  );
}

function MagicProfessorPanel({ lines }: { lines: string[] }) {
  return (
    <div className="sticky top-3 z-30 mb-4 flex items-start gap-3 rounded-[1.8rem] border border-white/60 bg-white/90 px-3 py-3 shadow-xl shadow-slate-900/10 backdrop-blur sm:top-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 text-2xl text-white shadow-md shadow-cyan-950/20">
        {MAGIC_PROFESSOR.avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">{MAGIC_PROFESSOR.name}</div>
        <MagicProfessorBubble lines={lines} />
      </div>
    </div>
  );
}

async function fetchExpList(schoolLevelId: string | null): Promise<VideoCard[]> {
  const params = new URLSearchParams();
  params.set("status", "y");
  params.set("pageSize", "30");
  if (schoolLevelId) params.set("schoolLevelId", schoolLevelId);

  const res = await fetch(buildApiUrl(`/v2/exp?${params.toString()}`), { credentials: "include" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const json = await res.json();
  const items: Record<string, unknown>[] = json?.data?.items ?? [];

  return items.map((item, index) => {
    const owner = item.displayOwnerName ?? item.createUserId ?? "未知";
    const classHour = typeof item.classHour === "number" ? item.classHour : null;
    const durationStr = classHour != null ? `${Math.round(classHour * 60)}s` : "";
    const parts = [String(owner), durationStr].filter(Boolean);
    return {
      title: String(item.expName ?? "未命名实验"),
      desc: parts.join(" · "),
      href: `/m/video/${encodeURIComponent(String(item.expId))}`,
      accent: ACCENT_PALETTE[index % ACCENT_PALETTE.length],
      refCount: typeof item.collectionNum === "number" ? item.collectionNum : 0,
    };
  });
}

function HomeContent() {
  const { userContext, getSchoolStage, currentChildId } = useMobileContext();
  const [realCards, setRealCards] = useState<VideoCard[] | null>(null);

  const audience = resolveMobileAudience({ schoolLevelId: userContext?.schoolLevelId, role: userContext?.role });
  const schoolStage = getSchoolStage();
  const isPrimary = schoolStage === "primary";
  const isTeacher = audience === "teacher";
  const isParent = audience === "parent";
  const isMiddle = schoolStage === "middle";
  const schoolLevelId = userContext?.schoolLevelId ?? null;

  // 页面挂载 & schoolLevelId 变化时重新获取实验列表
  useEffect(() => {
    let cancelled = false;
    setRealCards(null);
    fetchExpList(schoolLevelId).then((cards) => {
      if (cancelled) return;
      // 后端返回空数组时也降级（不走 realCards）
      if (cards.length === 0) return;
      setRealCards(cards);
    }).catch(() => {
      // 请求失败 → 保持 null，触发静态数据降级
    });
    return () => { cancelled = true; };
  }, [schoolLevelId]);

  const staticData = isTeacher
    ? HOME_DATA.teacher
    : isPrimary
      ? HOME_DATA.student_001
      : HOME_DATA.default;
  const cards = realCards ?? staticData.list;

  const headerTitle = isTeacher ? staticData.title : isPrimary ? "探索广场" : staticData.title;
  const headerSubtitle = staticData.subtitle;

  const cardShellClass = isPrimary
    ? "rounded-[20px] border-white/55 bg-white/82 shadow-[0_16px_40px_rgba(244,114,182,0.14)]"
    : "rounded-xl border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]";

  const buttonClass = isPrimary
    ? "min-h-12 rounded-2xl px-4 py-3 text-[16px] font-semibold"
    : "min-h-10 rounded-xl px-3.5 py-2.5 text-[14px] font-medium";

  return (
    <div className={cn("space-y-4 p-4 md:p-5", isPrimary ? "text-slate-700" : "text-slate-800") }>
      <section
        className={cn(
          "overflow-hidden border p-5 text-white",
          isPrimary ? "rounded-[24px] border-white/40 bg-gradient-to-br from-orange-300 via-pink-400 to-rose-200 shadow-[0_18px_44px_rgba(251,146,60,0.22)]" : "rounded-xl border-slate-200 bg-slate-700 shadow-[0_14px_30px_rgba(15,23,42,0.12)]",
        )}
      >
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
            <span>{isPrimary ? "🌈" : "📘"}</span>
            <span>{isTeacher ? "教师端视频广场" : isPrimary ? "小学探索广场" : "中学学习广场"}</span>
          </div>
          <h1 className={cn("font-black leading-tight", isPrimary ? "text-3xl" : "text-2xl")}>{headerTitle}</h1>
          <p className="max-w-xl text-sm text-white/85">{headerSubtitle}</p>
          {isTeacher ? <TeacherSearchBar /> : null}
          {isParent ? <ChildSwitcher /> : null}
        </div>
      </section>

      {isTeacher ? (
        <div className="columns-2 gap-3 space-y-3 md:columns-3">
          {cards.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn("mb-3 block break-inside-avoid overflow-hidden border p-4 transition hover:-translate-y-0.5 hover:shadow-md", cardShellClass)}
            >
              <div className={cn("h-24 rounded-[1.25rem] bg-gradient-to-br", item.accent)} />
              <div className="mt-4 text-base font-semibold leading-snug">{item.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{item.desc}</div>
              <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">被引用 {item.refCount ?? 0} 次</div>
            </Link>
          ))}
        </div>
      ) : isMiddle ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn("group overflow-hidden border p-3 transition hover:-translate-y-0.5 hover:shadow-md", cardShellClass)}
            >
              <div className={cn("h-20 rounded-[10px] bg-gradient-to-br", item.accent)} />
              <div className="mt-3 text-[15px] font-semibold leading-snug">{item.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{item.desc}</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((item, index) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn("flex items-center gap-4 border p-4 transition active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-md", cardShellClass, buttonClass)}
            >
              <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] text-2xl", item.accent, "bg-gradient-to-br text-white")}>{isPrimary ? ["🧪", "🎨", "🌻"][index % 3] : "📚"}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold">{item.title}</div>
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
