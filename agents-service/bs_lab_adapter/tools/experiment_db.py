"""
bs_lab_adapter 实验数据库工具

供 LangGraph ToolNode 使用的工具函数。
"""

from __future__ import annotations

import logging
from typing import Any, Optional

logger = logging.getLogger("bs_lab_adapter.tools.experiment_db")


async def query_experiment_by_title(
    title: str,
    limit: int = 5,
) -> list[dict[str, Any]]:
    """按标题模糊匹配查询实验。

    这是一个占位工具，待对接正式实验表后实现真实查询。
    """
    logger.info(f"查询实验: title={title}, limit={limit}")
    # TODO: 对接 edu_experiment 表实现真实查询
    return []


async def get_experiment_by_id(exp_id: str) -> Optional[dict[str, Any]]:
    """按 ID 查询实验详情。"""
    logger.info(f"查询实验详情: id={exp_id}")
    # TODO: 对接 edu_experiment 表实现真实查询
    return None


async def list_experiments_by_grade(
    grade_level: str,
    limit: int = 20,
) -> list[dict[str, Any]]:
    """按年级段查询推荐实验列表。"""
    logger.info(f"查询年级段实验: grade={grade_level}")
    # TODO: 对接 edu_experiment 表实现真实查询
    return []
