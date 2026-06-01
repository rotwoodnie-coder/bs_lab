"""
bs_lab_adapter 课标工具

供 LangGraph ToolNode 使用的课标相关工具函数。
"""

from __future__ import annotations

import logging
from typing import Any, Optional

logger = logging.getLogger("bs_lab_adapter.tools.curriculum")


async def check_curriculum_alignment(
    experiment_title: str,
    grade_level: str,
) -> dict[str, Any]:
    """检查实验是否与课标对齐。

    这是一个占位工具，待对接课标库后实现真实查询。
    """
    logger.info(f"课标对齐检查: exp={experiment_title}, grade={grade_level}")
    return {"aligned": True, "standards": [], "suggestions": ""}
