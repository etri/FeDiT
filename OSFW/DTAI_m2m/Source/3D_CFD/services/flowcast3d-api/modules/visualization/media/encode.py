import contextlib
import shutil
import subprocess
from pathlib import Path
from tempfile import TemporaryFile

from PIL import Image

FORMATS = ("mp4", "gif")
CONTENT_TYPES = {"mp4": "video/mp4", "gif": "image/gif"}
CRF = 20
PRESET = "medium"
ENCODER_ENV = "FLOWCAST_VIEWER_FFMPEG"
TAIL = 10

NO_ENCODER = "MP4 encoder (ffmpeg) was not found. Export a GIF or use an image with imageio-ffmpeg installed."
NOT_EXECUTABLE = f"Encoder specified by {ENCODER_ENV} cannot be executed: {{path}}"
NO_H264 = "This ffmpeg has no H.264 encoder (libx264). Export a GIF instead."
ODD_SIZE = "MP4 dimensions must be even: {width}x{height}"
TOO_FEW = "MP4 requires at least 2 frames."
FAILED = "MP4 encoding failed: {error}"


def even(size):
    """yuv420p에 맞춰 2 이상의 짝수로 내림"""
    return max(2, int(size) // 2 * 2)


def encoder(chosen=None):
    """지정 경로, imageio 정적 빌드, PATH 순서로 ffmpeg 선택"""
    chosen = (chosen or "").strip()
    if chosen:
        found = shutil.which(chosen)
        if found is None:
            raise ValueError(NOT_EXECUTABLE.format(path=chosen))
        return found
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except (ImportError, RuntimeError, OSError):
        pass
    found = shutil.which("ffmpeg")
    if found is None:
        raise ValueError(NO_ENCODER)
    return found


def command(path, output, fps, comment=None):
    argv = [
        str(path), "-hide_banner", "-loglevel", "error", "-y",
        "-f", "image2pipe", "-framerate", f"{float(fps):.6f}", "-i", "-",
        "-an", "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF), "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
    ]  # fmt: skip
    if comment:
        argv += ["-metadata", f"comment={comment}"]
    return [*argv, str(output)]


def write_mp4(frames, output, fps, comment=None, path=None):
    """PNG를 한 장씩 전송하며 실패한 출력 파일은 삭제"""
    frames = [Path(frame) for frame in frames]
    if len(frames) < 2:
        raise ValueError(TOO_FEW)
    with Image.open(frames[0]) as first:
        width, height = first.size
    if width % 2 or height % 2:
        raise ValueError(ODD_SIZE.format(width=width, height=height))
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    argv = command(path or encoder(), output, fps, comment)
    with TemporaryFile("w+", encoding="utf-8", errors="replace") as log:
        process = subprocess.Popen(argv, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=log)
        try:
            for frame in frames:
                process.stdin.write(frame.read_bytes())
        except OSError:  # 먼저 종료된 인코더의 오류는 저장한 출력으로 보고
            pass
        finally:
            with contextlib.suppress(OSError):
                process.stdin.close()
            code = process.wait()
        log.seek(0)
        message = log.read().strip()
    if code:
        output.unlink(missing_ok=True)
        # 실행 오류와 코덱 미설치를 구분하여 안내
        if "Unknown encoder" in message and "libx264" in message:
            raise ValueError(NO_H264)
        raise ValueError(FAILED.format(error="\n".join(message.splitlines()[-TAIL:]) or f"exit code {code}"))
    return output
