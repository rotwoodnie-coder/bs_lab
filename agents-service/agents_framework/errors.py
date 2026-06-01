"""
agents_framework.errors — 标准错误模型

将异常分为三类：
- SAFETY：安全拦截，非重试
- LLM：LLM 调用失败，按状态码决定是否重试
- TOOL：工具调用失败，按场景决定是否重试
"""

from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger("agents_framework.errors")


class AgentError(Exception):
    """Agent 异常的基类。"""

    def __init__(
        self,
        code: str,
        message: str,
        retryable: bool = False,
        source: str = "SYSTEM",
        trace_id: str = "",
        context: Optional[dict] = None,
    ):
        self.code = code
        self.retryable = retryable
        self.source = source
        self.trace_id = trace_id
        self.context = context or {}
        super().__init__(f"[{code}] {message}")


class SafetyViolation(AgentError):
    """安全拦截（前置过滤）。"""

    def __init__(self, hit_keywords: list[str], trace_id: str = ""):
        super().__init__(
            code="SAFETY_HIT",
            message=f"安全拦截，命中关键词: {', '.join(hit_keywords)}",
            retryable=False,
            source="BUSINESS",
            trace_id=trace_id,
            context={"hit_keywords": hit_keywords},
        )


class LlmNotConfigured(AgentError):
    def __init__(self, trace_id: str = ""):
        super().__init__(
            code="LLM_NOT_CONFIGURED",
            message="LLM API 密钥未配置",
            retryable=False,
            source="SYSTEM",
            trace_id=trace_id,
        )


class LlmTimeoutError(AgentError):
    def __init__(self, timeout_ms: int, trace_id: str = ""):
        super().__init__(
            code="LLM_TIMEOUT",
            message=f"LLM 请求超时 ({timeout_ms}ms)",
            retryable=True,
            source="SYSTEM",
            trace_id=trace_id,
        )


class LlmApiError(AgentError):
    def __init__(self, status_code: int, body: str, trace_id: str = ""):
        retryable = status_code >= 500 or status_code == 429
        super().__init__(
            code=f"LLM_HTTP_{status_code}",
            message=f"LLM API 返回错误 ({status_code}): {body[:200]}",
            retryable=retryable,
            source="SYSTEM",
            trace_id=trace_id,
        )


class LlmEmptyResponse(AgentError):
    def __init__(self, trace_id: str = ""):
        super().__init__(
            code="LLM_EMPTY_RESPONSE",
            message="LLM 返回了空结果",
            retryable=False,
            source="SYSTEM",
            trace_id=trace_id,
        )


class ToolExecutionError(AgentError):
    def __init__(self, tool_name: str, message: str, retryable: bool = True, trace_id: str = ""):
        super().__init__(
            code=f"TOOL_{tool_name.upper()}_FAILED",
            message=message,
            retryable=retryable,
            source="SYSTEM",
            trace_id=trace_id,
        )


def classify_error(e: Exception, trace_id: str = "") -> AgentError:
    """将任意异常分类为 AgentError。"""
    if isinstance(e, AgentError):
        if e.trace_id:
            return e
        e.trace_id = trace_id
        return e

    # 尝试提取 OpenAI 错误
    if hasattr(e, "status_code"):
        status = getattr(e, "status_code", 500)
        return LlmApiError(status, str(e), trace_id)

    # 超时错误
    if isinstance(e, TimeoutError):
        return LlmTimeoutError(60_000, trace_id)

    # 默认网络错误
    return AgentError(
        code="NETWORK_ERROR",
        message=f"网络请求失败: {str(e)[:300]}",
        retryable=True,
        source="SYSTEM",
        trace_id=trace_id,
    )
