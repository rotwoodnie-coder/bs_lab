"use client";

import * as React from "react";
import { Badge, Button, Input, Spinner } from "@bs-lab/ui";
import { CircleAlert, Info, Sparkles } from "@bs-lab/ui/icons";
import { useSessionActor } from "@/hooks/use-session-actor";
import { fetchV2FeedbackList } from "@/lib/v2/v2-feedback-api";
import { type FeedbackItem, type FeedbackStatus, FEEDBACK_STATUS_LABEL, FEEDBACK_TYPE_LABEL } from "@/types/feedback";

function statusMeta(status: FeedbackStatus) {
  switch (status) {
    case "AUTO_TRIAGED":
      return { label: "AI 分诊中", className: "border-purple-500/30 bg-purple-500/10 text-purple-700" };
    case "DOING":
      return { label: FEEDBACK_STATUS_LABEL.DOING, className: "border-amber-500/30 bg-amber-500/10 text-amber-700" };
    case "DONE":
      return { label: FEEDBACK_STATUS_LABEL.DONE, className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" };
    case "REJECT":
      return { label: FEEDBACK_STATUS_LABEL.REJECT, className: "border-red-500/30 bg-red-500/10 text-red-700" };
    default:
      return { label: FEEDBACK_STATUS_LABEL.TODO, className: "border-slate-500/30 bg-slate-500/10 text-slate-700" };
  }
}

export function FeedbackList() {
  const { actor } = useSessionActor();
  const [items, setItems] = React.useState<FeedbackItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [keyword, setKeyword] = React.useState("");
  const [detail, setDetail] = React.useState<FeedbackItem | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchV2FeedbackList(actor, { keyword, page: 1, pageSize: 50 });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [actor, keyword]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索反馈标题/内容" />
        <Button onClick={() => void reload()}>搜索</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Spinner /></div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const meta = statusMeta(item.status);
            return (
              <div key={item.feedbackId} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      <Badge variant="outline">{FEEDBACK_TYPE_LABEL[item.type]}</Badge>
                      <Badge className={meta.className}>{meta.label}</Badge>
                      {item.status === "AUTO_TRIAGED" ? (
                        <button
                          type="button"
                          className="inline-flex items-center text-purple-600 hover:text-purple-700"
                          onClick={() => setDetail(item)}
                          title="查看指纹与修复建议"
                        >
                          <Sparkles className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.env?.pathname ?? item.env?.url ?? "-"}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setDetail(item)}>详情</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detail ? (
        <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50 p-4 text-sm">
          <div className="flex items-center gap-2 font-medium text-purple-800">
            <Info className="size-4" />
            AI 分诊中详情
          </div>
          <div className="mt-2 space-y-1 text-purple-700">
            <p>issue_fingerprint: {detail.env?.error_stack_brief ?? detail.feedbackId}</p>
            <p>修复建议：优先检查当前页面路由与异常堆栈，确认是否与系统告警同源。</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
