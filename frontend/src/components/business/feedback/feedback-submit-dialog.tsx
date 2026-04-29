"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  sonnerToast,
  RichHtmlEditor,
} from "@bs-lab/ui";
import { MessageSquarePlus } from "@bs-lab/ui/icons";
import { useSessionActor } from "@/hooks/use-session-actor";
import { createV2Feedback, uploadV2FeedbackImage, captureFeedbackEnv } from "@/lib/v2/v2-feedback-api";
import { FEEDBACK_TYPE_LABEL, type FeedbackType, type FeedbackEnv } from "@/types/feedback";

export type FeedbackSubmitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FeedbackSubmitDialog({ open, onOpenChange }: FeedbackSubmitDialogProps) {
  const { actor } = useSessionActor();

  const [type, setType] = React.useState<FeedbackType>("BUG");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [env, setEnv] = React.useState<FeedbackEnv | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // 每次打开弹窗时捕获环境信息
  React.useEffect(() => {
    if (open) {
      try {
        setEnv(captureFeedbackEnv());
      } catch {
        setEnv({ url: window.location.href, ua: navigator.userAgent, browser: "", resolution: "" });
      }
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      sonnerToast.error("请输入标题");
      return;
    }
    setSubmitting(true);
    try {
      await createV2Feedback(actor, {
        type,
        title: title.trim(),
        content: content || undefined,
        env: env ?? undefined,
      });
      sonnerToast.success("反馈已提交，感谢你的建议！");
      onOpenChange(false);
      // 重置表单
      setType("BUG");
      setTitle("");
      setContent("");
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadImage = React.useCallback(
    async (file: File) => {
      try {
        const result = await uploadV2FeedbackImage(actor, file);
        return { src: result.url };
      } catch (e) {
        sonnerToast.error("图片上传失败", {
          description: e instanceof Error ? e.message : "请重试",
        });
        return null;
      }
    },
    [actor],
  );

  const envSummary = React.useMemo(() => {
    if (!env) return "正在捕获环境信息…";
    const parts: string[] = [];
    if (env.browser) parts.push(env.browser);
    if (env.resolution) parts.push(env.resolution);
    if (env.url) parts.push(`URL: ${env.url}`);
    return parts.join(" / ");
  }, [env]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" showCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="size-5 text-primary" />
            <DialogTitle>反馈与建议</DialogTitle>
          </div>
          <DialogDescription>
            告诉我们遇到的问题或改进建议，我们将尽快跟进处理。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 类型 + 标题 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="shrink-0 space-y-1.5">
              <Label htmlFor="feedback-type">类型</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as FeedbackType)}
              >
                <SelectTrigger id="feedback-type" className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FEEDBACK_TYPE_LABEL) as FeedbackType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {FEEDBACK_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="feedback-title">标题</Label>
              <Input
                id="feedback-title"
                placeholder="一句话描述问题…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>

          {/* 富文本编辑器 — 复用项目已有的 Tiptap（RichHtmlEditor） */}
          <div className="space-y-1.5">
            <Label>详细描述</Label>
            <RichHtmlEditor
              value={content}
              onChange={setContent}
              onUploadImage={handleUploadImage}
              placeholder="详细描述你的问题或建议，支持直接粘贴截图（Ctrl+V）…"
              className="min-h-[240px]"
            />
          </div>

          {/* 环境信息 */}
          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium">已捕获环境信息：</span>
            {envSummary}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !title.trim()}>
            {submitting ? "提交中…" : "提交反馈"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
