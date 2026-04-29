"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Spinner,
  RichHtmlEditor,
  sonnerToast,
} from "@bs-lab/ui";
import { Calendar, Globe, Monitor, User, Building2 } from "@bs-lab/ui/icons";
import { useSessionActor } from "@/hooks/use-session-actor";
import {
  fetchV2FeedbackById,
  updateV2Feedback,
} from "@/lib/v2/v2-feedback-api";
import {
  type FeedbackItem,
  type FeedbackStatus,
  FEEDBACK_TYPE_LABEL,
  FEEDBACK_TYPE_BADGE_VARIANT,
  FEEDBACK_STATUS_LABEL,
  FEEDBACK_STATUS_BADGE_VARIANT,
} from "@/types/feedback";

export type FeedbackDetailSheetProps = {
  feedbackId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
};

function formatTime(t: string | null | undefined): string {
  if (!t) return "-";
  try {
    const d = new Date(t);
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return t;
  }
}

export function FeedbackDetailSheet({ feedbackId, open, onOpenChange, onUpdated }: FeedbackDetailSheetProps) {
  const { actor } = useSessionActor();

  const [loading, setLoading] = React.useState(false);
  const [item, setItem] = React.useState<FeedbackItem | null>(null);
  const [status, setStatus] = React.useState<FeedbackStatus>("TODO");
  const [reply, setReply] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // 加载详情
  React.useEffect(() => {
    if (!open || !feedbackId) return;
    let cancelled = false;
    setLoading(true);
    fetchV2FeedbackById(actor, feedbackId)
      .then((data) => {
        if (cancelled) return;
        setItem(data);
        setStatus(data.status);
        setReply(data.reply ?? "");
      })
      .catch((e) => {
        if (cancelled) return;
        sonnerToast.error("加载反馈详情失败", {
          description: e instanceof Error ? e.message : "未知错误",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, feedbackId, actor]);

  // 关闭时重置
  React.useEffect(() => {
    if (!open) {
      setItem(null);
      setStatus("TODO");
      setReply("");
    }
  }, [open]);

  const handleSave = async () => {
    if (!feedbackId) return;
    setSaving(true);
    try {
      await updateV2Feedback(actor, feedbackId, { status, reply: reply || undefined });
      sonnerToast.success("已更新反馈状态");
      onUpdated();
      onOpenChange(false);
    } catch (e) {
      sonnerToast.error("更新失败", {
        description: e instanceof Error ? e.message : "未知错误",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[min(100vw,42rem)] flex-col sm:max-w-2xl">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : !item ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            未找到反馈
          </div>
        ) : (
          <>
            <SheetHeader className="border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Badge variant={FEEDBACK_TYPE_BADGE_VARIANT[item.type]}>
                  {FEEDBACK_TYPE_LABEL[item.type]}
                </Badge>
                <Badge variant={FEEDBACK_STATUS_BADGE_VARIANT[item.status]}>
                  {FEEDBACK_STATUS_LABEL[item.status]}
                </Badge>
              </div>
              <SheetTitle className="mt-2 text-lg">{item.title}</SheetTitle>
              <SheetDescription>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3.5" />
                    {item.reporter?.name ?? "未知用户"}
                  </span>
                  {item.reporter?.orgName ? (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="size-3.5" />
                      {item.reporter.orgName}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {formatTime(item.createTime)}
                  </span>
                </div>
              </SheetDescription>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-1">
              {/* 环境信息 */}
              {item.env ? (
                <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <div className="mb-1 flex items-center gap-1 font-medium text-foreground">
                    <Monitor className="size-3.5" />
                    环境信息
                  </div>
                  <div className="space-y-0.5">
                    {item.env.browser ? (
                      <p className="inline-flex items-center gap-1">
                        <Globe className="size-3" />
                        {item.env.browser}
                        {item.env.resolution ? ` · ${item.env.resolution}` : null}
                      </p>
                    ) : null}
                    {item.env.url ? (
                      <p className="truncate text-muted-foreground/70">URL: {item.env.url}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* 老师们描述 */}
              <div>
                <Label className="mb-1 block text-sm font-medium">反馈描述</Label>
                {item.content ? (
                  <div
                    className="prose prose-sm max-w-none rounded-md border border-border bg-card px-3 py-2 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">（无详细描述）</p>
                )}
              </div>

              <Separator />

              {/* 运维操作区 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">运维处理</Label>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">状态流转</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as FeedbackStatus)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">{FEEDBACK_STATUS_LABEL.TODO}</SelectItem>
                      <SelectItem value="DOING">{FEEDBACK_STATUS_LABEL.DOING}</SelectItem>
                      <SelectItem value="AUTO_TRIAGED">AI 分诊中</SelectItem>
                      <SelectItem value="DONE">{FEEDBACK_STATUS_LABEL.DONE}</SelectItem>
                      <SelectItem value="REJECT">{FEEDBACK_STATUS_LABEL.REJECT}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">修复笔记 / 回复</Label>
                  <RichHtmlEditor
                    value={reply}
                    onChange={setReply}
                    onUploadImage={async (file) => {
                      // 管理后台暂不开放图片上传，可后续扩展
                      sonnerToast.error("管理后台暂不支持图片上传");
                      return null;
                    }}
                    placeholder="说明是如何修复的，或拒绝的理由…"
                    className="min-h-[160px]"
                  />
                </div>

                {/* 已有回复 */}
                {item.reply && status === item.status && (
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground">历史回复</Label>
                    <div
                      className="prose prose-sm max-w-none rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                      dangerouslySetInnerHTML={{ __html: item.reply }}
                    />
                    {item.replyTime ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        回复于 {formatTime(item.replyTime)}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border pt-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "保存中…" : "保存"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
