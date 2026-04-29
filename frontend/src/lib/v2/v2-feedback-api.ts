/**
 * V2 用户反馈 API 客户端
 * 对接后端 /v2/sys/feedback
 */
import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";
import type { FeedbackItem, FeedbackListQuery, FeedbackListResult, CreateFeedbackInput, GovernanceStats, UpdateFeedbackInput } from "@/types/feedback";

async function v2Get<T>(path: string, actor: CoreApiActor, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(buildApiUrl(path));
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), { headers: buildCoreApiReadHeaders(actor), credentials: "include" });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Post<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Put<T>(path: string, actor: CoreApiActor, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "PUT",
    headers: buildCoreApiJsonHeaders(actor),
    body: JSON.stringify(body),
    credentials: "include",
  });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

async function v2Delete<T>(path: string, actor: CoreApiActor): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "DELETE",
    headers: buildCoreApiReadHeaders(actor),
    credentials: "include",
  });
  const json = await res.json() as { success: boolean; data: T; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "请求失败");
  return json.data;
}

function generateClientFingerprint(input: { title?: string; content?: string; errorStack?: string; pathname?: string; errorType?: string }): string {
  const raw = [input.title ?? "", input.content ?? "", input.pathname ?? window.location.pathname, input.errorStack ?? "", input.errorType ?? ""].join("|");
  let h1 = 0x811c9dc5;
  for (let i = 0; i < raw.length; i += 1) {
    h1 ^= raw.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return (`0000000${(h1 >>> 0).toString(16)}`).slice(-8);
}

function briefStack(stack?: string): string {
  return (stack ?? "").split('\n').slice(0, 3).join('\n');
}

function buildAutoErrorFeedback(input: {
  title: string;
  content: string;
  errorType: string;
  errorStack?: string;
}): CreateFeedbackInput {
  const errorStack = briefStack(input.errorStack ?? new Error().stack ?? '');
  const autoFeedback = {
    type: "BUG",
    title: input.title,
    content: input.content,
    env: {
      url: window.location.href,
      pathname: window.location.pathname,
      ua: navigator.userAgent,
      browser: (() => {
        const ua = navigator.userAgent;
        const chrome = /Chrome\/(\S+)/.exec(ua);
        if (chrome) return `Chrome ${chrome[1]}`;
        const firefox = /Firefox\/(\S+)/.exec(ua);
        if (firefox) return `Firefox ${firefox[1]}`;
        const safari = /Version\/(\S+).*Safari/.exec(ua);
        if (safari) return `Safari ${safari[1]}`;
        return ua;
      })(),
      resolution: `${window.innerWidth}×${window.innerHeight}`,
      errorStack,
      error_stack_brief: errorStack,
    },
  } as CreateFeedbackInput & { issueFingerprint: string };
  autoFeedback.issueFingerprint = generateClientFingerprint({
    title: input.title,
    content: input.content,
    errorStack,
    pathname: window.location.pathname,
    errorType: input.errorType,
  });
  return autoFeedback;
}

/** 提交反馈（登录即可） */
export function createV2Feedback(actor: CoreApiActor, input: CreateFeedbackInput): Promise<FeedbackItem> {
  const errorStack = briefStack(new Error().stack ?? '');
  const enriched = {
    ...input,
    env: {
      ...(input.env ?? {}),
      url: window.location.href,
      pathname: window.location.pathname,
      errorStack,
      error_stack_brief: errorStack,
    },
    issueFingerprint: generateClientFingerprint({ title: input.title, content: input.content, errorStack, pathname: window.location.pathname, errorType: input.type }),
  } as CreateFeedbackInput & { issueFingerprint: string };
  return v2Post("/v2/sys/feedback", actor, enriched);
}

/** 自动捕获网络/CORS 错误并上报为反馈 */
export function reportNetworkErrorAsFeedback(actor: CoreApiActor, err: unknown, context?: { url?: string; method?: string }): Promise<FeedbackItem | null> {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack ?? '' : '';
  const title = /cors|access-control-allow-origin|failed to fetch|net::err_failed/i.test(message)
    ? `网络/CORS 错误：${window.location.pathname}`
    : `网络请求失败：${window.location.pathname}`;
  const content = [
    `<p><strong>页面：</strong>${window.location.pathname}</p>`,
    `<p><strong>请求：</strong>${context?.method ?? 'UNKNOWN'} ${context?.url ?? 'UNKNOWN'}</p>`,
    `<p><strong>错误：</strong>${message}</p>`,
    stack ? `<pre>${stack}</pre>` : '',
  ].join('');
  const autoFeedback = buildAutoErrorFeedback({
    title,
    content,
    errorType: message,
    errorStack: stack,
  });
  return v2Post("/v2/sys/feedback", actor, autoFeedback).catch(() => null);
}

/** 安装全局网络错误捕获（避免重复安装） */
export function installAutoNetworkErrorCapture(actor: CoreApiActor): () => void {
  if (typeof window === 'undefined') return () => {};
  const state = window as Window & { __bsLabAutoErrorCaptureInstalled__?: boolean; __bsLabAutoErrorFetchPatched__?: boolean; __bsLabOriginalFetch__?: typeof window.fetch };
  if (state.__bsLabAutoErrorCaptureInstalled__) return () => {};
  state.__bsLabAutoErrorCaptureInstalled__ = true;

  if (!state.__bsLabOriginalFetch__) {
    state.__bsLabOriginalFetch__ = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
      const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
      try {
        return await state.__bsLabOriginalFetch__!(input as Parameters<typeof window.fetch>[0], init);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/cors|access-control-allow-origin|failed to fetch|net::err_failed/i.test(message)) {
          void reportNetworkErrorAsFeedback(actor, error, { url, method });
        }
        throw error;
      }
    };
    state.__bsLabAutoErrorFetchPatched__ = true;
  }

  const onError = (event: ErrorEvent) => {
    const message = event.message || '';
    if (!/cors|access-control-allow-origin|failed to fetch|net::err_failed/i.test(message)) return;
    void reportNetworkErrorAsFeedback(actor, event.error ?? new Error(message), { url: window.location.href, method: 'GET' });
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason ?? '');
    if (!/cors|access-control-allow-origin|failed to fetch|net::err_failed/i.test(message)) return;
    void reportNetworkErrorAsFeedback(actor, reason, { url: window.location.href, method: 'GET' });
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
    state.__bsLabAutoErrorCaptureInstalled__ = false;
  };
}

/** 查询反馈列表（需管理权限） */
export function fetchV2FeedbackList(actor: CoreApiActor, query: FeedbackListQuery = {}): Promise<FeedbackListResult> {
  return v2Get("/v2/sys/feedback", actor, query as Record<string, string | number | undefined>);
}

/** 查询单条反馈详情（需管理权限） */
export function fetchV2FeedbackById(actor: CoreApiActor, feedbackId: string): Promise<FeedbackItem> {
  return v2Get(`/v2/sys/feedback/${encodeURIComponent(feedbackId)}`, actor);
}

/** 查询治理统计（需管理权限） */
export function fetchV2FeedbackGovernanceStats(actor: CoreApiActor): Promise<GovernanceStats> {
  return v2Get("/v2/sys/feedback/stats", actor);
}

/** 更新反馈（回复/流转状态，需管理权限） */
export function updateV2Feedback(actor: CoreApiActor, feedbackId: string, input: UpdateFeedbackInput): Promise<FeedbackItem> {
  return v2Put(`/v2/sys/feedback/${encodeURIComponent(feedbackId)}`, actor, input);
}

/** 删除反馈（软删，需管理权限） */
export function deleteV2Feedback(actor: CoreApiActor, feedbackId: string): Promise<{ deleted: boolean }> {
  return v2Delete(`/v2/sys/feedback/${encodeURIComponent(feedbackId)}`, actor);
}

/** 上传反馈图片到隔离存储桶 */
export async function uploadV2FeedbackImage(
  actor: CoreApiActor,
  file: File,
): Promise<{ url: string; storageKey: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(buildApiUrl("/v2/sys/feedback/upload-image"), {
    method: "POST",
    headers: {
      "x-role": buildCoreApiJsonHeaders(actor)["x-role"],
      "x-user-id": actor.userId,
      "x-user-name": buildCoreApiJsonHeaders(actor)["x-user-name"],
      "x-org-id": actor.orgId,
    },
    body: formData,
    credentials: "include",
  });
  const json = await res.json() as { success: boolean; data: { url: string; storageKey: string }; error: { message: string } | null };
  if (!json.success) throw new Error(json.error?.message ?? "上传失败");
  return json.data;
}

/** 捕获当前环境信息 */
export function captureFeedbackEnv(): { url: string; ua: string; browser: string; resolution: string } {
  return {
    url: window.location.href,
    ua: navigator.userAgent,
    browser: (() => {
      const ua = navigator.userAgent;
      const chrome = /Chrome\/(\S+)/.exec(ua);
      if (chrome) return `Chrome ${chrome[1]}`;
      const firefox = /Firefox\/(\S+)/.exec(ua);
      if (firefox) return `Firefox ${firefox[1]}`;
      const safari = /Version\/(\S+).*Safari/.exec(ua);
      if (safari) return `Safari ${safari[1]}`;
      return ua;
    })(),
    resolution: `${window.innerWidth}\u00d7${window.innerHeight}`,
  };
}
