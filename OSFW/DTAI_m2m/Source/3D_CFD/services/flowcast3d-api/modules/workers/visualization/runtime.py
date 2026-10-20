from __future__ import annotations

import json
import signal
import sys
import time
from pathlib import Path

from modules.settings.rendering import RenderSettings as Settings

SERVICE_DIR = Path(__file__).resolve().parents[3]


def command(*arguments) -> list[str]:
    """단일 진입점의 절대 경로와 명령 인자 생성"""
    return [sys.executable, str(SERVICE_DIR / "main.py"), *map(str, arguments)]


def render_server(args):
    """내부 PNG HTTP 서버 실행"""
    from modules.workers.visualization.server import serve

    serve()


def reporter(**fixed):
    """단계 완료 또는 0.5초마다 JSON 한 줄로 진행률 출력"""
    last = {"time": 0.0}

    def report(*progress):
        *stage, done, total = progress
        if done >= total or time.monotonic() - last["time"] > 0.5:
            last["time"] = time.monotonic()
            print(
                json.dumps({**fixed, **({"stage": stage[0]} if stage else {}), "done": done, "total": total}),
                flush=True,
            )

    return report


def load_case(case_dir):
    from modules.domain.schemas import Case
    from modules.infrastructure.mongo.assets import mongo_enabled

    if mongo_enabled():
        from modules.visualization.readers.adapter import DataAdapter

        adapter = DataAdapter(Settings.from_env())
        try:
            return adapter.case(case_dir.name)
        finally:
            adapter.close()

    return Case.model_validate(json.loads((case_dir / "case.json").read_text()))


def prepare_mesh(args):
    import resource

    from modules.infrastructure.mongo.assets import case_directory, mongo_enabled
    from modules.visualization.geometry import citymesh, citytexture

    case_dir = Path(args.case_dir).resolve()
    case = load_case(case_dir)
    if mongo_enabled():
        case_dir = case_directory(Settings.from_env(), case)
    module = citytexture if args.textures else citymesh
    index = module.prepare(case_dir, case, workers=args.workers, progress=reporter(state="running"))
    summary = {
        "state": "done",
        "tiles": len(index["tiles"]),
        "faces_per_level": citymesh.CityMesh(case_dir, index).faces,
        "timings": index["timings"],
        "peak_rss_mb": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss // 1024,
    }
    if args.textures:
        summary.update(texture_texels=index["texture_texels"], covered_texels=index["covered_texels"])
    print(json.dumps(summary), flush=True)


def render(args):
    from modules.visualization.rendering.publication import render_publication

    print(json.dumps(render_publication(args), ensure_ascii=False), flush=True)


def terminate(number, frame):
    """SIGTERM에도 with 블록을 정리하도록 SystemExit 발생"""
    raise SystemExit(128 + number)


def animate(args):
    from modules.visualization.media.animation import render_animation

    signal.signal(signal.SIGTERM, terminate)
    paths = render_animation(args, progress=reporter(state="running") if args.progress else None)
    print(json.dumps({"state": "done", **paths} if args.progress else paths, ensure_ascii=False), flush=True)
