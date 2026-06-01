"""
bs_lab_adapter 数据仓库层

封装 ai_chat_session 和 ai_chat_message 表的异步 CRUD 操作。
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models import AiChatSession, AiChatMessage


# ─── 会话管理 ─────────────────────────────────────────

async def create_session(
    db: AsyncSession,
    user_id: str,
    user_role: str = "Student",
    grade_level: Optional[str] = None,
    agent_type: str = "student",
) -> AiChatSession:
    """创建新会话。"""
    session = AiChatSession(
        session_id=uuid.uuid4().hex[:32],
        user_id=user_id,
        user_role=user_role,
        agent_type=agent_type,
        grade_level=grade_level,
        current_stage="INIT",
        is_active="y",
    )
    db.add(session)
    await db.flush()
    return session


async def get_session(db: AsyncSession, session_id: str) -> Optional[AiChatSession]:
    """按 session_id 查询会话（含 is_active 检查）。"""
    result = await db.execute(
        select(AiChatSession).where(
            AiChatSession.session_id == session_id,
            AiChatSession.is_active == "y",
        )
    )
    return result.scalar_one_or_none()


async def update_session_stage(
    db: AsyncSession,
    session_id: str,
    current_stage: str,
    grade_level: Optional[str] = None,
    experiment_title: Optional[str] = None,
) -> None:
    """更新会话的环节状态和年级属性。"""
    values = {"current_stage": current_stage}
    if grade_level is not None:
        values["grade_level"] = grade_level
    if experiment_title is not None:
        values["experiment_title"] = experiment_title

    await db.execute(
        update(AiChatSession)
        .where(AiChatSession.session_id == session_id)
        .values(**values)
    )


async def get_or_create_session(
    db: AsyncSession,
    thread_id: Optional[str],
    user_id: str,
    user_role: str = "Student",
    grade_level: Optional[str] = None,
    agent_type: str = "student",
) -> AiChatSession:
    """获取或创建会话。"""
    if thread_id:
        session = await get_session(db, thread_id)
        if session:
            return session

    return await create_session(db, user_id, user_role, grade_level, agent_type)


# ─── 消息管理 ─────────────────────────────────────────

async def save_message(
    db: AsyncSession,
    session_id: str,
    role: str,
    content: str,
    metadata: Optional[dict] = None,
) -> AiChatMessage:
    """保存一条消息到数据库。"""
    msg = AiChatMessage(
        session_id=session_id,
        role=role,
        content=content,
        metadata=metadata,
    )
    db.add(msg)
    await db.flush()
    return msg


async def get_recent_messages(
    db: AsyncSession,
    session_id: str,
    limit: int = 20,
) -> list[AiChatMessage]:
    """获取最近的 N 条消息（滑动窗口）。"""
    result = await db.execute(
        select(AiChatMessage)
        .where(AiChatMessage.session_id == session_id)
        .order_by(AiChatMessage.create_time.desc())
        .limit(limit)
    )
    rows = result.scalars().all()
    rows.reverse()
    return rows


async def get_chat_history_messages(
    db: AsyncSession,
    session_id: str,
) -> list[dict]:
    """获取格式化的对话历史（给 LLM 使用）。"""
    messages = await get_recent_messages(db, session_id)
    return [
        {"role": msg.role, "content": msg.content}
        for msg in messages
        if msg.role in ("user", "assistant")
    ]
