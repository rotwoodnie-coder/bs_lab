"use client";

import * as React from "react";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@bs-lab/ui";
import { AlertTriangle, RefreshCw, SendHorizonal } from "@bs-lab/ui/icons";
import { sonnerToast } from "@bs-lab/ui";

import { buildApiUrl } from "@/lib/core-api-shared";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function reportClientError(error: Error & { digest?: string }) {
  const payload = {
    digest: error.digest,
    message: error.message,
    url: typeof window !== "undefined" ? window.location.href : "",
  };
  return fetch(buildApiUrl("/v2/sys-log/client-error"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
}

export default function DashboardErrorPage({ error, reset }: ErrorPageProps) {
  const [reporting, setReporting] = React.useState(false);

  const handleReport = React.useCallback(async () => {
    setReporting(true);
    try {
      const res = await reportClientError(error);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      sonnerToast.success("已上报");
    } catch {
      sonnerToast.error("上报失败", { description: "请稍后重试" });
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
            当前页面加载时发生错误，请尝试刷新。若问题持续，可上报错误信息以便排查。
          </p>
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
            {reporting ? "上报中…" : "上报"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
