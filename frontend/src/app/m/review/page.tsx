"use client";

import { useMemo, useState } from "react";
import { MobileCard } from "@/components/mobile/MobileCard";

const RATINGS = ["优秀", "良好", "合格", "不合格"] as const;

type Submission = {
  id: string;
  studentName: string;
  title: string;
  submittedAt: string;
  rating: (typeof RATINGS)[number];
  comment: string;
};

const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: "stu_001",
    studentName: "王小明",
    title: "风向标实验视频",
    submittedAt: "2026-05-01 18:20",
    rating: "良好",
    comment: "",
  },
  {
    id: "stu_002",
    studentName: "李小红",
    title: "彩虹投影观察记录",
    submittedAt: "2026-05-01 19:05",
    rating: "合格",
    comment: "",
  },
  {
    id: "stu_003",
    studentName: "张小华",
    title: "串联电路作品",
    submittedAt: "2026-05-02 08:10",
    rating: "优秀",
    comment: "",
  },
];

export default function ReviewPage() {
  const [submissions, setSubmissions] = useState(INITIAL_SUBMISSIONS);
  const [message, setMessage] = useState("");

  const pendingCount = useMemo(() => submissions.length, [submissions.length]);

  const updateSubmission = (id: string, patch: Partial<Submission>) => {
    setSubmissions((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleSubmit = (id: string) => {
    setSubmissions((prev) => prev.map((item) => (item.id === id ? { ...item } : item)));
    setMessage("已更新本地批阅结果");
  };

  return (
    <div className="space-y-4 p-4 md:pb-4">
      <MobileCard title="审核 / 批阅" subtitle={`待批阅作品 ${pendingCount} 个`}>
        <div className="space-y-3 text-sm">
          {submissions.map((item) => (
            <div key={item.id} className="rounded-3xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{item.studentName}</div>
                  <div className="text-xs text-muted-foreground">{item.title}</div>
                </div>
                <div className="text-xs text-muted-foreground">提交时间：{item.submittedAt}</div>
              </div>

              <div className="mt-4 grid gap-4">
                <div>
                  <div className="mb-2 font-medium">评级</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {RATINGS.map((rating) => {
                      const active = item.rating === rating;
                      return (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => updateSubmission(item.id, { rating })}
                          className={[
                            "rounded-2xl border px-3 py-2 text-xs font-medium transition",
                            active ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/40",
                          ].join(" ")}
                        >
                          {rating}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-medium" htmlFor={`comment-${item.id}`}>
                    评语
                  </label>
                  <textarea
                    id={`comment-${item.id}`}
                    value={item.comment}
                    onChange={(e) => updateSubmission(item.id, { comment: e.target.value })}
                    rows={3}
                    placeholder="输入批阅意见"
                    className="w-full rounded-2xl border bg-background px-4 py-3"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSubmit(item.id)}
                  className="rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground"
                >
                  提交批阅
                </button>
              </div>
            </div>
          ))}

          {message ? <div className="text-center text-sm font-medium text-emerald-600">{message}</div> : null}
        </div>
      </MobileCard>
    </div>
  );
}
