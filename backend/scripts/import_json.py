"""把旧的 JSON 内容导入 SQLite。

用法（在 backend/ 目录下）：
    .venv/Scripts/python.exe scripts/import_json.py

- 读取 ``app/data/posts.json``；如果同目录存在 ``talks.json``，一并导入。
- 已存在的 slug 会跳过，因此脚本可以重复运行。
- 不删除、不修改任何原始 JSON 文件。
"""

from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import OperationalError

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import get_settings  # noqa: E402
from app.db.models import Post, Talk  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.repositories.sqlite_repository import estimate_reading_minutes  # noqa: E402


def load_rows(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as fp:
        return json.load(fp)


def parse_time(value: str | None) -> datetime:
    if not value:
        return datetime.now()
    return datetime.fromisoformat(value)


def import_posts(session, rows: list[dict]) -> tuple[int, int]:
    imported = skipped = 0

    for row in rows:
        slug = row["slug"]
        if session.scalar(select(Post).where(Post.slug == slug)) is not None:
            skipped += 1
            continue

        published_at = parse_time(row.get("published_at"))
        session.add(
            Post(
                id=row.get("id") or uuid4().hex,
                slug=slug,
                title=row["title"],
                excerpt=row.get("excerpt", ""),
                cover=row.get("cover"),
                body=row.get("body", ""),
                tags=row.get("tags", []),
                status="published",
                featured=bool(row.get("featured", False)),
                reading_minutes=int(
                    row.get("reading_minutes")
                    or estimate_reading_minutes(row.get("body", ""))
                ),
                published_at=published_at,
                created_at=published_at,
                updated_at=published_at,
            )
        )
        imported += 1

    return imported, skipped


def import_talks(session, rows: list[dict]) -> tuple[int, int]:
    imported = skipped = 0

    for row in rows:
        slug = row["slug"]
        if session.scalar(select(Talk).where(Talk.slug == slug)) is not None:
            skipped += 1
            continue

        published_at = parse_time(row.get("published_at"))
        session.add(
            Talk(
                id=row.get("id") or uuid4().hex,
                slug=slug,
                title=row["title"],
                excerpt=row.get("excerpt", ""),
                cover=row.get("cover"),
                body=row.get("body", ""),
                tags=row.get("tags", []),
                mood=row.get("mood", ""),
                status="published",
                reading_minutes=estimate_reading_minutes(row.get("body", "")),
                published_at=published_at,
                created_at=published_at,
                updated_at=published_at,
            )
        )
        imported += 1

    return imported, skipped


def main() -> None:
    settings = get_settings()
    posts = load_rows(settings.data_dir / "posts.json")
    talks = load_rows(settings.data_dir / "talks.json")

    with SessionLocal() as session:
        try:
            session.scalar(select(Post).limit(1))
        except OperationalError as exc:
            raise SystemExit(
                "数据库表不存在。请先在 backend/ 目录运行：\n"
                "    .venv/Scripts/alembic upgrade head"
            ) from exc

        post_imported, post_skipped = import_posts(session, posts)
        talk_imported, talk_skipped = import_talks(session, talks)
        session.commit()

    print(f"文章：导入 {post_imported} 篇，跳过 {post_skipped} 篇")
    if not (settings.data_dir / "talks.json").exists():
        print("杂谈：未找到 talks.json，跳过")
    else:
        print(f"杂谈：导入 {talk_imported} 条，跳过 {talk_skipped} 条")


if __name__ == "__main__":
    main()
