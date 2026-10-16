"""集中式配置。

所有可调参数都通过环境变量（前缀 ``BLOG_``）注入，代码中不写死。
这样本地开发、CI、生产可以共用同一份代码，只切换 .env。
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ 目录，用于定位 .env 与默认数据目录
BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_prefix="BLOG_",
        extra="ignore",
    )

    # ---- 应用元信息 ----
    app_name: str = "Glass Blog API"
    api_prefix: str = "/api/v1"
    debug: bool = True

    # ---- 数据来源 ----
    # 当前版本使用 JSON 文件作为内容源（见 repositories/json_repository.py）。
    # 后续接入数据库时，只需新增一个 Repository 实现并把这里换成连接串。
    data_dir: Path = BASE_DIR / "app" / "data"

    # ---- 跨域 ----
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


@lru_cache
def get_settings() -> Settings:
    """带缓存的 Settings 单例，可在依赖注入中直接使用。"""
    return Settings()