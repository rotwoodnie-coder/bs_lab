"""
bs_lab_adapter 报告工具

供 LangGraph ToolNode 使用的报告生成工具函数。
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("bs_lab_adapter.tools.report")


async def generate_experiment_report(
    session_data: dict[str, Any],
) -> str:
    """根据会话数据生成实验报告摘要。"""
    logger.info("生成实验报告")
    title = session_data.get("experiment_title", "未命名实验")
    stages = session_data.get("stages", [])
    return f"实验「{title}」共完成 {len(stages)} 个环节。"
