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
                created_at TEXT NOT NULL,
                started_at TEXT,
                finished_at TEXT,
                duration_ms INTEGER,
                error_message TEXT,
                screenshot_path TEXT
            )
            """
        )

        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(test_runs)").fetchall()
        }

        migration_columns = {
            "started_at": "TEXT",
            "finished_at": "TEXT",
            "duration_ms": "INTEGER",
            "error_message": "TEXT",
            "screenshot_path": "TEXT",
        }

        for column_name, column_type in migration_columns.items():
            if column_name not in columns:
                connection.execute(
                    f"ALTER TABLE test_runs ADD COLUMN {column_name} {column_type}"
                )


def _serialize_row(row: sqlite3.Row | None) -> dict[str, Any]:
    if row is None:
        raise RuntimeError("Run row not found")
    return dict(row)


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
            SELECT id, test_name, status, base_url, environment, created_at,
                     started_at, finished_at, duration_ms, error_message, screenshot_path
            FROM test_runs
            WHERE id = ?
            """,
            (run_id,),
        ).fetchone()

    return _serialize_row(row)


def update_run_status(
    run_id: int,
    status: str,
    error_message: str | None = None,
    screenshot_path: str | None = None,
) -> dict[str, Any]:
    with _get_connection() as connection:
        if status == "RUNNING":
            connection.execute(
                """
                UPDATE test_runs
                SET status = ?, started_at = datetime('now'), finished_at = NULL,
                    duration_ms = NULL, error_message = NULL, screenshot_path = NULL
                WHERE id = ?
                """,
                (status, run_id),
            )
        else:
            connection.execute(
                """
                UPDATE test_runs
                SET status = ?, finished_at = datetime('now'),
                    duration_ms = CAST((julianday(datetime('now')) - julianday(started_at)) * 86400000 AS INTEGER),
                    error_message = ?,
                    screenshot_path = ?
                WHERE id = ?
                """,
                (status, error_message, screenshot_path, run_id),
            )

        row = connection.execute(
            """
            SELECT id, test_name, status, base_url, environment, created_at,
                     started_at, finished_at, duration_ms, error_message, screenshot_path
            FROM test_runs
            WHERE id = ?
            """,
            (run_id,),
        ).fetchone()

    return _serialize_row(row)


def list_test_runs() -> list[dict[str, Any]]:
    with _get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, test_name, status, base_url, environment, created_at,
                   started_at, finished_at, duration_ms, error_message, screenshot_path
            FROM test_runs
            ORDER BY id DESC
            """
        ).fetchall()

    return [dict(row) for row in rows]


def get_test_run(run_id: int) -> dict[str, Any] | None:
    with _get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, test_name, status, base_url, environment, created_at,
                   started_at, finished_at, duration_ms, error_message, screenshot_path
            FROM test_runs
            WHERE id = ?
            """,
            (run_id,),
        ).fetchone()

    return dict(row) if row is not None else None
