import asyncio
import time

from fastapi import APIRouter, Request, Response

from modules.api.shared.dependencies import request_workflow
from modules.api.shared.parsing import inline_schema
from modules.api.shared.requests import json_body, model_request, run_operation
from modules.domain.errors import ApiError
from modules.domain.schemas.prediction import CONTENT_TYPES, VisualizeRequest

router = APIRouter()


@router.post(
    "/visualize",
    responses={200: {"content": {mime: {} for mime in CONTENT_TYPES.values()}}},
    response_class=Response,
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {"schema": inline_schema(VisualizeRequest)},
            },
        },
    },
)
async def visualize(request: Request):
    """공통 예측 결과만으로 이미지 또는 카메라 회전 영상 반환"""
    workflow = request_workflow(request)
    settings = workflow.settings
    operation = workflow.operation(time.monotonic() + settings.request_timeout)
    try:
        async with asyncio.timeout(settings.request_timeout):
            content_type = (
                request.headers.get("content-type", "application/json").split(";", 1)[0].strip().lower()
            )
            if content_type != "application/json":
                raise ApiError(415, "Visualization Content-Type must be application/json.")
            body = model_request(VisualizeRequest, await json_body(request, settings.max_json_bytes))
            image = await run_operation(request, operation, operation.visualize, body)
        return Response(
            content=image,
            media_type=CONTENT_TYPES[body.format],
            headers={
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
                "Content-Disposition": f'inline; filename="prediction.{body.format}"',
            },
        )
    except TimeoutError:
        operation.cancel()
        raise ApiError(504, "Visualization request timed out.") from None
    finally:
        operation.close()
