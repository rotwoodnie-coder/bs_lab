"""
bs_lab_adapter 数据库引擎

基于 SQLAlchemy AsyncSession + aiomysql，提供异步 MySQL 数据库会话。

设计要点：
1. 延迟初始化：engine 在首次 get_db() 调用时创建，避免启动时无用连接。
2. 优雅降级：database_url 为空时自动禁用 DB 功能，不影响纯 AI 对话。
3. 连接池隔离：DB 读写使用独立短生命周期会话，不与 SSE 长连接绑定。
"""

from __future__ import annotations

import logging
from typing import Optional, AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from config import settings

logger = logging.getLogger("bs_lab_adapter.database")

# ─── 延迟初始化的引擎 ─────────────────────────────────────
_engine = None
_session_factory = None
_db_enabled = False


def _ensure_engine() -> None:
    """确保引擎已初始化，仅执行一次。"""
    global _engine, _session_factory, _db_enabled
    if _engine is not None:
        return

    if not settings.database_url:
        logger.warning("DATABASE_URL 未配置，数据库功能已禁用")
        return

    try:
        _engine = create_async_engine(
            settings.database_url,
            pool_size=5,          # 减小池大小，适应 SSE 场景
            max_overflow=10,
            pool_recycle=300,     # 5 分钟回收，避免长时间空闲连接被 MySQL 断开
            echo=False,
        )
        _session_factory = async_sessionmaker(
            _engine, class_=AsyncSession, expire_on_commit=False
        )
        _db_enabled = True
        logger.info(
            "数据库引擎初始化成功: pool_size=5, max_overflow=10, recycle=300s"
        )
    except Exception as e:
        logger.error("数据库引擎初始化失败: %s，数据库功能已禁用", e)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI 依赖注入：获取异步数据库会话。

    使用短生命周期会话，每次调用（而非每个请求）创建和销毁。
    非 SSE 场景中，get_db() 在请求开始时打开、结束时关闭，不阻塞长连接。
    SSE 场景中，在需要读写 DB 的瞬态时刻调用 get_db()，用完立即释放。
    """
    _ensure_engine()

    if not _db_enabled:
        # 数据库未配置时返回 None，调用方需处理 None 情况
        yield None  # type: ignore[arg-type]
        return

    session = _session_factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def get_db_sync() -> Optional[AsyncSession]:
    """直接获取一个独立 DB 会话（非 FastAPI 依赖注入）。

    用于工具函数等无需 FastAPI 注入的场景。
    调用方负责管理事务和关闭会话。
    """
    _ensure_engine()
    if not _db_enabled:
        return None
    return _session_factory()
