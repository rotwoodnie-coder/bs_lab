"""
BS Lab LangGraph Agent 服务 — 主入口

启动方式:
    uvicorn main:app --host 0.0.0.0 --port 5001 --reload
"""

from __future__ import annotations

import logging

from config import settings
from agents_framework.checkpointer import create_checkpointer
from agents_framework.server import create_agent_app

from bs_lab_adapter.graphs.student_graph import create_student_graph

# ─── 日志配置 ─────────────────────────────────────────

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(name)s] %(levelname)s %(message)s",
)
logger = logging.getLogger("agents-service")


# ─── 初始化 Checkpointer ──────────────────────────────
# 自动选择：配置了 POSTGRES_URL → PostgresSaver（生产）
#           未配置或连接失败  → MemorySaver（零依赖开发模式）
checkpointer = create_checkpointer(settings.postgres_url)


# ─── 注册智能体 ───────────────────────────────────────

agent_registry: dict[str, object] = {}

# 石头老师（学生端）
student_graph = create_student_graph(checkpointer=checkpointer)
if student_graph:
    agent_registry["student"] = student_graph
    logger.info("已注册 agent: student（石头老师）")

# TODO: 未来 PR2 补充
# from bs_lab_adapter.graphs.teacher_graph import create_teacher_graph
# from bs_lab_adapter.graphs.researcher_graph import create_researcher_graph
# from bs_lab_adapter.graphs.parent_graph import create_parent_graph
# from bs_lab_adapter.graphs.admin_graph import create_admin_graph
# agent_registry["teacher"] = create_teacher_graph(checkpointer=checkpointer)
# agent_registry["researcher"] = create_researcher_graph(checkpointer=checkpointer)
# agent_registry["parent"] = create_parent_graph(checkpointer=checkpointer)
# agent_registry["admin"] = create_admin_graph(checkpointer=checkpointer)


# ─── 创建 FastAPI 应用 ────────────────────────────────

app = create_agent_app(
    agent_registry=agent_registry,
    checkpointer=checkpointer,
    title="BS Lab LangGraph Agent Service",
    version="1.0.0",
)

logger.info(f"Agent 服务启动完成，可用角色: {list(agent_registry.keys())}")
logger.info(f"端口: {settings.port}, LLM: {settings.llm_model} @ {settings.llm_base_url}")


# ─── 主入口 ───────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level,
    )
