import { buildApiUrl, buildCoreApiJsonHeaders, buildCoreApiReadHeaders, type CoreApiActor } from "@/lib/core-api-shared";

const FEEDBACK_THROTTLE_MS = 60_000;
const feedbackThrottleMap = new Map<string, number>();
let feedbackSubmitInFlight: Promise<void> | null = null;

export type V2ApiError = {
  code?: number;
  message?: string;
  [key: string]: unknown;
};

export type V2ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  message: string | null;
  error: V2ApiError | null;
};

export type V2ApiListPage<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export class V2ApiServiceError extends Error {
  code?: number;
  payload?: V2ApiError | null;
  /** HTTP 状态码（如 404），与业务 `code` 区分 */
  httpStatus?: number;

  constructor(message: string, code?: number, payload?: V2ApiError | null, httpStatus?: number) {
    super(message);
    this.name = "V2ApiServiceError";
    this.code = code;
    this.payload = payload ?? null;
    this.httpStatus = httpStatus;
  }

  static isApiError(error: unknown): error is V2ApiServiceError {
    return error instanceof V2ApiServiceError;
  }

  static getBusinessMessage(error: unknown): string {
    if (error instanceof V2ApiServiceError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "请求失败";
  }

  static getBusinessCode(error: unknown): number | undefined {
    return error instanceof V2ApiServiceError ? error.code : undefined;
  }

  static getHttpStatus(error: unknown): number | undefined {
    return error instanceof V2ApiServiceError ? error.httpStatus : undefined;
  }
}

export type V2ApiRequestInit = {
  actor: CoreApiActor;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  signal?: AbortSignal;
};

async function submitFailureFeedbackOnce(payload: {
  url: string;
  status: number;
  role: string;
  context: string;
}): Promise<void> {
  if (typeof window === "undefined") return;
  const key = `${payload.role}|${payload.status}|${payload.context}|${payload.url}`;
  const now = Date.now();
  const last = feedbackThrottleMap.get(key) ?? 0;
  if (now - last < FEEDBACK_THROTTLE_MS) return;
  if (feedbackSubmitInFlight) return;

  feedbackThrottleMap.set(key, now);
  feedbackSubmitInFlight = (async () => {
    try {
      await fetch(buildApiUrl("/v2/sys/feedback"), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-role": roleToHeader(payload.role as CoreApiActor["role"]),
          "x-user-id": "",
          "x-user-name": encodeURIComponent("api-service"),
          "x-org-id": "",
          "x-org-name": "",
          "x-subject-key": getMediaSubjectKey(),
        },
        credentials: "include",
        body: JSON.stringify({
          type: "BUG",
          title: `API failure ${payload.status}`,
          content: JSON.stringify({
            url: payload.url,
            status: payload.status,
            role: payload.role,
            context: payload.context,
          }),
          env: {
            url: payload.url,
            browser: typeof navigator !== "undefined" ? navigator.userAgent : "",
          },
        }),
      });
    } catch {
      // 反馈失败不影响主流程
    } finally {
      feedbackSubmitInFlight = null;
    }
  })();
  await feedbackSubmitInFlight;
}

export class V2ApiService {
  constructor(private readonly actor: CoreApiActor) {}

  static normalizePage<T>(data: unknown): V2ApiListPage<T> {
    const page = data as Partial<V2ApiListPage<T>> & { data?: Partial<V2ApiListPage<T>> };
    const source = (page && Array.isArray((page as V2ApiListPage<T>).items)) ? page : (page.data ?? page);
    return {
      items: Array.isArray(source.items) ? source.items : [],
      total: typeof source.total === "number" ? source.total : 0,
      page: typeof source.page === "number" ? source.page : 1,
      pageSize: typeof source.pageSize === "number" ? source.pageSize : (Array.isArray(source.items) ? source.items.length : 0),
    };
  }

  private buildUrl(path: string, query?: V2ApiRequestInit["query"]): string {
    const url = new URL(buildApiUrl(path));
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    init: Omit<V2ApiRequestInit, "actor"> = {},
  ): Promise<T> {
    const isRead = method === "GET";
    const url = this.buildUrl(path, init.query);
    const response = await fetch(url, {
      method,
      headers: isRead ? buildCoreApiReadHeaders(this.actor) : buildCoreApiJsonHeaders(this.actor),
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "include",
      signal: init.signal,
    });

    if (response.status === 401 && typeof window !== "undefined") {
      void submitFailureFeedbackOnce({ url, status: 401, role: this.actor.role, context: "Silent refresh failed" });
      window.location.href = "/login";
      throw new V2ApiServiceError("会话已过期，请重新登录", undefined, null, 401);
    }

    let payload: V2ApiEnvelope<T> | null = null;
    try {
      payload = (await response.json()) as V2ApiEnvelope<T>;
    } catch {
      void submitFailureFeedbackOnce({ url, status: response.status, role: this.actor.role, context: "Failed to parse response" });
      throw new V2ApiServiceError(`HTTP ${response.status}: 无法解析响应`, undefined, null, response.status);
    }

    if (!payload?.success) {
      void submitFailureFeedbackOnce({
        url,
        status: response.status,
        role: this.actor.role,
        context: `Request failed${response.status === 401 ? " after retry" : ""}`,
      });
      throw new V2ApiServiceError(
        payload?.error?.message ?? payload?.message ?? `请求失败 (${response.status})`,
        payload?.error?.code,
        payload?.error ?? null,
        response.status,
      );
    }

    return payload.data as T;
  }

  get<T>(path: string, query?: V2ApiRequestInit["query"], signal?: AbortSignal): Promise<T> {
    return this.request<T>("GET", path, { query, signal });
  }

  post<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>("POST", path, { body, signal });
  }

  put<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>("PUT", path, { body, signal });
  }

  patch<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>("PATCH", path, { body, signal });
  }

  delete<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>("DELETE", path, { body, signal });
  }
}

export function createV2ApiService(actor: CoreApiActor): V2ApiService {
  return new V2ApiService(actor);
}
