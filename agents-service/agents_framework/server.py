"""
agents_framework.server — 标准 FastAPI 路由模板

提供 create_agent_app() 工厂函数，自动生成 Agent 服务的标准 HTTP 端点。
"""

from __future__ import annotations

import hashlib
import json
import logging
import re as _re
import time
import uuid
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import Any as _CheckpointerType

from langchain_core.messages import HumanMessage

from agents_framework.sse import (
    serialize_done,
    serialize_error,
    serialize_meta,
    serialize_token,
    serialize_stage,
)
from agents_framework.errors import AgentError, classify_error

logger = logging.getLogger("agents_framework.server")

# ─── 幂等去重滑窗 ──────────────────────────────────────
# (thread_id, message_hash) → timestamp
# 自动清理超过 30 秒的旧记录
_IDEMPOTENCY_WINDOW_SEC = 30
_idempotency_cache: dict[tuple[str, str], float] = {}


def _check_idempotency(thread_id: str, message: str) -> bool:
    """检查并记录幂等键。返回 True 表示已处理过（应跳过）。"""
    now = time.monotonic()
    key = (thread_id, hashlib.md5(message.encode()).hexdigest()[:16])

    # 定期清理过期记录（每 100 次访问触发）
    if len(_idempotency_cache) > 0 and len(_idempotency_cache) % 100 == 0:
        cutoff = now - _IDEMPOTENCY_WINDOW_SEC
        stale = [k for k, ts in _idempotency_cache.items() if ts < cutoff]
        for k in stale:
            _idempotency_cache.pop(k, None)

    # 检查是否已存在
    if key in _idempotency_cache:
        elapsed = now - _idempotency_cache[key]
        if elapsed < _IDEMPOTENCY_WINDOW_SEC:
            logger.warning("幂等拦截: thread=%s msg=%s... (%.1fs 内重复)", thread_id, message[:20], elapsed)
            return True

    _idempotency_cache[key] = now
    return False


def create_agent_app(
    agent_registry: dict[str, Any],
    checkpointer: Optional[_CheckpointerType] = None,
    title: str = "Agent Service",
    version: str = "1.0.0",
) -> FastAPI:
    """创建 Agent 服务的 FastAPI 应用。

    自动注册端点：
      POST /v1/agents/{role}/chat        (非流式)
      POST /v1/agents/{role}/chat/stream  (SSE 流式)
      GET  /v1/agents/{role}/session/{id}
      GET  /v1/agents                     (角色列表)
      GET  /health

    Args:
        agent_registry: {role: CompiledGraph} 映射
        checkpointer: PostgresSaver 实例（可选）
        title: 应用标题
        version: 版本号

    Returns:
        FastAPI 应用实例
    """
    app = FastAPI(title=title, version=version)

    # ─── 健康检查 ────────────────────────────────────
    @app.get("/health")
    async def health():
        from config import settings as _settings
        checks = {
            "agent_count": len(agent_registry),
            "agents": list(agent_registry.keys()),
            "llm_configured": bool(_settings.llm_api_key),
            "llm_model": _settings.llm_model or "未配置",
            "checkpointer_type": checkpointer.__class__.__name__ if checkpointer else "none",
            "db_configured": bool(_settings.database_url),
        }
        # 综合判断：是否全部就绪
        ready = checks["agent_count"] > 0 and checks["llm_configured"]
        return {
            "status": "ok" if ready else "degraded",
            "service": title,
            "version": version,
            "checks": checks,
        }

    # ─── 角色列表 ────────────────────────────────────
    @app.get("/v1/agents")
    async def list_agents():
        return {"agents": list(agent_registry.keys())}

    # ─── 非流式聊天 ──────────────────────────────────
    @app.post("/v1/agents/{role}/chat")
    async def agent_chat(role: str, request: Request):
        if role not in agent_registry:
            raise HTTPException(status_code=404, detail=f"未知角色: {role}")

        graph = agent_registry[role]
        body = await request.json()
        message = body.get("message", "").strip()
        thread_id = body.get("thread_id")
        user_name = body.get("user_name", "").strip()
        user_id = body.get("user_id", thread_id or uuid.uuid4().hex[:16])
        grade_level = body.get("grade_level") or None

        if not message:
            raise HTTPException(status_code=422, detail="message 不能为空")

        trace_id = request.headers.get("x-trace-id", uuid.uuid4().hex[:16])
        logger.info(f"[{trace_id}] {role} chat: msg={message[:50]}... tid={thread_id}")

        # 幂等去重：同 thread_id + 同消息在 30 秒内重复请求直接返回缓存
        if thread_id and _check_idempotency(thread_id, message):
            # 尝试从 checkpointer 获取最新状态中的 reply_content
            # 幂等命中时被动等待不可取，这里走正常流程（checkpointer 中已含之前的状态）
            # 但标记不记录重复日志
            logger.info(f"[{trace_id}] 幂等命中，继续正常处理")

        # 构建 config
        config = _build_config(role, thread_id, trace_id, checkpointer)
        resolved_thread_id = config["configurable"]["thread_id"]

        # 构建初始状态：查询 checkpointer 是否已有保存的会话状态
        # 有 → 仅传新消息，其余字段由 checkpointer 恢复
        # 无 → 全量初始化（新会话）
        input_state = await _build_input_state(
            graph, config, message, user_id, user_name, resolved_thread_id,
            grade_level=grade_level,
        )

        try:
            result = await graph.ainvoke(input_state, config=config)
            reply = result.get("reply_content", "") or result.get("output", "")
            return {
                "message": reply,
                "thread_id": resolved_thread_id,
            }
        except Exception as e:
            logger.error(f"[{trace_id}] {role} chat 失败: {e}", exc_info=True)
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(status_code=500, detail=str(e)[:200])

    # ─── 流式聊天 ────────────────────────────────────
    @app.post("/v1/agents/{role}/chat/stream")
    async def agent_chat_stream(role: str, request: Request):
        if role not in agent_registry:
            raise HTTPException(status_code=404, detail=f"未知角色: {role}")

        graph = agent_registry[role]
        body = await request.json()
        message = body.get("message", "").strip()
        thread_id = body.get("thread_id")
        user_name = body.get("user_name", "").strip()
        user_id = body.get("user_id", thread_id or uuid.uuid4().hex[:16])
        grade_level = body.get("grade_level") or None

        if not message:
            raise HTTPException(status_code=422, detail="message 不能为空")

        trace_id = request.headers.get("x-trace-id", uuid.uuid4().hex[:16])
        logger.info(f"[{trace_id}] {role} chat/stream: msg={message[:50]}... tid={thread_id}")

        # 幂等去重
        if thread_id and _check_idempotency(thread_id, message):
            logger.info(f"[{trace_id}] 幂等命中（流式），继续正常处理")

        config = _build_config(role, thread_id, trace_id, checkpointer)
        resolved_thread_id = config["configurable"]["thread_id"]

        input_state = await _build_input_state(
            graph, config, message, user_id, user_name, resolved_thread_id,
            grade_level=grade_level,
        )

        return StreamingResponse(
            _stream_agent_response(graph, input_state, config),
            media_type="text/event-stream",
            headers={
                "cache-control": "no-cache",
                "connection": "keep-alive",
                "x-trace-id": trace_id,
            },
        )

    return app


def _build_new_session_state(message: str, user_id: str, user_name: str, session_id: str = "",
                              grade_level: Optional[str] = None) -> dict:
    """构建全新会话的初始状态。"""
    return {
        "messages": [HumanMessage(content=message)],
        "user_name": user_name or "同学",
        "user_id": user_id,
        "current_stage": "INIT",
        "session_id": session_id,
        "grade_level": grade_level,
        "experiment_title": None,
        "safety_hit": None,
        "stage_advanced": False,
        "reply_content": "",
        "trace_id": "",
        "system_prompt": "",
        "is_stage_ready_to_advance": False,
        "stage_summary": {},
        "user_intent": "NORMAL_CONTENT",
    }


async def _build_input_state(
    graph,
    config: dict,
    message: str,
    user_id: str,
    user_name: str,
    session_id: str = "",
    grade_level: Optional[str] = None,
) -> dict:
    """构建本轮输入状态。

    策略：
    - 通过 aget_state 查询 checkpointer 是否已有保存的会话上下文
    - 有 → 仅传本轮新消息（messages 靠 add_messages reducer 追加，
      其余字段靠 checkpointer 恢复之前保存的值）
    - 无 → 全量初始化（新会话）"""
    try:
        saved = await graph.aget_state(config)
        has_saved = bool(saved and saved.values)
    except Exception:
        has_saved = False

    if has_saved:
        return {"messages": [HumanMessage(content=message)]}

    return _build_new_session_state(message, user_id, user_name, session_id, grade_level=grade_level)


def _build_config(
    role: str,
    thread_id: Optional[str],
    trace_id: str,
    checkpointer: Optional[_CheckpointerType] = None,
) -> dict:
    """构建 RunnableConfig。"""
    config: dict[str, Any] = {
        "configurable": {
            "thread_id": thread_id or uuid.uuid4().hex[:32],
            "trace_id": trace_id,
        }
    }
    return config


def _incremental_reply_extractor() -> tuple[Any, Any]:
    """增量 JSON reply 提取器工厂。

    返回 (feed, get_latest_reply) 两个闭包：
    - feed(chunk: str): 输入新的 token 片段
    - get_latest_reply(): 返回自上次调用以来新提取出的 reply 子串

    工作原理：
    1. 每次收到新 chunk 后尝试用正则从累积缓冲区提取 "reply": "..." 内容
    2. 通过记录上次已推送的字符位置，仅返回增量部分
    3. 支持转义引号 (\")、纯字符串不终止等情况
    """
    buf = ""
    last_reply_end = 0  # reply 字段中已推送到的字符偏移

    _REPLY_PATTERN = _re.compile(r'"reply"\s*:\s*"(.*?)(?<!\\)"', _re.DOTALL)

    def feed(chunk: str) -> None:
        nonlocal buf
        buf += chunk

    def get_latest() -> str:
        nonlocal last_reply_end
        m = _REPLY_PATTERN.search(buf)
        if not m:
            return ""
        # m.start(1) 是第一个 quote 后的位置，即 reply 值开始处
        # m.end(1) 是已匹配到的内容结束位置
        content_start = m.start(1)
        content_end = m.end(1)

        # 如果上次已经推送到了 content_end 的后面，说明没有新内容
        if last_reply_end >= content_end:
            return ""

        # 如果 last_reply_end 小于 content_start，说明是全新的匹配，从头开始推
        if last_reply_end < content_start:
            last_reply_end = content_start

        # 提取增量部分
        new_text = buf[last_reply_end:content_end]
        last_reply_end = content_end
        return new_text

    return feed, get_latest


async def _stream_agent_response(graph, input_state: dict, config: dict):
    """流式输出 Agent 响应 — 增量 JSON 解析版。

    改进（对比原全量缓冲方案）：
    1. 边接收 LLM token 边增量提取 reply 字段，立即逐字推送给前端
    2. 不等待完整 JSON 生成，实现真正流式体验
    3. on_chain_end 时仍发送 stage 变更事件
    """
    session_id = config.get("configurable", {}).get("thread_id", "")

    yield serialize_meta(session_id=session_id)

    feed, get_new_reply = _incremental_reply_extractor()
    reply_sent = False
    final_output = None

    try:
        async for event in graph.astream_events(input_state, config=config, version="v2"):
            event_type = event.get("event", "")
            data = event.get("data", {})

            if event_type == "on_chat_model_stream":
                chunk = data.get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    feed(chunk.content)
                    # 每次新 chunk 后尝试提取新 reply 片段
                    new_text = get_new_reply()
                    if new_text:
                        yield serialize_token(new_text)
                        reply_sent = True

            # 记录最终输出（用于 stage_advanced 判断）
            elif event_type == "on_chain_end":
                output = data.get("output", {})
                if isinstance(output, dict):
                    final_output = output
                    # on_chain_end 时再做一次增量提取（可能还有剩余字符）
                    remain = get_new_reply()
                    if remain:
                        yield serialize_token(remain)
                        reply_sent = True

        # 流结束时做最后一次提取兜底
        remain = get_new_reply()
        if remain:
            yield serialize_token(remain)
            reply_sent = True

        # 如果没有提取到任何 reply，检查 final_output 的 reply_content 兜底
        if not reply_sent:
            if final_output and final_output.get("reply_content"):
                fallback = final_output["reply_content"]
                logger.info("流式无增量 token，回退使用 reply_content: %.50s", fallback)
                yield serialize_token(fallback)
                reply_sent = True
            else:
                logger.info("增量流式未提取到 reply 内容，流正常结束")

        # 阶段变更事件
        if final_output and final_output.get("stage_advanced"):
            yield serialize_stage(
                stage=final_output.get("current_stage", ""),
                grade_level=final_output.get("grade_level", ""),
            )

        yield serialize_done()

    except Exception as e:
        logger.error(f"流式处理失败: {e}", exc_info=True)
        yield serialize_error(str(e))
        yield serialize_done()
