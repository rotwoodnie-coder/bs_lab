"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MobileCard } from "@/components/mobile/MobileCard";
import { useMobileContext } from "@/contexts/MobileContext";
import { resolveMobileAudience } from "@/components/mobile/mobile-role";
import { cn } from "@/lib/utils";

const COOKIE_KEYS = ["bs_has_binding", "role", "role_id", "has_binding", "token", "access_token", "refresh_token", "bs_token"];

const PARENT_CHILDREN = [
  {
    studentUserId: "student_001",
    studentUserName: "小明",
    avatar: "XM",
    classLabel: "三年级一班",
    recentCompletion: "昨日完成科学实验视频学习，上传了材料准备图",
    pendingTasks: 2,
    finishedTasks: 5,
  },
  {
    studentUserId: "student_002",
    studentUserName: "小红",
    avatar: "XH",
    classLabel: "四年级二班",
    recentCompletion: "今天完成风向标制作步骤，待家长协助上传成品",
    pendingTasks: 1,
    finishedTasks: 6,
  },
  {
    studentUserId: "student_003",
    studentUserName: "小宇",
    avatar: "XY",
    classLabel: "初一一班",
    recentCompletion: "已批阅实验报告，获得老师反馈与建议",
    pendingTasks: 3,
    finishedTasks: 4,
  },
];

const STUDENT_PRIMARY_STATS = [
  { label: "我的实验", value: "12 个实验", icon: "🧪", tone: "from-amber-400 to-orange-500" },
  { label: "作业", value: "8 个作业", icon: "📚", tone: "from-emerald-400 to-teal-500" },
  { label: "作品", value: "5 个作品", icon: "🎨", tone: "from-sky-400 to-cyan-500" },
  { label: "勋章积分", value: "320 积分", icon: "🏅", tone: "from-fuchsia-400 to-rose-500" },
] as const;

const STUDENT_MIDDLE_STATS = [
  { label: "我的实验", value: "12 个实验" },
  { label: "作业", value: "8 个作业" },
  { label: "作品", value: "5 个作品" },
  { label: "勋章积分", value: "320 积分" },
] as const;

const STUDENT_PRIMARY_SHORTCUTS = [
  { title: "我的实验", desc: "查看实验过程与回放", href: "/m/experiments", icon: "🧪", tone: "from-orange-400 to-amber-500" },
  { title: "作业", desc: "查看待完成与已完成任务", href: "/m/tasks", icon: "📚", tone: "from-emerald-400 to-green-500" },
  { title: "作品", desc: "我的提交与展示作品", href: "/m/works", icon: "🎨", tone: "from-sky-400 to-cyan-500" },
  { title: "勋章积分", desc: "奖励勋章与积分成长", href: "/m/badges", icon: "🏅", tone: "from-fuchsia-400 to-rose-500" },
  { title: "班级", desc: "三年级一班", href: "#class", icon: "🏫", tone: "from-violet-400 to-indigo-500" },
  { title: "设置", desc: "账号与偏好设置", href: "/m/settings", icon: "⚙️", tone: "from-slate-400 to-slate-600" },
] as const;

const STUDENT_MIDDLE_SHORTCUTS = [
  { title: "我的实验", desc: "实验库", href: "/m/experiments" },
  { title: "作业", desc: "任务与提交", href: "/m/tasks" },
  { title: "作品", desc: "我的作品", href: "/m/works" },
  { title: "勋章积分", desc: "积分与勋章", href: "/m/badges" },
  { title: "班级", desc: "三年级一班", href: "#class" },
  { title: "设置", desc: "账号与偏好", href: "/m/settings" },
] as const;

const STUDENT_PRIMARY_UPDATES = [
  { title: "🌈 新实验解锁啦", desc: "你的《会转的纸风车》可以继续升级啦", time: "刚刚" },
  { title: "⭐ 勋章到账", desc: "完成今日挑战，获得 20 积分", time: "12 分钟前" },
  { title: "🎉 作品展示中", desc: "老师夸你把步骤图画得很清楚", time: "今天" },
] as const;

const STUDENT_MIDDLE_UPDATES = [
  { title: "实验作品《会转的纸风车》已提交", time: "今天 10:20" },
  { title: "勋章积分 +20，解锁新任务", time: "今天 09:45" },
  { title: "作业《材料准备》已完成", time: "昨天 18:10" },
] as const;

const PARENT_TOOL_CARDS = [
  {
    title: "材料助手",
    desc: "快速查看当前孩子实验所需材料清单，提前准备更省心。",
    content: ["自制风向标所需：卡纸、吸管、大头针、橡皮泥、剪刀、胶带"],
  },
  {
    title: "安全设置",
    desc: "用于管理孩子作品可见性与提醒偏好，静态展示常用开关。",
    switches: [
      { label: "允许查看作品", enabled: true },
      { label: "接收作业提醒", enabled: true },
      { label: "允许家长代交", enabled: true },
      { label: "接收批阅通知", enabled: false },
    ],
  },
  {
    title: "通知中心",
    desc: "汇总与家庭协助相关的重要消息，帮助家长快速处理。",
    notifications: [
      "学校新增周末实验任务，截止时间为周日 20:00。",
      "孩子的科学报告已批阅，老师建议补充实验步骤说明。",
      "材料提醒：下周实验需要提前准备彩色纸张。",
    ],
  },
] as const;

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

function StudentSummaryStats({ stage }: { stage: "primary" | "middle" }) {
  const stats = stage === "primary" ? STUDENT_PRIMARY_STATS : STUDENT_MIDDLE_STATS;

  if (stage === "primary") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {stats.map((item) => (
          <div key={item.label} className={cn("rounded-[20px] p-4 text-white shadow-lg", `bg-gradient-to-br ${item.tone}`)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-3xl font-black leading-none">{item.value}</div>
                <div className="mt-2 text-sm font-semibold text-white/90">{item.label}</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl shadow-inner">{item.icon}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
          <div className="text-[11px] text-slate-500">{item.label}</div>
          <div className="mt-1 flex items-end gap-2">
            <div className="text-2xl font-semibold leading-none text-slate-900">{item.value}</div>
            <div className="text-xs text-slate-500">静态统计</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StudentShortcuts({ stage }: { stage: "primary" | "middle" }) {
  const shortcuts = stage === "primary" ? STUDENT_PRIMARY_SHORTCUTS : STUDENT_MIDDLE_SHORTCUTS;

  if (stage === "primary") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((item) => (
          <Link key={item.title} href={item.href} className={cn("rounded-[22px] p-4 text-white shadow-md transition active:scale-[0.99]", `bg-gradient-to-br ${item.tone}`)}>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl shadow-inner">{item.icon}</div>
              <div className="min-w-0">
                <div className="text-base font-bold leading-tight">{item.title}</div>
                <div className="mt-1 text-xs text-white/90">{item.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {shortcuts.map((item) => (
        <Link key={item.title} href={item.href} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 transition hover:bg-slate-50 active:scale-[0.99]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-700">•</div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{item.title}</div>
            <div className="truncate text-[11px] text-slate-500">{item.desc}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function StudentUpdates({ stage }: { stage: "primary" | "middle" }) {
  if (stage === "primary") {
    return (
      <div className="space-y-3">
        {STUDENT_PRIMARY_UPDATES.map((item) => (
          <div key={item.title} className="flex gap-3 rounded-3xl border border-orange-100 bg-white px-4 py-3 shadow-sm">
            <div className="mt-1 h-3 w-3 rounded-full bg-amber-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900">{item.title}</div>
              <div className="mt-1 text-sm leading-6 text-slate-600">{item.desc}</div>
              <div className="mt-2 text-[11px] text-slate-400">{item.time}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {STUDENT_MIDDLE_UPDATES.map((item) => (
        <div key={item.title} className="flex gap-3 border-l-2 border-slate-200 pl-4">
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-400 ring-4 ring-slate-100" />
          <div className="pb-2">
            <div className="text-sm font-medium text-slate-900">{item.title}</div>
            <div className="mt-1 text-[11px] text-slate-500">{item.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionList({ items }: { items: Array<{ title: string; desc: string; href?: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link key={item.title} href={item.href ?? "#"} className="rounded-3xl border bg-background p-4 transition hover:bg-muted/40">
          <div className="text-sm font-semibold">{item.title}</div>
          <div className="mt-1 text-xs text-muted-foreground">{item.desc}</div>
        </Link>
      ))}
    </div>
  );
}

function TeacherTodoItem({ text }: { text: string }) {
  return <div className="rounded-2xl border px-3 py-2 text-sm text-muted-foreground">{text}</div>;
}

function ParentChildSelector() {
  const { children, currentChildId, setCurrentChildId } = useMobileContext();
  const childOptions = children.length > 0 ? children : PARENT_CHILDREN;

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {childOptions.map((child) => {
        const active = child.studentUserId === currentChildId;
        return (
          <button
            key={child.studentUserId}
            type="button"
            onClick={() => setCurrentChildId(child.studentUserId)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-3xl border px-3 py-4 text-center transition active:scale-[0.99]",
              active ? "border-primary bg-primary/10 shadow-sm" : "bg-background hover:bg-muted/40",
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold",
                active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
              )}
            >
              {child.avatar}
            </div>
            <div>
              <div className="text-sm font-semibold">{child.studentUserName}</div>
              <div className="text-[11px] text-muted-foreground">{child.classLabel}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function MobileProfilePage() {
  const { userContext, currentChild, getSchoolStage } = useMobileContext();
  const audience = useMemo(() => resolveMobileAudience({ schoolLevelId: userContext?.schoolLevelId, role: userContext?.role }), [userContext?.schoolLevelId, userContext?.role]);
  const stage = getSchoolStage() === "middle" ? "middle" : "primary";
  const isStudent = audience === "primary" || audience === "middle";
  const roleLabel = userContext?.role?.replace(/^role_/i, "").toUpperCase() ?? "未知";
  const stageLabel = stage === "primary" ? "小学" : "中学";
  const colorDot = audience === "primary" ? "bg-amber-500" : audience === "middle" ? "bg-slate-500" : "bg-emerald-500";
  const isTeacher = audience === "teacher";

  const sections =
    audience === "parent"
      ? [
          { title: "我的孩子", desc: currentChild ? `当前：${currentChild.studentUserName}` : "查看并切换孩子", href: "/m" },
          { title: "作业 / 任务", desc: "查看本周待办与完成情况", href: "/m/tasks" },
          { title: "材料助手", desc: "实验材料清单与准备建议" },
          { title: "设置", desc: "账号、通知、隐私与偏好设置" },
        ]
      : audience === "teacher"
        ? [
            { title: "班级管理", desc: "班级、分组与课堂组织" },
            { title: "作业/任务", desc: "布置与进度", href: "/m/tasks" },
            { title: "实验库", desc: "我的实验", href: "/m/experiments" },
            { title: "审核中心 · 含小法庭待仲裁", desc: "作品审核与小法庭仲裁" },
            { title: "数据统计", desc: "课堂数据与完成率统计" },
            { title: "设置", desc: "账号、通知与课堂偏好", href: "/m/settings" },
          ]
        : [
            { title: "我的实验", desc: "实验过程、记录与回看", href: "/m/experiments" },
            { title: "作业", desc: "查看待完成与已完成作业", href: "/m/tasks" },
            { title: "作品", desc: "我的提交与展示作品", href: "/m/works" },
            { title: "勋章积分", desc: "奖励勋章与积分成长", href: "/m/badges" },
            { title: "班级", desc: "三年级一班", href: "#class" },
            { title: "设置", desc: "账号与偏好设置", href: "/m/settings" },
          ];

  const activeChild = currentChild ?? PARENT_CHILDREN[0];
  const activeChildMeta = PARENT_CHILDREN.find((item) => item.studentUserId === activeChild?.studentUserId) ?? PARENT_CHILDREN[0];

  return (
    <div className="space-y-4 p-4 md:pb-4">
      <MobileCard title="个人中心" subtitle={userContext?.userNickName ?? "未登录"}>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className={cn("h-12 w-12 rounded-full", colorDot)} />
            <div>
              <div className="font-semibold">{userContext?.userNickName ?? "未知用户"}</div>
              <div className="text-xs text-muted-foreground">{isStudent ? stageLabel : roleLabel}</div>
            </div>
          </div>
          {isStudent ? <StudentSummaryStats stage={stage} /> : null}
        </div>
      </MobileCard>

      {audience === "parent" ? (
        <>
          <MobileCard title="我的孩子" subtitle="点击头像切换当前孩子">
            <ParentChildSelector />
          </MobileCard>

          <MobileCard title={`孩子信息 · ${activeChildMeta.studentUserName}`} subtitle="作业进度与最近完成情况">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-3xl bg-muted/40 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">{activeChildMeta.studentUserName}</div>
                  <div className="text-xs text-muted-foreground">{activeChildMeta.classLabel}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold">待完成 {activeChildMeta.pendingTasks}</div>
                  <div className="text-xs text-muted-foreground">已完成 {activeChildMeta.finishedTasks}</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border bg-background p-4">
                  <div className="text-xs text-muted-foreground">待完成任务</div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">{activeChildMeta.pendingTasks}</div>
                </div>
                <div className="rounded-3xl border bg-background p-4">
                  <div className="text-xs text-muted-foreground">最近完成情况</div>
                  <div className="mt-2 text-sm leading-6 text-foreground">{activeChildMeta.recentCompletion}</div>
                </div>
              </div>

              <Link href="/m/upload" className="inline-flex w-full items-center justify-center rounded-3xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.99] hover:opacity-95">
                协助上传
              </Link>
            </div>
          </MobileCard>

          <div className="grid gap-4">
            {PARENT_TOOL_CARDS.map((card) => (
              <MobileCard key={card.title} title={card.title} subtitle={card.desc}>
                {card.content ? (
                  <div className="rounded-3xl border bg-background p-4 text-sm leading-7 text-foreground">{card.content[0]}</div>
                ) : null}

                {card.switches ? (
                  <div className="space-y-3">
                    {card.switches.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-3xl border bg-background px-4 py-3">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", item.enabled ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}>{item.enabled ? "已开启" : "已关闭"}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {card.notifications ? (
                  <div className="space-y-2">
                    {card.notifications.map((item) => (
                      <div key={item} className="rounded-3xl border bg-background px-4 py-3 text-sm text-foreground">
                        {item}
                      </div>
                    ))}
                  </div>
                ) : null}
              </MobileCard>
            ))}

            <MobileCard title="设置" subtitle="账号、通知、隐私与偏好设置">
              <Link href="/m/settings" className="inline-flex w-full items-center justify-center rounded-3xl bg-background px-4 py-4 text-base font-semibold text-foreground shadow-sm ring-1 ring-border transition active:scale-[0.99] hover:bg-muted/40">
                前往设置
              </Link>
            </MobileCard>
          </div>
        </>
      ) : audience === "teacher" ? (
        <>
          <MobileCard title="教师功能" subtitle="快捷入口">
            <SectionList items={sections} />
          </MobileCard>
          <MobileCard title="待办事项" subtitle="静态假数据">
            <div className="space-y-2">
              <TeacherTodoItem text="审核中心有 2 条待处理" />
              <TeacherTodoItem text="三年级一班明日提交实验记录" />
              <TeacherTodoItem text="四年级二班待确认实验材料清单" />
            </div>
          </MobileCard>
        </>
      ) : (
        <>
          <MobileCard title="学生功能" subtitle={stage === "primary" ? "小学版视觉更活泼" : "中学版信息更紧凑"}>
            <StudentShortcuts stage={stage} />
          </MobileCard>
          <MobileCard title="最近动态" subtitle="静态数据模拟">
            <StudentUpdates stage={stage} />
          </MobileCard>
        </>
      )}

      <MobileCard title="账号操作" subtitle="仅前端本地退出">
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
