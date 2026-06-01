"""
bs_lab_adapter 安全过滤器

前置过滤（Pre-filter）：在请求发送给 LLM 之前，对用户消息进行安全拦截。

注意：缝衣针、"利器"等日常实验工具（在有大人陪同下安全可用）
已从 DANGEROUS_KEYWORDS 移除，交由 LLM 在上下文中进行温柔的风险提示。
"""

from __future__ import annotations

from typing import List

# ─── 危险关键词库 ─────────────────────────────────────

DANGEROUS_KEYWORDS: List[str] = [
    "火", "明火", "点燃", "燃烧", "爆炸", "酒精灯", "蜡烛",
    "盐酸", "硫酸", "强酸", "强碱", "腐蚀", "化学品",
    "刀", "注射器",
    "高压电", "220V", "插座", "电线",
    "毒品", "吸毒", "注射毒品",
    "炸弹", "鞭炮", "火药",
]


def check_safety(message: str) -> list[str]:
    """检查用户消息是否包含危险关键词。"""
    hit_keywords: list[str] = []
    for kw in DANGEROUS_KEYWORDS:
        if kw in message:
            hit_keywords.append(kw)
    return hit_keywords


def build_safety_hint(hit_keywords: list[str]) -> str:
    """根据命中的危险关键词生成拦截提示。"""
    kw_str = "、".join(hit_keywords)
    return (
        f"石头老师检测到你的想法中涉及【{kw_str}】，这个有一定危险性哦！"
        "为了你的安全，我们换一种更安全的实验方式来探究吧。"
        "你可以想想有没有可以用水、日常生活用品完成的实验？"
    )
