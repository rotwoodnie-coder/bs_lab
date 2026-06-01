"""
agents_framework — 通用 LangGraph Agent 框架层

提供：
- BaseAgent 基类（StateGraph 构建 + Checkpointer）
- ToolRegistry（通用 / 领域工具分层注册）
- Checkpointer 封装（PostgresSaver）
- SSE 序列化工具
- 标准 FastAPI 路由模板
- 标准错误模型
"""

from agents_framework.base_agent import BaseAgent
from agents_framework.tool_registry import ToolRegistry, AgentTool
from agents_framework.checkpointer import create_checkpointer
from agents_framework.server import create_agent_app
from agents_framework.errors import AgentError, classify_error

__all__ = [
    "BaseAgent",
    "ToolRegistry",
    "AgentTool",
    "create_checkpointer",
    "create_agent_app",
    "AgentError",
    "classify_error",
]
