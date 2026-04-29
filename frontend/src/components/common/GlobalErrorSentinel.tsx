"use client";

import * as React from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";
import { buildApiUrl, buildCoreApiJsonHeaders, type CoreApiActor } from "@/lib/core-api-shared";
import { useAuth } from "@/hooks/use-auth";
import { installAutoNetworkErrorCapture } from "@/lib/v2/v2-feedback-api";

type IssueClass =
  | "RUNTIME_REFERENCE_ERROR"
  | "RUNTIME_TYPE_ERROR"
  | "HOOK_RULES_ERROR"
  | "NETWORK_ERROR"
  | "CORS_ERROR"
  | "BUILD_ERROR"
  | "UNKNOWN_ERROR";

type IssuePayload = {
  errorMessage: string;
  errorStack: string;
  componentStack: string;
  href: string;
  userAgent: string;
  sessionHash: string;
  source: "render" | "unhandledrejection" | "windowerror";
  issueClass: IssueClass;
};

function hashString(input: string): string {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return (`0000000${(h1 >>> 0).toString(16)}`).slice(-8);
}

function classifyIssue(message: string, stack: string, source: IssuePayload["source"]): IssueClass {
  const text = `${message}\n${stack}`;
  if (/access-control-allow-origin|cors|failed to fetch|net::err_failed/i.test(text)) return "CORS_ERROR";
  if (/invalid hook call|rendered fewer hooks than expected|change in the order of hooks|rules of hooks/i.test(text)) return "HOOK_RULES_ERROR";
  if (/referenceerror/i.test(text)) return "RUNTIME_REFERENCE_ERROR";
  if (/typeerror/i.test(text)) return "RUNTIME_TYPE_ERROR";
  if (source === "windowerror" || /build failure|next build|turbopack/i.test(text)) return "BUILD_ERROR";
  if (/networkerror/i.test(text)) return "NETWORK_ERROR";
  return "UNKNOWN_ERROR";
}

const sessionReportedHashSet = new Set<string>();
const sessionReportedClassSet = new Set<string>();

async function postIssue(actor: CoreApiActor | null, payload: IssuePayload): Promise<void> {
  const issueClass = classifyIssue(payload.errorMessage, payload.errorStack, payload.source);
  const title = `${issueClass}: ${payload.errorMessage.slice(0, 80) || payload.source}`;
  const env = {
    url: payload.href,
    ua: payload.userAgent,
    issueClass,
    componentStack: payload.componentStack,
  };
  try {
    const res = await fetch(buildApiUrl("/v2/feedback/auto-submit"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(actor ? buildCoreApiJsonHeaders(actor) : {}),
      },
      credentials: "include",
      body: JSON.stringify({
        ...payload,
        title,
        content: payload.errorStack || payload.errorMessage,
        env,
        issueClass,
      }),
    });
    if (!res.ok) {
      await fetch(buildApiUrl("/v2/sys/feedback"), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(actor ? buildCoreApiJsonHeaders(actor) : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          type: "BUG",
          title,
          content: JSON.stringify({ ...payload, issueClass }),
          env,
          issueFingerprint: payload.sessionHash,
        }),
      });
    }
  } catch {
    // 反馈失败不影响主流程
  }
}

class GlobalErrorBoundary extends React.Component<{ children: ReactNode; onIssue: (payload: IssuePayload) => void }, { hasError: boolean; error: Error | null; componentStack: string }> {
  state = { hasError: false, error: null as Error | null, componentStack: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, componentStack: "" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const payload: IssuePayload = {
      errorMessage: error.message,
      errorStack: error.stack ?? "",
      componentStack: info.componentStack ?? "",
      href: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      sessionHash: hashString(`${error.message}|${error.stack ?? ""}|${info.componentStack ?? ""}|${typeof window !== "undefined" ? window.location.href : ""}`),
      source: "render",
      issueClass: classifyIssue(error.message, error.stack ?? "", "render"),
    };
    this.props.onIssue(payload);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.12),_transparent_38%),linear-gradient(180deg,_#f8fffe_0%,_#f7fafc_100%)] px-4 py-10">
          <Card className="w-full max-w-xl border-border shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
            <CardHeader>
              <CardTitle className="text-2xl">服务暂时不可用</CardTitle>
              <CardDescription>
                页面发生异常，系统已记录错误并进入保护模式。你可以稍后重试。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                {this.state.error?.message || "未知错误"}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                  一键重试（Reload）
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

function PromiseRejectionSentinel({ onIssue }: { onIssue: (payload: IssuePayload) => void }) {
  React.useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason ?? "Unhandled promise rejection");
      const stack = reason instanceof Error ? (reason.stack ?? "") : "";
      const payload: IssuePayload = {
        errorMessage: message,
        errorStack: stack,
        componentStack: "unhandledrejection",
        href: window.location.href,
        userAgent: navigator.userAgent,
        sessionHash: hashString(`${message}|${stack}|${window.location.href}|unhandledrejection`),
        source: "unhandledrejection",
        issueClass: classifyIssue(message, stack, "unhandledrejection"),
      };
      onIssue(payload);
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, [onIssue]);

  return null;
}

export function GlobalErrorSentinel({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const actor = React.useMemo<CoreApiActor | null>(() => {
    if (!user?.userId) return null;
    return {
      role: user.role,
      userId: user.userId,
      userName: user.userName,
      orgId: user.orgId || "",
      orgName: user.orgName || undefined,
      tenantId: user.tenantId,
      appId: user.appId,
    };
  }, [user]);

  React.useEffect(() => {
    if (actor) installAutoNetworkErrorCapture(actor);
  }, [actor]);

  const onIssue = React.useCallback(async (payload: IssuePayload) => {
    if (sessionReportedHashSet.has(payload.sessionHash)) return;
    if (sessionReportedClassSet.has(payload.issueClass)) return;
    sessionReportedHashSet.add(payload.sessionHash);
    sessionReportedClassSet.add(payload.issueClass);
    await postIssue(actor, payload);
  }, [actor]);

  return (
    <>
      <PromiseRejectionSentinel onIssue={onIssue} />
      <GlobalErrorBoundary onIssue={onIssue}>{children}</GlobalErrorBoundary>
    </>
  );
}
