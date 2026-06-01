"""
弹性多租户检查点（Checkpointer）模块

实现开发环境下的轻量化 TTL 自动内存清理机制，彻底解决 MemorySaver 无上限膨胀导致 OOM 的隐患。
"""

from __future__ import annotations

import logging
import time
from typing import Any, Optional

from langchain_core.runnables import RunnableConfig

from langgraph.checkpoint.base import ChannelVersions, Checkpoint, CheckpointMetadata
from langgraph.checkpoint.memory import MemorySaver

logger = logging.getLogger("agents_framework.checkpointer")

# ─── TTL MemorySaver ──────────────────────────────────────

_DEFAULT_TTL_SECONDS = 3600  # 1 小时


class TTLMemorySaver(MemorySaver):
    """
    自愈型带 TTL 的内存 Checkpointer 引擎：
    在原生内存检查点的基础上，通过拦截 put 动作记录时间戳，
    并在达到设定的存活期后自动回收过期会话状态，防止 OOM。
    """

    def __init__(self, ttl_seconds: int = _DEFAULT_TTL_SECONDS, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.ttl_seconds = ttl_seconds
        # 跟踪每个 thread_id 最后的更新时间
        self.last_accessed: dict[str, float] = {}

    def put(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        """
        拦截保存检查点事件，记录活动时间，并顺便执行极简的无阻塞 GC。
        🌟 100% 对齐原生的 put 签名，彻底消除 TypeError！
        """
        # 1. 提取 thread_id 并记录最后活动时间
        configurable = config.get("configurable", {})
        thread_id = configurable.get("thread_id")

        if thread_id:
            self.last_accessed[thread_id] = time.time()

        # 2. 顺带触发极简的过期淘汰机制 (GC)
        self._collect_garbage()

        # 3. 核心修复：完全透传所有位置参数给父类 MemorySaver.put
        return super().put(config, checkpoint, metadata, new_versions)

    def _collect_garbage(self) -> None:
        """
        不留情面的无阻塞垃圾清理：
        查找内存中已超过生存期 (TTL) 的会话并执行物理擦除。
        """
        now = time.time()
        expired_threads = []

        # 找出所有过期的会话线程
        for thread_id, last_time in self.last_accessed.items():
            if now - last_time > self.ttl_seconds:
                expired_threads.append(thread_id)

        if not expired_threads:
            return

        # 执行清理动作
        for thread_id in expired_threads:
            try:
                # 原生 MemorySaver 的底层数据存放在 self.storage 中
                keys_to_delete = [
                    k
                    for k in self.storage.keys()
                    if k == thread_id or (isinstance(k, tuple) and k[0] == thread_id)
                ]

                for k in keys_to_delete:
                    del self.storage[k]

                # 清理时间追踪表
                if thread_id in self.last_accessed:
                    del self.last_accessed[thread_id]

                logger.info(
                    "[GC] 会话 %s 已超过 TTL (%ss) 限制，内存状态已安全淘汰。",
                    thread_id,
                    self.ttl_seconds,
                )
            except Exception as e:
                logger.error(
                    "[GC] 清理会话 %s 时发生未捕获异常: %s", thread_id, e
                )


# ─── 工厂函数 ──────────────────────────────────────────────

def create_checkpointer(
    connection_string: Optional[str] = None,
    min_connections: int = 2,
    max_connections: int = 10,
    memory_ttl_seconds: int = _DEFAULT_TTL_SECONDS,
) -> Any:
    """创建并初始化 checkpointer。

    自动选择策略：
    - 传入有效的 connection_string → 尝试 PostgresSaver（生产）
    - 未传入或连接失败 → TTLMemorySaver（开发/降级，带 TTL 防 OOM）

    Args:
        connection_string: PostgreSQL 连接字符串（None 则使用 TTLMemorySaver）
        min_connections: 最小连接数（仅 Postgres）
        max_connections: 最大连接数（仅 Postgres）
        memory_ttl_seconds: TTLMemorySaver 会话空闲超时（秒），默认 3600

    Returns:
        PostgresSaver 或 TTLMemorySaver 实例
    """
    # 未配置 Postgres 地址，使用内存模式（带 TTL）
    if not connection_string:
        logger.info(
            "未配置 POSTGRES_URL，使用 TTLMemorySaver（内存模式，ttl=%ss）",
            memory_ttl_seconds,
        )
        logger.info("提示：配置 POSTGRES_URL 环境变量可启用 Postgres 持久化 checkpointer")
        return TTLMemorySaver(ttl_seconds=memory_ttl_seconds)

    # 尝试 PostgresSaver
    try:
        from langgraph.checkpoint.postgres import PostgresSaver
        from psycopg import ConnectionPool

        pool = ConnectionPool(
            connection_string,
            min_size=min_connections,
            max_size=max_connections,
        )
        saver = PostgresSaver(pool)

        # 创建必要的 checkpoint 表
        saver.setup()

        logger.info(
            "Postgres checkpointer 初始化完成 (pool=%s-%s)",
            min_connections,
            max_connections,
        )
        return saver

    except Exception as e:
        logger.warning("Postgres checkpointer 初始化失败，降级为 TTLMemorySaver: %s", e)
        return TTLMemorySaver(ttl_seconds=memory_ttl_seconds)
