"""创建文章与杂谈表

Revision ID: 0001
Revises:
Create Date: 2026-11-13

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _content_columns(*, with_mood: bool) -> list[sa.Column]:
    columns = [
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=False),
        sa.Column("cover", sa.String(length=500), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("reading_minutes", sa.Integer(), nullable=False),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    ]
    if with_mood:
        columns.append(sa.Column("mood", sa.String(length=100), nullable=False))
    return columns


def upgrade() -> None:
    op.create_table(
        "posts",
        *_content_columns(with_mood=False),
        sa.Column("featured", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("status IN ('draft', 'published')", name="ck_posts_status"),
    )
    op.create_index(op.f("ix_posts_slug"), "posts", ["slug"], unique=True)
    op.create_index(op.f("ix_posts_status"), "posts", ["status"], unique=False)

    op.create_table(
        "talks",
        *_content_columns(with_mood=True),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("status IN ('draft', 'published')", name="ck_talks_status"),
    )
    op.create_index(op.f("ix_talks_slug"), "talks", ["slug"], unique=True)
    op.create_index(op.f("ix_talks_status"), "talks", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_talks_status"), table_name="talks")
    op.drop_index(op.f("ix_talks_slug"), table_name="talks")
    op.drop_table("talks")

    op.drop_index(op.f("ix_posts_status"), table_name="posts")
    op.drop_index(op.f("ix_posts_slug"), table_name="posts")
    op.drop_table("posts")
