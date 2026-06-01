"""
bs_lab_adapter SQLAlchemy ORM 模型

表：
  ai_chat_session  — 会话主表（年级属性、状态机、实验关联）
  ai_chat_message  — 消息明细表（滑动窗口历史）
"""

from __future__ import annotations

from sqlalchemy import (
    Column,
    String,
    Text,
    Enum,
    BigInteger,
    JSON,
    DateTime,
    func,
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class AiChatSession(Base):
    __tablename__ = "ai_chat_session"

    session_id = Column(String(32), primary_key=True, comment="会话主键")
    user_id = Column(String(32), nullable=False, comment="发起用户 id")
    user_role = Column(String(32), nullable=False, default="Student", comment="用户角色")
    agent_type = Column(
        Enum("student", "teacher", "researcher", "parent", name="agent_type_enum"),
        nullable=True,
        default="student",
        comment="智能体类型: student/teacher/researcher/parent",
    )
    grade_level = Column(
        Enum("低段", "中段", "高段", name="grade_level_enum"),
        nullable=True,
        comment="年级属性：低段(1-2)/中段(3-4)/高段(5-6)",
    )
    current_stage = Column(
        Enum(
            "INIT", "GOAL", "MATERIAL", "STEP",
            "RECORD", "CONCLUSION", "FINAL",
            name="stage_enum",
        ),
        nullable=False,
        default="INIT",
        comment="当前环节状态",
    )
    experiment_title = Column(String(256), nullable=True, comment="实验标题（从对话中提取）")
    experiment_id = Column(String(32), nullable=True, comment="关联实验主键")
    summary = Column(Text, nullable=True, comment="会话摘要（最终产出的完整方案）")
    is_active = Column(
        Enum("y", "n", name="active_enum"),
        nullable=False,
        default="y",
        comment="会话是否有效",
    )
    create_time = Column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
    update_time = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        comment="更新时间",
    )


class AiChatMessage(Base):
    __tablename__ = "ai_chat_message"

    message_id = Column(BigInteger, primary_key=True, autoincrement=True, comment="自增主键")
    session_id = Column(String(32), nullable=False, comment="所属会话 id")
    role = Column(
        Enum("user", "assistant", "system", name="msg_role_enum"),
        nullable=False,
        comment="消息角色",
    )
    content = Column(Text, nullable=False, comment="消息内容")
    metadata = Column(JSON, nullable=True, comment="附加元数据（如 token 用量、stage 快照等）")
    create_time = Column(
        DateTime, nullable=False, server_default=func.now(), comment="创建时间"
    )
