import os
from dataclasses import dataclass
from pathlib import Path

from modules.settings.validation import env_port


def path_component(kind, value):
    if value in ("", ".", "..") or "/" in value or "\0" in value:
        raise ValueError(f"invalid {kind} {value!r}")
    return value


@dataclass(frozen=True)
class RenderSettings:
    data_dir: Path
    api_url: str
    cache_mb: int
    # 상한을 넘으면 stride 샘플링
    max_cells: int
    mesh_mb: int
    ffmpeg: str = ""

    @classmethod
    def from_env(cls, env=None):
        env = os.environ if env is None else env
        return cls(
            data_dir=Path(env.get("FLOWCAST_DATA_DIR", "/data")),
            api_url=(
                env.get("FLOWCAST_API_URL")
                or f"http://127.0.0.1:{env_port('FLOWCAST_MANAGEMENT_PORT', 8082, env)}/v1"
            ).rstrip("/"),
            cache_mb=int(env.get("FLOWCAST_VIEWER_CACHE_MB", "1024")),
            max_cells=int(env.get("FLOWCAST_VIEWER_MAX_CELLS", "2000000")),
            mesh_mb=int(env.get("FLOWCAST_VIEWER_MESH_MB", "8192")),
            ffmpeg=(env.get("FLOWCAST_VIEWER_FFMPEG") or "").strip(),
        )

    def case_dir(self, case_id):
        return self.data_dir / "cases" / path_component("case id", case_id)
