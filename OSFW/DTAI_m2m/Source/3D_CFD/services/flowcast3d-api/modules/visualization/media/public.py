from __future__ import annotations

import json
import math
from contextlib import nullcontext
from dataclasses import dataclass
from pathlib import Path
from tempfile import TemporaryDirectory

CONTENT_TYPES = {"png": "image/png", "gif": "image/gif", "mp4": "video/mp4"}
MAX_ANIMATION_PIXELS = 96_000_000
MAX_FRAME_BYTES = 384 * 1024 * 1024
MAX_MEDIA_BYTES = 20 * 1024 * 1024
WORKSPACE_KEY = "_animation_workspace"


@dataclass(frozen=True)
class RenderWorkspace:
    """HTTP 부모가 생성해 Python IPC로만 전달하는 요청 디렉터리"""

    directory: Path


def media_options(request):
    """작업 프로세스에서도 출력 형식과 프레임 예산을 검증"""
    options = {
        "format": request.get("format", "png"),
        "fps": request.get("fps", 12),
        "frames": request.get("frames", 24),
        "animation": request.get("animation", "orbit"),
    }
    if not isinstance(options["format"], str) or options["format"] not in CONTENT_TYPES:
        raise ValueError("Visualization format must be png, gif, or mp4.")
    if type(options["fps"]) is not int or not 1 <= options["fps"] <= 30:
        raise ValueError("Animation fps must be an integer from 1 to 30.")
    if type(options["frames"]) is not int or not 2 <= options["frames"] <= 120:
        raise ValueError("Animation frames must be an integer from 2 to 120.")
    if options["animation"] != "orbit":
        raise ValueError("Only camera orbit animation is supported.")
    if options["format"] != "png":
        width, height = request.get("width", 1280), request.get("height", 720)
        if type(width) is not int or type(height) is not int or min(width, height) < 1:
            raise ValueError("Animation dimensions must be positive integers.")
        if width * height * options["frames"] > MAX_ANIMATION_PIXELS:
            raise ValueError(
                "Animation exceeds the 96-million-pixel frame budget. Reduce dimensions or frames."
            )
        if options["format"] == "mp4" and (width % 2 or height % 2):
            raise ValueError("MP4 dimensions must be even.")
    return options


class _LimitedWriter:
    def __init__(self, stream):
        self.stream = stream

    def write(self, data):
        if self.stream.tell() + len(data) > MAX_MEDIA_BYTES:
            raise ValueError("Visualization output exceeds the 20 MiB limit. Reduce dimensions or frames.")
        return self.stream.write(data)


def _write_gif(frames, output, fps):
    """한 장씩 양자화해 전체 프레임을 메모리에 모으지 않고 GIF 기록"""
    from PIL import GifImagePlugin, Image

    with output.open("wb") as stream:
        writer = _LimitedWriter(stream)
        for index, path in enumerate(frames):
            with Image.open(path) as source:
                with source.convert("RGB") as rgb:
                    with rgb.quantize(colors=256) as image:
                        if index == 0:
                            header, _ = GifImagePlugin.getheader(image, info={"loop": 0})
                            for block in header:
                                writer.write(block)
                        # GIF의 10ms 단위에 맞춰 누적 재생 시간 오차를 분산
                        duration = 10 * (round((index + 1) * 100 / fps) - round(index * 100 / fps))
                        blocks = GifImagePlugin.getdata(
                            image, duration=duration, disposal=2, include_color_table=index > 0
                        )
                        for block in blocks:
                            writer.write(block)
        writer.write(b";")


def orbit_media(plotter, options, *, workspace=None):
    """하나의 예측 장면을 Z축 주위로 회전하며 임시 프레임에서 영상 생성"""
    from PIL import Image

    media_options(options)
    position, focal, up = (tuple(value) for value in plotter.camera_position)
    offset = tuple(a - b for a, b in zip(position, focal))
    # 장면 외접구가 회전 중에도 화면 안에 들도록 카메라 거리를 확보
    bounds = plotter.bounds
    radius = math.sqrt(sum((bounds[index + 1] - bounds[index]) ** 2 for index in (0, 2, 4))) / 2
    vertical = math.radians(plotter.camera.view_angle) / 2
    horizontal = math.atan(math.tan(vertical) * options["width"] / options["height"])
    distance = math.sqrt(sum(value * value for value in offset))
    required = radius * 1.08 / max(1e-6, math.sin(min(vertical, horizontal)))
    if distance > 0 and required > distance:
        offset = tuple(value * required / distance for value in offset)
    if workspace is not None and not isinstance(workspace, RenderWorkspace):
        raise ValueError("Animation workspace must be supplied by the render worker.")
    # 관리 요청은 부모가 회수하고 직접 실행은 기존 임시 디렉터리를 사용
    managed = (
        TemporaryDirectory(prefix="flowcast-public-orbit-")
        if workspace is None
        else nullcontext(workspace.directory)
    )
    with managed as temporary:
        directory = Path(temporary)
        if directory.is_symlink() or not directory.is_dir():
            raise ValueError("Animation workspace must be an existing regular directory.")
        frames, total = [], 0
        for index in range(options["frames"]):
            angle = math.tau * index / options["frames"]
            x = offset[0] * math.cos(angle) - offset[1] * math.sin(angle)
            y = offset[0] * math.sin(angle) + offset[1] * math.cos(angle)
            plotter.camera_position = ([focal[0] + x, focal[1] + y, focal[2] + offset[2]], focal, up)
            plotter.reset_camera_clipping_range()
            plotter.render()
            image = plotter.screenshot(return_img=True)
            path = directory / f"frame-{index:03d}.png"
            with Image.fromarray(image) as picture:
                picture.save(path, format="PNG")
            del image
            total += path.stat().st_size
            if total > MAX_FRAME_BYTES:
                raise ValueError("Animation frames exceed the 384 MiB temporary storage limit.")
            frames.append(path)
        output = directory / f"orbit.{options['format']}"
        if options["format"] == "gif":
            _write_gif(frames, output, options["fps"])
        else:
            from modules.visualization.media.encode import write_mp4

            write_mp4(
                frames,
                output,
                options["fps"],
                comment=json.dumps(
                    {
                        "animation": "orbit",
                        "static_prediction": True,
                        "frames": options["frames"],
                    }
                ),
            )
        if not output.is_file() or output.stat().st_size == 0:
            raise RuntimeError("Animation encoder produced no output.")
        if output.stat().st_size > MAX_MEDIA_BYTES:
            raise ValueError("Visualization output exceeds the 20 MiB limit. Reduce dimensions or frames.")
        return output.read_bytes()
