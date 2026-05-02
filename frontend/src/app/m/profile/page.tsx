"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MobileCard } from "@/components/mobile/MobileCard";
import { ChildSwitcher } from "@/components/mobile/ChildSwitcher";
import { useMobileContext } from "@/contexts/MobileContext";
import { resolveMobileAudience } from "@/components/mobile/mobile-role";
import { cn } from "@/lib/utils";

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

export default function MobileProfilePage() {
  const { userContext, currentChild, currentChildId } = useMobileContext();
  const audience = useMemo(
    () => resolveMobileAudience({ schoolLevelId: userContext?.schoolLevelId, role: userContext?.role }),
    [userContext?.schoolLevelId, userContext?.role],
  );
  const roleLabel = userContext?.role?.replace(/^role_/i, "").toUpperCase() ?? "未知";
  const colorDot = audience === "primary" ? "bg-amber-500" : audience === "middle" ? "bg-slate-500" : "bg-emerald-500";

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
            { title: "作业 / 任务", desc: "布置作业、查看提交进度", href: "/m/tasks" },
            { title: "审核中心", desc: "审核作品、任务与申请" },
            { title: "数据统计", desc: "课堂数据与完成率统计" },
          ]
        : [
            { title: "我的实验", desc: "实验过程、记录与回看", href: "/m/experiments" },
            { title: "作业", desc: "查看待完成与已完成作业", href: "/m/tasks" },
            { title: "作品", desc: "我的提交与展示作品", href: "/m/works" },
            { title: "勋章积分", desc: "奖励勋章与积分成长", href: "/m/badges" },
          ];

  const summaryStats =
    audience === "parent"
      ? [
          { label: "孩子数量", value: "3" },
          { label: "作业待办", value: "2" },
          { label: "材料提醒", value: "1" },
        ]
      : audience === "teacher"
        ? [
            { label: "班级数量", value: "4" },
            { label: "待审核", value: "6" },
            { label: "统计异常", value: "0" },
          ]
        : [
            { label: "实验数", value: "12" },
            { label: "作业数", value: "8" },
            { label: "勋章", value: "5" },
          ];

  return (
    <div className="space-y-4 p-4 md:pb-4">
      <MobileCard title="个人中心" subtitle={userContext?.userNickName ?? "未登录"}>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className={cn("h-12 w-12 rounded-full", colorDot)} />
            <div>
              <div className="font-semibold">{userContext?.userNickName ?? "未知用户"}</div>
              <div className="text-xs text-muted-foreground">{roleLabel}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {summaryStats.map((item) => (
              <div key={item.label} className="rounded-2xl bg-muted/50 px-3 py-2 text-center">
                <div className="text-base font-semibold">{item.value}</div>
                <div className="text-[11px] text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
          {currentChildId ? <div className="rounded-2xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">当前孩子 ID：{currentChildId}</div> : null}
        </div>
      </MobileCard>

      {audience === "parent" ? <ChildSwitcher /> : null}

      <MobileCard title={audience === "parent" ? "家长功能" : audience === "teacher" ? "教师功能" : "学生功能"} subtitle="快捷入口">
        <SectionList items={sections} />
      </MobileCard>

      {audience !== "teacher" ? (
        <MobileCard title="最近动态" subtitle="使用静态数据模拟响应式内容">
          <div className="space-y-2 text-sm text-muted-foreground">
            {audience === "parent" ? (
              <>
                <div className="rounded-2xl border px-3 py-2">小明：今日完成科学实验视频学习</div>
                <div className="rounded-2xl border px-3 py-2">小红：待提交手工材料照片</div>
              </>
            ) : (
              <>
                <div className="rounded-2xl border px-3 py-2">实验作品《会转的纸风车》已提交</div>
                <div className="rounded-2xl border px-3 py-2">勋章积分 +20，解锁新任务</div>
              </>
            )}
          </div>
        </MobileCard>
      ) : (
        <MobileCard title="课堂提醒" subtitle="静态假数据">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="rounded-2xl border px-3 py-2">三年级一班：明日提交实验记录</div>
            <div className="rounded-2xl border px-3 py-2">四年级二班：审核中心有 2 条待处理</div>
          </div>
        </MobileCard>
      )}
    </div>
  );
}
