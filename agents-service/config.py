"""
bs_lab_adapter 配置模块

加载环境变量，提供全局配置对象。
"""

from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── 数据库（MySQL 业务数据） ──
    # 开发环境：mysql+aiomysql://root:password@10.0.181.204:13306/bs_exp_data
    # 生产环境：mysql+aiomysql://root:password@10.0.181.204:13306/bs_exp_data_prod
    # 不配置时数据库相关功能降级不可用，不影响纯 AI 对话
    database_url: str = ""

    # ── LLM (OpenAI 兼容 API) ──
    llm_api_key: str = ""
    llm_base_url: str = "https://api.deepseek.com/v1"
    llm_model: str = "deepseek-chat"
    llm_timeout_ms: int = 60_000

    # ── Postgres Checkpointer（可选，不配置则使用 MemorySaver） ──
    postgres_url: str = ""

    # ── 服务 ──
    host: str = "0.0.0.0"
    port: int = 5001
    log_level: str = "info"

    model_config = {
        "env_file": ["../.env.local", ".env.local", ".env"],
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
