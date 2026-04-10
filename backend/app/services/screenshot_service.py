from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from selenium.webdriver import Chrome


def _get_data_dir() -> Path:
    data_dir_env = os.getenv("DATA_DIR")
    if data_dir_env:
        return Path(data_dir_env)

    if os.getenv("VERCEL"):
        return Path("/tmp")

    return Path(__file__).resolve().parents[2]


SCREENSHOT_DIR = _get_data_dir() / "storage" / "screenshots"


def ensure_screenshot_dir() -> Path:
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    return SCREENSHOT_DIR


def save_failure_screenshot(driver: Chrome, run_id: int) -> Optional[str]:
    screenshot_dir = ensure_screenshot_dir()
    screenshot_file = screenshot_dir / f"run_{run_id}.png"

    success = driver.save_screenshot(str(screenshot_file))
    if not success:
        return None

    return str(screenshot_file.resolve())
