"""生成管理员密码哈希与随机会话密钥。

用法（在 backend/ 目录下）：
    .venv/Scripts/python.exe scripts/hash_password.py

把输出的两行写进 backend/.env，然后重启后端。
"""

from __future__ import annotations

import secrets
import sys
from getpass import getpass
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.core.security import hash_password  # noqa: E402


def main() -> None:
    password = getpass("管理员密码: ")
    confirmation = getpass("再次输入: ")

    if password != confirmation:
        raise SystemExit("两次输入的密码不一致")
    if len(password) < 8:
        raise SystemExit("密码至少需要 8 个字符")

    print()
    print("把下面两行加入 backend/.env：")
    print(f"BLOG_ADMIN_PASSWORD_HASH={hash_password(password)}")
    print(f"BLOG_SESSION_SECRET={secrets.token_urlsafe(48)}")


if __name__ == "__main__":
    main()
