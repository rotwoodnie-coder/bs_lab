"""
agents_framework.sse — SSE 流式工具

将 LangGraph streaming_events() 输出序列化为前端可消费的 SSE 事件格式。
"""

from __future__ import annotations

import json
import logging
from typing import Any, AsyncGenerator, Optional

logger = logging.getLogger("agents_framework.sse")


def serialize_meta(session_id: str, **kwargs: Any) -> str:
    """生成 meta 事件。"""
    data = {"type": "meta", "session_id": session_id, **kwargs}
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def serialize_token(content: str) -> str:
    """生成 token 事件。"""
    return f"data: {json.dumps({'content': content}, ensure_ascii=False)}\n\n"


def serialize_stage(stage: str, grade_level: str = "") -> str:
    """生成 stage 事件（环节变更通知）。"""
    data = {"type": "stage", "stage": stage, "grade_level": grade_level}
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def serialize_done() -> str:
    """生成结束标记。"""
    return "data: [DONE]\n\n"


def serialize_error(message: str) -> str:
    """生成错误事件。"""
    data = {"type": "error", "data": message[:200]}
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


async def event_stream_from_graph(
    graph,
    input_state: dict,
    config: dict,
) -> AsyncGenerator[str, None]:
    """将 LangGraph astream_events() 包装为 SSE 事件流。

    Args:
        graph: CompiledGraph 实例
        input_state: 初始状态
        config: RunnableConfig（含 thread_id 等）

    Yields:
        SSE 格式的事件字符串
    """
    full_reply = ""
    try:
        async for event in graph.astream_events(input_state, config=config, version="v2"):
            event_type = event.get("event", "")
            data = event.get("data", {})

            if event_type == "on_chain_start" and "metadata" in data:
                # meta 事件：发送 session_id 等元信息
                metadata = data.get("metadata", {})
                meta_event = serialize_meta(
                    session_id=metadata.get("session_id", config.get("configurable", {}).get("thread_id", "")),
                    grade_level=data.get("grade_level", ""),
                    stage=data.get("current_stage", ""),
                )
                if meta_event:
                    yield meta_event

            elif event_type == "on_chat_model_stream":
                chunk = data.get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    full_reply += chunk.content
                    yield serialize_token(chunk.content)

            elif event_type == "on_chain_end":
                output = data.get("output", {})
                if output.get("stage_advanced"):
                    yield serialize_stage(
                        stage=output.get("current_stage", ""),
                        grade_level=output.get("grade_level", ""),
                    )

        yield serialize_done()

    except Exception as e:
        logger.error(f"SSE 流式处理失败: {e}", exc_info=True)
        yield serialize_error(str(e))
        yield serialize_done()
