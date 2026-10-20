"""공개 요청 본문을 제한하고 업로드를 요청 파일에 직접 기록"""

import asyncio
import json
import time
import unicodedata
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from starlette.datastructures import UploadFile
from starlette.formparsers import MultiPartException, MultiPartParser
from starlette.requests import ClientDisconnect

from modules.api.shared.parsing import finite_json
from modules.domain.errors import ApiError
from modules.domain.schemas.prediction import GeometryOptions, Wind

MAX_FORM_BYTES = 64 * 1024
SUFFIXES = {".obj", ".stl", ".vtk", ".vti", ".vtu", ".vtp", ".vtr", ".vts", ".npz"}


def validation_error(error):
    return RequestValidationError([{**item, "loc": ("body", *item["loc"])} for item in error.errors()])


def model_request(model, value):
    if value is None:
        raise RequestValidationError([{"type": "missing", "loc": ("body",), "msg": "Field required"}])
    try:
        return model.model_validate(value, from_attributes=True)
    except ValidationError as error:
        raise validation_error(error) from None


async def body_stream(request, maximum):
    """선언된 크기와 실제 전송 크기를 모두 제한"""
    length = request.headers.get("content-length")
    if length is not None:
        if not length.isascii() or not length.isdecimal():
            raise ApiError(422, "Content-Length must be a nonnegative integer.")
        if int(length) > maximum:
            raise ApiError(413, "Request body exceeds the size limit.")
    received = 0
    try:
        async for block in request.stream():
            received += len(block)
            if received > maximum:
                raise ApiError(413, "Request body exceeds the size limit.")
            yield block
    except ClientDisconnect:
        raise ApiError(422, "Request body is incomplete.") from None
    if length is not None and received != int(length):
        raise ApiError(422, "Request body length does not match Content-Length.")


async def json_body(request, maximum):
    raw = bytearray()
    async for block in body_stream(request, maximum):
        raw.extend(block)
    if not raw:
        return None
    try:
        return finite_json(bytes(raw))
    except json.JSONDecodeError as error:
        raise RequestValidationError(
            [
                {
                    "type": "json_invalid",
                    "loc": ("body", error.pos),
                    "msg": "JSON decode error",
                }
            ]
        ) from None
    except (UnicodeError, RecursionError):
        raise ApiError(400, "There was an error parsing the body") from None
    except ValueError:
        raise RequestValidationError(
            [
                {
                    "type": "json_invalid",
                    "loc": ("body",),
                    "msg": "JSON decode error",
                }
            ]
        ) from None


def upload_suffix(filename):
    if (
        not filename
        or len(filename) > 120
        or "/" in filename
        or "\\" in filename
        or any(unicodedata.category(char).startswith("C") for char in filename)
    ):
        raise ApiError(422, "Upload filename must be a plain filename of at most 120 characters.")
    suffix = Path(filename).suffix.lower()
    if suffix not in SUFFIXES:
        raise ApiError(422, "Unsupported geometry format. Use OBJ, STL, VTK, or NPZ.")
    return suffix


class DirectMultipartParser(MultiPartParser):
    """업로드 원본을 복사 없이 요청 디렉터리에 기록"""

    def __init__(self, *args, directory, maximum, **kwargs):
        super().__init__(*args, **kwargs)
        self.directory, self.maximum = directory, maximum
        self.path = None
        self.complete = False
        self.file_bytes = self.form_bytes = 0

    def on_headers_finished(self):
        super().on_headers_finished()
        part = self._current_part
        if part.file is not None:
            if part.field_name != "file":
                raise ApiError(422, "Geometry upload requires one file field.")
            suffix = upload_suffix(part.file.filename)
            part.file.file.close()
            self.path = self.directory / f"source{suffix}"
            stream = self.path.open("xb+")
            self._files_to_close_on_error.append(stream)
            part.file = UploadFile(stream, size=0, filename=part.file.filename, headers=part.file.headers)

    def on_part_data(self, data, start, end):
        if self._current_part.file is not None:
            self.file_bytes += end - start
            if self.file_bytes > self.maximum:
                raise ApiError(413, "Geometry upload exceeds the file size limit.")
        else:
            self.form_bytes += end - start
            if self.form_bytes > MAX_FORM_BYTES:
                raise ApiError(413, "Geometry upload options exceed the size limit.")
        super().on_part_data(data, start, end)

    def on_end(self):
        self.complete = True
        super().on_end()


@asynccontextmanager
async def geometry_upload(request, directory, maximum):
    parser = DirectMultipartParser(
        request.headers,
        body_stream(request, maximum + MAX_FORM_BYTES),
        directory=directory,
        maximum=maximum,
        max_files=1,
        max_fields=2,
        max_part_size=MAX_FORM_BYTES,
    )
    form = None
    try:
        try:
            form = await parser.parse()
        except ApiError:
            raise
        except (MultiPartException, ValueError, UnicodeError, ClientDisconnect):
            raise ApiError(422, "Geometry multipart body is invalid or incomplete.") from None
        if not parser.complete:
            raise ApiError(422, "Geometry multipart body is incomplete.")
        pairs = form.multi_items()
        keys = [key for key, _ in pairs]
        if len(keys) != len(set(keys)) or set(keys) - {"file", "wind", "options"}:
            raise ApiError(422, "Geometry upload contains duplicate or unsupported fields.")
        file = form.get("file")
        if not isinstance(file, UploadFile) or not file.size or parser.path is None:
            raise ApiError(422, "Geometry upload requires one nonempty file.")
        fields = {}
        for key, default in (("wind", None), ("options", "{}")):
            text = form.get(key, default)
            if not isinstance(text, str):
                raise ApiError(422, f"Geometry upload requires a JSON {key} text field.")
            try:
                fields[key] = finite_json(text)
            except (ValueError, UnicodeError, RecursionError):
                raise ApiError(422, f"Geometry {key} must contain valid finite JSON.") from None
        wind = model_request(Wind, fields["wind"])
        options = model_request(GeometryOptions, fields["options"])
        await file.seek(0)
        file.file.flush()
        yield parser.path, wind, options
    finally:
        try:
            if form is not None:
                await form.close()
        finally:
            for stream in parser._files_to_close_on_error:
                stream.close()


async def run_operation(request, operation, function, *args):
    """연결 종료와 제한 시간을 감시하며 작업 파일의 수명 보장"""
    from starlette.concurrency import run_in_threadpool

    task = asyncio.create_task(run_in_threadpool(function, *args))

    async def drain():
        # 취소가 반복되어도 작업 파일은 실제 계산이 멈춘 뒤 회수
        while True:
            try:
                await asyncio.shield(task)
                return
            except asyncio.CancelledError:
                if task.done():
                    return
            except Exception:
                return

    try:
        while not task.done():
            if time.monotonic() >= operation.deadline:
                operation.cancel()
                await drain()
                raise ApiError(504, "Prediction request timed out.")
            if await request.is_disconnected():
                operation.cancel()
                await drain()
                raise ApiError(499, "Request was cancelled by the client.")
            await asyncio.wait({task}, timeout=0.1)
        return await task
    except asyncio.CancelledError:
        operation.cancel()
        await drain()
        raise
