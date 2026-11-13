"""创建音乐曲目表

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-13

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "music_tracks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("artist", sa.String(length=300), nullable=False),
        sa.Column("duration", sa.Float(), nullable=False),
        sa.Column("cover", sa.String(length=500), nullable=False),
        sa.Column("audio_url", sa.String(length=500), nullable=True),
        sa.Column("lyrics", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "status IN ('draft', 'published')",
            name="ck_music_tracks_status",
        ),
    )
    op.create_index(
        op.f("ix_music_tracks_status"),
        "music_tracks",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_music_tracks_status"), table_name="music_tracks")
    op.drop_table("music_tracks")
