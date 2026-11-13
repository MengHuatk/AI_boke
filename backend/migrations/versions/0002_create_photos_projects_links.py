"""创建照片集、项目与友链表

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-13

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "photo_albums",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("created_at", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "status IN ('draft', 'published')",
            name="ck_photo_albums_status",
        ),
    )
    op.create_index(
        op.f("ix_photo_albums_slug"),
        "photo_albums",
        ["slug"],
        unique=True,
    )
    op.create_index(
        op.f("ix_photo_albums_status"),
        "photo_albums",
        ["status"],
        unique=False,
    )

    op.create_table(
        "photo_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("album_id", sa.String(length=36), nullable=False),
        sa.Column("src", sa.String(length=500), nullable=False),
        sa.Column("alt", sa.String(length=300), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["album_id"],
            ["photo_albums.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_photo_items_album_id"),
        "photo_items",
        ["album_id"],
        unique=False,
    )

    op.create_table(
        "projects",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("readme_title", sa.String(length=300), nullable=False),
        sa.Column("tech_stack", sa.JSON(), nullable=False),
        sa.Column("repo_url", sa.String(length=500), nullable=False),
        sa.Column("emoji", sa.String(length=8), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("status IN ('draft', 'published')", name="ck_projects_status"),
    )
    op.create_index(op.f("ix_projects_status"), "projects", ["status"], unique=False)

    op.create_table(
        "friend_links",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=300), nullable=False),
        sa.Column("avatar", sa.String(length=500), nullable=False),
        sa.Column("bio", sa.Text(), nullable=False),
        sa.Column("href", sa.String(length=500), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "status IN ('draft', 'published')",
            name="ck_friend_links_status",
        ),
    )
    op.create_index(
        op.f("ix_friend_links_status"),
        "friend_links",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_friend_links_status"), table_name="friend_links")
    op.drop_table("friend_links")

    op.drop_index(op.f("ix_projects_status"), table_name="projects")
    op.drop_table("projects")

    op.drop_index(op.f("ix_photo_items_album_id"), table_name="photo_items")
    op.drop_table("photo_items")

    op.drop_index(op.f("ix_photo_albums_status"), table_name="photo_albums")
    op.drop_index(op.f("ix_photo_albums_slug"), table_name="photo_albums")
    op.drop_table("photo_albums")
