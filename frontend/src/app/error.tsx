"use client";

import * as React from "react";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@bs-lab/ui";
import { AlertTriangle, RefreshCw, SendHorizonal } from "@bs-lab/ui/icons";
import { sonnerToast } from "@bs-lab/ui";

import { buildApiUrl } from "@/lib/core-api-shared";
import { captureFeedbackEnv } from "@/lib/v2/v2-feedback-api";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

async function reportToFeedback(error: Error & { digest?: string }) {
  const env = captureFeedbackEnv();
  const payload = {
    type: "BUG",
    title: `客户端异常${error.digest ? ` [${error.digest}]` : ""}`,
    content: [
      `## 错误信息`,
      ``,
      `**Message:** ${error.message}`,
      `**Digest:** ${error.digest ?? "N/A"}`,
      `**Stack:**`,
      "```",
      error.stack ?? "(no stack)",
      "```",
    ].join("\n"),
    env,
  };

  const res = await fetch(buildApiUrl("/v2/sys/feedback"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  const json = (await res.json()) as { success: boolean; data: unknown; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  return json.data;
}

export default function RootErrorPage({ error, reset }: ErrorPageProps) {
  const [reporting, setReporting] = React.useState(false);

  const handleReport = React.useCallback(async () => {
    setReporting(true);
    try {
      await reportToFeedback(error);
      sonnerToast.success("已上报", { description: "感谢您的反馈，我们会尽快排查。" });
    } catch (e) {
      sonnerToast.error("上报失败", {
        description: e instanceof Error ? e.message : "请稍后重试",
      });
    } finally {
      setReporting(false);
    }
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[2000px] items-center justify-center px-4">
      <Card className="w-full max-w-lg border-border shadow-none">
        <CardHeader className="items-center gap-4 pb-0 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">页面加载异常</CardTitle>
          <p className="text-muted-foreground text-sm">
            当前页面加载时发生错误，请尝试刷新。若问题持续，可一键上报，技术团队会尽快排查。
          </p>
          {error.digest ? (
            <p className="text-muted-foreground/60 mt-1 max-w-full truncate text-xs" title={error.digest}>
              错误指纹：{error.digest}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="mt-6 flex flex-col items-center gap-3">
          <Button
            variant="default"
            size="sm"
            className="w-full gap-2 rounded-lg"
            onClick={reset}
          >
            <RefreshCw className="size-4" />
            重试
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 rounded-lg"
            disabled={reporting}
            onClick={handleReport}
          >
            <SendHorizonal className="size-4" />
            {reporting ? "上报中…" : "一键上报"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
