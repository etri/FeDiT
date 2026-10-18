from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.models.image_models import ImageBuildRequest
from app.services import registry_service, docker_service
from app.auth import get_owner_namespace, get_user_namespace
from app.resource_policy import require_image_owner

import asyncio
import json

router = APIRouter()


def _attach_image_permissions(items: list[dict], request: Request) -> list[dict]:
    """목록 응답에 현재 사용자의 삭제 가능 여부를 추가."""
    owner_ns = get_owner_namespace(request)
    for item in items:
        image_owner_ns = item.get("owner_namespace")
        compatible_types = item.get("compatible_types") or []
        item["can_delete"] = (
            not item.get("protected")
            and item.get("type") == "user" and image_owner_ns == owner_ns
        )
        item["can_use"] = bool(compatible_types)
    return items


@router.get("")
async def list_images(request: Request):
    items = await registry_service.list_repositories(namespace=get_user_namespace(request))
    return _attach_image_permissions(items, request)


@router.get("/{name:path}/tags")
async def get_tags(name: str, request: Request):
    require_image_owner(name, get_user_namespace(request))
    tags = await registry_service.get_tags(name)
    return {"name": name, "tags": tags}


@router.post("/preview-dockerfile")
async def preview_dockerfile(req: ImageBuildRequest):
    """현재 폼 상태로 생성될 Dockerfile 텍스트를 반환"""
    return {"dockerfile": docker_service.render_dockerfile(req)}


@router.post("/build")
async def build_image(req: ImageBuildRequest, request: Request):
    ns = get_owner_namespace(request)
    # 이미지 이름에 생성자 owner namespace prefix 추가
    req.image_name = f"{ns}/{req.image_name}"
    build_id = await docker_service.build_and_push(req)
    return {"build_id": build_id, "status": "building"}


@router.get("/build-log/{build_id}")
async def build_log(build_id: str, request: Request):
    info = docker_service.get_build_status(build_id)
    if not info or info.get("owner_namespace") != get_owner_namespace(request):
        raise HTTPException(404, "이미지 빌드 기록을 찾을 수 없습니다.")
    async def event_stream():
        last_idx = 0
        while True:
            info = docker_service.get_build_status(build_id)
            if not info:
                yield f"data: {json.dumps({'error': 'not found'})}\n\n"
                return

            logs = info["logs"]
            if last_idx < len(logs):
                for line in logs[last_idx:]:
                    yield f"data: {json.dumps({'log': line})}\n\n"
                last_idx = len(logs)

            if info["status"] in ("success", "error"):
                yield f"data: {json.dumps({'status': info['status'], 'message': info['message']})}\n\n"
                return

            await asyncio.sleep(0.5)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.delete("/{name:path}")
async def delete_image(name: str, request: Request, tag: str = Query(default="latest", pattern=r"^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$"), force: bool = False):
    """이미지 삭제. 시스템 이미지는 삭제 불가. 사용자 이미지는 해당 namespace 소유자만."""
    require_image_owner(name, get_owner_namespace(request))

    ok = await registry_service.delete_image(name, tag)
    # Notebook options are resolved per tenant; do not mutate/restart the shared JWA.
    return {"deleted": ok, "name": name, "tag": tag}


@router.get("/base-options")
async def base_options():
    return [
        {
            "value": "pytorch",
            "label": "PyTorch",
            "tags": [
                "2.1.0-cuda12.1-cudnn8-runtime",
                "2.2.0-cuda12.1-cudnn8-runtime",
                "2.3.0-cuda12.1-cudnn8-runtime",
                "latest",
            ],
        },
        {
            "value": "tensorflow",
            "label": "TensorFlow",
            "tags": ["2.15.0-gpu", "2.16.1-gpu", "latest-gpu", "latest"],
        },
        {
            "value": "cuda",
            "label": "NVIDIA CUDA",
            "tags": [
                "12.1.0-runtime-ubuntu22.04",
                "12.2.0-runtime-ubuntu22.04",
                "12.4.0-runtime-ubuntu22.04",
            ],
        },
        {
            "value": "python",
            "label": "Python (CPU)",
            "tags": ["3.10-slim", "3.11-slim", "3.12-slim"],
        },
        {"value": "custom", "label": "Custom (직접 입력)", "tags": []},
    ]
