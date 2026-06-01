"""
agents_framework.tool_registry — 分层工具注册器

支持通用工具（LLM、RAG 等）和领域工具（业务定制）的分层注册。
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

logger = logging.getLogger("agents_framework.tool_registry")


@dataclass
class AgentTool:
    """一个可注册的工具定义。"""

    name: str
    description: str
    fn: Callable[..., Any]
    timeout_ms: int = 30_000


@dataclass
class ToolRegistry:
    """分层工具注册器。

    用法:
        registry = ToolRegistry()
        registry.register_generic(AgentTool(name="web_search", ...))
        registry.register_domain(AgentTool(name="query_experiment", ...))
        tools = registry.get_tools_for_role("student")
    """

    generic_tools: dict[str, AgentTool] = field(default_factory=dict)
    domain_tools: dict[str, AgentTool] = field(default_factory=dict)
    # role → tool_names 映射（指定哪些工具属于哪个角色）
    role_tool_map: dict[str, list[str]] = field(default_factory=dict)

    def register_generic(self, tool: AgentTool) -> None:
        """注册通用工具（所有角色可用）。"""
        self.generic_tools[tool.name] = tool

    def register_domain(self, tool: AgentTool, roles: Optional[list[str]] = None) -> None:
        """注册领域工具，可按角色限定可用性。

        Args:
            tool: 工具定义
            roles: 可用的角色列表（None 表示所有角色可用）
        """
        self.domain_tools[tool.name] = tool
        if roles:
            for role in roles:
                self.role_tool_map.setdefault(role, []).append(tool.name)

    def get_tools_for_role(self, role: str) -> list[AgentTool]:
        """获取指定角色的所有可用工具。"""
        tools: list[AgentTool] = list(self.generic_tools.values())
        for name in self.role_tool_map.get(role, []):
            if name in self.domain_tools:
                tools.append(self.domain_tools[name])
        # 未显式限定的领域工具也对所有角色开放
        for name, tool in self.domain_tools.items():
            if name not in self.role_tool_map.get(role, []) and name not in [
                n for names in self.role_tool_map.values() for n in names
            ]:
                tools.append(tool)
        return tools

    async def execute_tool(
        self, tool_name: str, role: str, **kwargs: Any
    ) -> Any:
        """执行一个工具（带超时保护）。"""
        all_tools = {**self.generic_tools, **self.domain_tools}
        tool = all_tools.get(tool_name)
        if not tool:
            raise ValueError(f"工具 '{tool_name}' 未注册")

        try:
            if asyncio.iscoroutinefunction(tool.fn):
                return await asyncio.wait_for(
                    tool.fn(**kwargs), timeout=tool.timeout_ms / 1000
                )
            return tool.fn(**kwargs)
        except asyncio.TimeoutError:
            raise TimeoutError(f"工具 '{tool_name}' 执行超时 ({tool.timeout_ms}ms)")
