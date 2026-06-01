"""
bs_lab_adapter Pydantic 数据模式

定义请求/响应数据结构以及石头老师智能体的结构化输出契约。
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ─── 教学阶段枚举 ─────────────────────────────────────

class TeachingStage(str, Enum):
    """石头老师对话环节状态机。"""
    INIT = "INIT"
    GOAL = "GOAL"
    MATERIAL = "MATERIAL"
    STEP = "STEP"
    RECORD = "RECORD"
    CONCLUSION = "CONCLUSION"
    FINAL = "FINAL"


# ─── 石头老师结构化输出 ───────────────────────────────

class StoneTeacherResponse(BaseModel):
    """石头老师回复的结构化输出。

    LLM 通过 with_structured_output() 一次性输出：
    - reply: 教师话术
    - inferred_stage: 状态流转控制符（推进/回退/不变）
    - extracted_title: 实验标题（仅首次提取）
    - inferred_grade: 年级段推断（仅 INIT 阶段首次填充）
    """

    reply: str = Field(
        ...,
        description="石头老师对学生本轮输入的自然语言回复。亲切、引导性、以问题结尾。",
    )
    inferred_stage: Optional[TeachingStage] = Field(
        default=None,
        description=(
            "基于本轮对话语义推断的下一环节。规则：\n"
            "- None = 当前阶段师生交流尚未充分，继续追问（不推进）\n"
            "- 某个 TeachingStage 枚举值 = 推进或回退到该环节\n"
            "  例如：学生明确同意目标后 → GOAL→MATERIAL；"
            "学生反馈'杯子扎不透' → STEP 回退到 MATERIAL"
        ),
    )
    extracted_title: Optional[str] = Field(
        default=None,
        description=(
            "从学生对话中提取的实验标题。"
            "仅在首次识别时填充（如学生说'我想探究水的压强'→'水的压强'），"
            "后续轮次保持 None。"
        ),
    )
    inferred_grade: Optional[str] = Field(
        default=None,
        description=(
            "从学生对话中推断的年级段。仅 INIT 阶段可填充：\n"
            "- '低段' = 1-2 年级\n"
            "- '中段' = 3-4 年级\n"
            "- '高段' = 5-6 年级\n"
            "后续轮次保持 None。"
        ),
    )
    is_stage_ready_to_advance: bool = Field(
        default=False,
        description=(
            "当前阶段是否已充分讨论、学生已理解教学内容，可以推进到下一阶段。\n"
            "严格标准（必须同时满足以下所有条件才为 true）：\n"
            "  A. 学生已明确表达了该阶段需确认的所有信息\n"
            "  B. 本阶段已经至少进行了 2 轮有效对话\n"
            "  C. 学生没有表达'需要更多时间/再想想/再找找'等延迟信号\n"
            "默认条件不满足时，必须为 false，绝不允许默认 true。"
        ),
    )


# ─── 基础聊天协议 ─────────────────────────────────────

class ChatRequestBody(BaseModel):
    """通用聊天请求体。"""
    message: str = Field(..., min_length=1, max_length=8000, description="用户消息")
    thread_id: Optional[str] = Field(None, description="会话 ID，用于多轮对话记忆")
    user_name: str = Field("", max_length=64, description="用户姓名（个性化）")
    user_id: Optional[str] = Field(None, description="用户 ID")


class ChatResponseBody(BaseModel):
    """通用聊天响应体。"""
    message: str = Field(..., description="助手回复")
    thread_id: Optional[str] = Field(None, description="会话 ID（透传或新生成）")
    current_stage: TeachingStage = Field(TeachingStage.INIT, description="当前环节")
    grade_level: Optional[str] = Field(None, description="年级属性")
