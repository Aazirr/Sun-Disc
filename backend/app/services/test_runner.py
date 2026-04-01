from __future__ import annotations

from typing import Any

from app.automation.test_login import run_login_test


def execute_test(test_name: str, payload: dict[str, Any]) -> None:
    if test_name != "login_test":
        raise ValueError(f"Unsupported test_name: {test_name}")

    base_url = str(payload.get("base_url", "")).strip()
    username = str(payload.get("username", "")).strip() or None
    password = str(payload.get("password", "")).strip() or None

    run_login_test(base_url=base_url, username=username, password=password)
