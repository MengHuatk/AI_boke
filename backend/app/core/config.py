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
    # 文章与杂谈存 SQLite；site.json / profile.json 仍由仓储直接读取。
    database_url: str = f"sqlite:///{BASE_DIR / 'app' / 'blog.db'}"
    data_dir: Path = BASE_DIR / "app" / "data"

    # ---- 管理后台 ----
    # 默认关闭，本地开发时在 backend/.env 里显式打开。
    admin_enabled: bool = False
    admin_password_hash: str = ""
    session_secret: str = ""
    admin_session_max_age: int = 12 * 60 * 60
    # 公网 HTTPS 部署时设为 true，让会话 Cookie 只走加密连接。
    admin_cookie_secure: bool = False

    # ---- 图片上传 ----
    upload_dir: Path = BASE_DIR / "uploads"
    upload_url_prefix: str = "/uploads"
    upload_max_bytes: int = 5 * 1024 * 1024
    # 音频文件通常远大于图片，单独给一个上限。
    audio_upload_max_bytes: int = 30 * 1024 * 1024

    # ---- 跨域 ----
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # ---- 看板娘 AI 对话 ----
    # OpenAI 兼容接口。key 只放在后端 .env，不进入前端包。
    ai_base_url: str = "https://api.siliconflow.cn/v1"
    ai_api_key: str = ""
    ai_model: str = "Qwen/Qwen2.5-7B-Instruct"
    ai_timeout: float = 30.0
    ai_max_tokens: int = 300
    ai_rate_limit_per_minute: int = 10


@lru_cache
def get_settings() -> Settings:
    """带缓存的 Settings 单例，可在依赖注入中直接使用。"""
    return Settings()