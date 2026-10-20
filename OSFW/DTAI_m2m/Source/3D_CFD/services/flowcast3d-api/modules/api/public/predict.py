import asyncio
import time

from fastapi import APIRouter, Request

from modules.api.shared.dependencies import request_workflow
from modules.api.shared.parsing import inline_schema
from modules.api.shared.requests import geometry_upload, json_body, model_request, run_operation
from modules.api.shared.responses import OwnedJSONResponse
from modules.domain.errors import ApiError
from modules.domain.schemas.prediction import PredictionResult, PredictRequest

router = APIRouter()
PredictResponse = PredictionResult


@router.post(
    "/predict",
    response_model=PredictResponse,
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {"schema": inline_schema(PredictRequest)},
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["file", "wind"],
                        "properties": {
                            "file": {
                                "type": "string",
                                "format": "binary",
                                "description": "Building geometry: OBJ, STL, VTK, or NPZ",
                            },
                            "wind": {
                                "type": "string",
                                "description": 'JSON object: {"speed":5,"direction":270}',
                            },
                            "options": {
                                "type": "string",
                                "default": "{}",
                                "description": "Geometry options as a JSON object",
                            },
                        },
                    }
                },
            },
        },
    },
)
async def predict(request: Request):
    """요청 건물 배열 또는 형상 파일에서 동일한 풍장 JSON 반환"""
    workflow = request_workflow(request)
    settings = workflow.settings
    deadline = time.monotonic() + settings.request_timeout
    operation = workflow.operation(deadline)
    try:
        async with asyncio.timeout(settings.request_timeout):
            content_type = (
                request.headers.get("content-type", "application/json").split(";", 1)[0].strip().lower()
            )
            if content_type == "multipart/form-data":
                async with geometry_upload(request, operation.directory, settings.max_upload_bytes) as values:
                    source, wind, options = values
                    path = await run_operation(
                        request,
                        operation,
                        operation.predict,
                        source,
                        "file",
                        wind.model_dump(),
                        options.model_dump(mode="json", exclude_unset=True),
                    )
            elif content_type == "application/json":
                body = model_request(PredictRequest, await json_body(request, settings.max_json_bytes))
                path = await run_operation(request, operation, operation.predict_json, body)
            else:
                raise ApiError(
                    415, "Prediction Content-Type must be application/json or multipart/form-data."
                )
        return OwnedJSONResponse(path, operation)
    except TimeoutError:
        operation.cancel()
        operation.close()
        raise ApiError(504, "Prediction request timed out.") from None
    except BaseException:
        operation.close()
        raise
