from __future__ import annotations

import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = PROJECT_ROOT / "src"
if str(SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(SRC_ROOT))


def rel(path: str | Path) -> Path:
    resolved = Path(path).expanduser()
    if resolved.is_absolute():
        return resolved.resolve()
    return (PROJECT_ROOT / resolved).resolve()


def ensure_outputs() -> None:
    for name in ("detections", "tracks", "eval", "logs", "reports"):
        (PROJECT_ROOT / "outputs" / name).mkdir(parents=True, exist_ok=True)
