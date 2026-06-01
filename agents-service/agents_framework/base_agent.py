"""
agents_framework.base_agent — BaseAgent 基类

封装 LangGraph StateGraph 的通用构建模式：
1. 定义 State TypedDict
2. 注册节点和边
3. 编译为 CompiledGraph（带 Checkpointer）
"""

from __future__ import annotations

import logging
from typing import Any, Callable, Optional, Type

from langgraph.graph import StateGraph, START, END

logger = logging.getLogger("agents_framework.base_agent")


_Checkpointer = Any  # PostgresSaver | MemorySaver | None


class BaseAgent:
    """Agent 基类。

    每个业务智能体只需：
    1. 定义 State 类型（TypedDict）
    2. 实现节点函数
    3. 定义边和条件边
    4. 调用 cls.create() 获得 CompiledGraph

    用法:
        class MyState(TypedDict):
            ...

        graph = BaseAgent.create(
            state_schema=MyState,
            nodes={"node_a": node_a_fn, "node_b": node_b_fn},
            edges=[("node_a", "node_b")],
            conditional_edges=[("node_a", router_fn, {"b": "node_b", END: END})],
            checkpointer=saver,
        )
    """

    @classmethod
    def create(
        cls,
        state_schema: Type[dict],
        nodes: dict[str, Callable[..., Any]],
        edges: Optional[list[tuple[str, str]]] = None,
        conditional_edges: Optional[list[tuple[str, Callable[..., str], dict[str, str]]]] = None,
        checkpointer: Optional[_Checkpointer] = None,
        first_node: Optional[str] = None,
    ) -> Any:
        """构建并编译 LangGraph。

        Args:
            state_schema: State 的 TypedDict 类型
            nodes: {节点名: 处理函数} 映射
            edges: [(from, to)] 固定边列表
            conditional_edges: [(from, router_fn, {label: target})] 条件边列表
            checkpointer: PostgresSaver / MemorySaver 实例（可选）
            first_node: 入口节点名（默认取 nodes 第一个）

        Returns:
            CompiledGraph 实例
        """
        builder = StateGraph(state_schema)

        for name, fn in nodes.items():
            builder.add_node(name, fn)

        edges = edges or []
        for from_node, to_node in edges:
            builder.add_edge(from_node, to_node)

        conditional_edges = conditional_edges or []
        for from_node, router_fn, mapping in conditional_edges:
            builder.add_conditional_edges(from_node, router_fn, mapping)

        # 添加 START → 第一个节点
        entry_point = first_node or (list(nodes.keys())[0] if nodes else None)
        if entry_point:
            builder.add_edge(START, entry_point)

        compile_kwargs = {}
        if checkpointer:
            compile_kwargs["checkpointer"] = checkpointer

        graph = builder.compile(**compile_kwargs)

        graph.name = cls.__name__
        logger.info(f"Agent {cls.__name__} 编译完成，节点: {list(nodes.keys())}")

        return graph
