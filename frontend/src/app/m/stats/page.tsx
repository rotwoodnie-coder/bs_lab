"use client";

import Link from "next/link";
import { MobileCard } from "@/components/mobile/MobileCard";
import { getQuizStats, getLastQuizSubmission, getQuizQuestion } from "@/state/quiz-state";

export default function MobileStatsPage() {
  const stats = getQuizStats();
  const submission = getLastQuizSubmission();
  const question = getQuizQuestion();
  const accuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);

  return (
    <div className="space-y-4 p-4 md:pb-4">
      <MobileCard title="老师端个人中心 / 班级统计" subtitle="直接读取本地 state">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-muted/50 px-3 py-3">
            <div className="text-xl font-semibold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">总提交</div>
          </div>
          <div className="rounded-2xl bg-muted/50 px-3 py-3">
            <div className="text-xl font-semibold">{stats.correct}</div>
            <div className="text-xs text-muted-foreground">正确数量</div>
          </div>
          <div className="rounded-2xl bg-muted/50 px-3 py-3">
            <div className="text-xl font-semibold">{accuracy}%</div>
            <div className="text-xs text-muted-foreground">正确率</div>
          </div>
        </div>
      </MobileCard>

      <MobileCard title="最近一次提交" subtitle="本地模拟事务结果">
        <div className="space-y-2 text-sm">
          <div className="rounded-2xl border px-3 py-2">题目：{question.stem}</div>
          <div className="rounded-2xl border px-3 py-2">答案：{submission ? submission.selectedOptionLabel : "暂无"}</div>
          <div className="rounded-2xl border px-3 py-2">结果：{submission ? (submission.isCorrect ? "答对" : "答错") : "暂无"}</div>
          <div className="rounded-2xl border px-3 py-2">说明：{submission ? question.explanation : "提交答题后展示"}</div>
        </div>
      </MobileCard>

      <div className="flex gap-3">
        <Link href="/m/quiz" className="rounded-full border px-4 py-2">去答题</Link>
        <Link href="/m/profile" className="rounded-full border px-4 py-2">返回个人中心</Link>
      </div>
    </div>
  );
}
