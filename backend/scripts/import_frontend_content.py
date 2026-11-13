"""把前端示例内容导入 SQLite。

用法（在 backend/ 目录下）：
    .venv/Scripts/python.exe scripts/import_frontend_content.py

- 读取 ``app/data/photo_albums.json``、``projects.json``、``friend_links.json``、
  ``music_tracks.json``、``moments.json``；
- 已存在的记录会跳过，因此脚本可以重复运行；
- 不删除、不修改原始 JSON 文件。

相册照片在数据库里是独立子表，导入时为每张照片生成新的 UUID，
避免不同相册复用同一张示例图时主键冲突。
"""

from __future__ import annotations

import json
import sys
from datetime import date, datetime
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import OperationalError

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import get_settings  # noqa: E402
from app.db.models import (  # noqa: E402
    FriendLink,
    Moment,
    MusicTrack,
    PhotoAlbum,
    PhotoItem,
    Project,
)
from app.db.session import SessionLocal  # noqa: E402


def load_rows(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as fp:
        return json.load(fp)


def import_albums(session, rows: list[dict]) -> tuple[int, int]:
    imported = skipped = 0

    for index, row in enumerate(rows):
        slug = row["slug"]
        if session.scalar(select(PhotoAlbum).where(PhotoAlbum.slug == slug)) is not None:
            skipped += 1
            continue

        album = PhotoAlbum(
            id=row.get("id") or uuid4().hex,
            slug=slug,
            title=row["title"],
            description=row.get("description", ""),
            created_at=date.fromisoformat(row["created_at"]),
            status="published",
            sort_order=index,
            updated_at=datetime.now(),
        )
        album.photos = [
            PhotoItem(
                id=uuid4().hex,
                src=photo["src"],
                alt=photo.get("alt", ""),
                title=photo.get("title", ""),
                width=int(photo["width"]),
                height=int(photo["height"]),
                sort_order=photo_index,
            )
            for photo_index, photo in enumerate(row.get("photos", []))
        ]
        session.add(album)
        imported += 1

    return imported, skipped


def import_projects(session, rows: list[dict]) -> tuple[int, int]:
    imported = skipped = 0

    for index, row in enumerate(rows):
        project_id = row.get("id") or uuid4().hex
        if session.get(Project, project_id) is not None:
            skipped += 1
            continue

        now = datetime.now()
        session.add(
            Project(
                id=project_id,
                title=row["title"],
                readme_title=row.get("readme_title", ""),
                tech_stack=row.get("tech_stack", []),
                repo_url=row["repo_url"],
                emoji=row.get("emoji", ""),
                status="published",
                sort_order=index,
                created_at=now,
                updated_at=now,
            )
        )
        imported += 1

    return imported, skipped


def import_friend_links(session, rows: list[dict]) -> tuple[int, int]:
    imported = skipped = 0

    for index, row in enumerate(rows):
        link_id = row.get("id") or uuid4().hex
        if session.get(FriendLink, link_id) is not None:
            skipped += 1
            continue

        now = datetime.now()
        session.add(
            FriendLink(
                id=link_id,
                name=row["name"],
                avatar=row["avatar"],
                bio=row.get("bio", ""),
                href=row["href"],
                status="published",
                sort_order=index,
                created_at=now,
                updated_at=now,
            )
        )
        imported += 1

    return imported, skipped


def import_music_tracks(session, rows: list[dict]) -> tuple[int, int]:
    imported = skipped = 0

    for index, row in enumerate(rows):
        track_id = row.get("id") or uuid4().hex
        if session.get(MusicTrack, track_id) is not None:
            skipped += 1
            continue

        now = datetime.now()
        session.add(
            MusicTrack(
                id=track_id,
                title=row["title"],
                artist=row["artist"],
                duration=float(row["duration"]),
                cover=row["cover"],
                audio_url=row.get("audio_url"),
                lyrics=row.get("lyrics", []),
                status="published",
                sort_order=index,
                created_at=now,
                updated_at=now,
            )
        )
        imported += 1

    return imported, skipped


def import_moments(session, rows: list[dict]) -> tuple[int, int]:
    imported = skipped = 0

    for row in rows:
        moment_id = row.get("id") or uuid4().hex
        if session.get(Moment, moment_id) is not None:
            skipped += 1
            continue

        now = datetime.now()
        session.add(
            Moment(
                id=moment_id,
                content=row["content"],
                images=row.get("images", []),
                location=row.get("location", {}),
                status="published",
                published_at=datetime.fromisoformat(row["published_at"]),
                created_at=now,
                updated_at=now,
            )
        )
        imported += 1

    return imported, skipped



def main() -> None:
    settings = get_settings()
    albums = load_rows(settings.data_dir / "photo_albums.json")
    projects = load_rows(settings.data_dir / "projects.json")
    links = load_rows(settings.data_dir / "friend_links.json")
    tracks = load_rows(settings.data_dir / "music_tracks.json")
    moments = load_rows(settings.data_dir / "moments.json")

    with SessionLocal() as session:
        try:
            session.scalar(select(PhotoAlbum).limit(1))
        except OperationalError as exc:
            raise SystemExit(
                "数据库表不存在。请先在 backend/ 目录运行：\n"
                "    .venv/Scripts/alembic upgrade head"
            ) from exc

        album_imported, album_skipped = import_albums(session, albums)
        project_imported, project_skipped = import_projects(session, projects)
        link_imported, link_skipped = import_friend_links(session, links)
        track_imported, track_skipped = import_music_tracks(session, tracks)
        moment_imported, moment_skipped = import_moments(session, moments)
        session.commit()

    print(f"照片集：导入 {album_imported} 个，跳过 {album_skipped} 个")
    print(f"项目：导入 {project_imported} 个，跳过 {project_skipped} 个")
    print(f"友链：导入 {link_imported} 条，跳过 {link_skipped} 条")
    print(f"音乐：导入 {track_imported} 首，跳过 {track_skipped} 首")
    print(f"生活动态：导入 {moment_imported} 条，跳过 {moment_skipped} 条")


if __name__ == "__main__":
    main()
