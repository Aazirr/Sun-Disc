import sqlite3
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parents[2] / "sun_disc.db"


def _get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_run_store() -> None:
    with _get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS test_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                test_name TEXT NOT NULL,
                status TEXT NOT NULL,
                base_url TEXT,
                environment TEXT,
                created_at TEXT NOT NULL
            )
            """
        )


def create_test_run(payload: dict[str, Any]) -> dict[str, Any]:
    test_name = str(payload.get("test_name", "")).strip()
    if not test_name:
        raise ValueError("test_name is required")

    base_url = str(payload.get("base_url", "")).strip() or None
    environment = str(payload.get("environment", "")).strip() or None

    with _get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO test_runs (test_name, status, base_url, environment, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            """,
            (test_name, "QUEUED", base_url, environment),
        )
        run_id = cursor.lastrowid

        row = connection.execute(
            """
            SELECT id, test_name, status, base_url, environment, created_at
            FROM test_runs
            WHERE id = ?
            """,
            (run_id,),
        ).fetchone()

    if row is None:
        raise RuntimeError("Could not load created run")

    return dict(row)


def list_test_runs() -> list[dict[str, Any]]:
    with _get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, test_name, status, base_url, environment, created_at
            FROM test_runs
            ORDER BY id DESC
            """
        ).fetchall()

    return [dict(row) for row in rows]
