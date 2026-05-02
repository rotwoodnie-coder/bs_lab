"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MobileCard } from "@/components/mobile/MobileCard";
import { getLastQuizSubmission, getQuizQuestion, getQuizStats, submitQuizAnswer } from "@/state/quiz-state";

export default function MobileQuizPage() {
  const question = getQuizQuestion();
  const [selectedOptionId, setSelectedOptionId] = useState<string>(question.options[0]?.id ?? "");
  const [statsVersion, setStatsVersion] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const submission = getLastQuizSubmission();
  const stats = getQuizStats();

  const selectedOption = useMemo(
    () => question.options.find((option) => option.id === selectedOptionId),
    [question.options, selectedOptionId],
  );

  const handleSubmit = () => {
    const result = submitQuizAnswer(selectedOptionId);
    setStatsVersion((prev) => prev + 1);
    const submission = result.submission;
    if (submission && submission.isCorrect) {
      setToast(`恭喜答对 +${submission.rewardPoints} 积分`);
    } else {
      setToast("提交成功，继续加油");
    }
  };

  return (
    <div className="space-y-4 p-4 md:pb-4">
      <MobileCard title="答题挑战" subtitle="静态题目 + 本地事务骨架">
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground">选择题</div>
            <h1 className="mt-2 text-lg font-semibold leading-7">{question.stem}</h1>
            <p className="mt-2 text-sm text-muted-foreground">答题提交后会同步更新本地统计，模拟强一致闭环。</p>
          </div>

          <div className="space-y-2">
            {question.options.map((option) => {
              const active = option.id === selectedOptionId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOptionId(option.id)}
                  className={active ? "w-full rounded-2xl border border-primary bg-primary/10 px-4 py-3 text-left" : "w-full rounded-2xl border bg-background px-4 py-3 text-left"}
                >
                  <div className="font-medium">{option.label}</div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
          >
            提交
          </button>

          {toast ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{toast}</div> : null}
        </div>
      </MobileCard>

      <MobileCard title="答题记录" subtitle="记录到本地 state">
        <div className="space-y-2 text-sm">
          <div className="rounded-2xl border px-3 py-2">当前选择：{selectedOption?.label ?? "未选择"}</div>
          <div className="rounded-2xl border px-3 py-2">最近提交：{submission ? (submission.isCorrect ? "答对" : "答错") : "暂无"}</div>
          <div className="rounded-2xl border px-3 py-2">解析：{submission ? question.explanation : "提交后显示解析"}</div>
        </div>
      </MobileCard>

      <MobileCard title="班级答题统计" subtitle="老师端直接读取本地 state">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-2xl bg-muted/50 px-3 py-3">
            <div className="text-lg font-semibold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">总提交</div>
          </div>
          <div className="rounded-2xl bg-muted/50 px-3 py-3">
            <div className="text-lg font-semibold">{stats.correct}</div>
            <div className="text-xs text-muted-foreground">正确</div>
          </div>
          <div className="rounded-2xl bg-muted/50 px-3 py-3">
            <div className="text-lg font-semibold">{stats.total === 0 ? "0%" : `${Math.round((stats.correct / stats.total) * 100)}%`}</div>
            <div className="text-xs text-muted-foreground">正确率</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">统计版本：{statsVersion}</div>
        <div className="mt-3 flex gap-3 text-sm">
          <Link href="/m/profile" className="rounded-full border px-4 py-2">返回个人中心</Link>
          <Link href="/m/stats" className="rounded-full border px-4 py-2">老师端统计页</Link>
        </div>
      </MobileCard>
    </div>
  );
}
