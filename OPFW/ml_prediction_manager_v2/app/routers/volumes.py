from fastapi import APIRouter, HTTPException, Request
from kubernetes.client.rest import ApiException

from app.auth import get_owner_namespace, get_user_namespace
from app.models.volume_models import VolumeCreateRequest
from app.services import volume_service

router = APIRouter()


def _storage(operation, *args):
    try:
        return operation(*args)
    except ApiException as exc:
        if exc.status == 409:
            raise HTTPException(409, "볼륨 상태가 변경됐습니다. 새로고침 후 다시 확인하세요.") from exc
        if exc.status == 403 and "exceeded quota" in (exc.body or "").lower():
            raise HTTPException(409, "사용자 영역의 스토리지 또는 볼륨 개수 할당량을 초과했습니다.") from exc
        if exc.status == 404:
            raise HTTPException(404, "볼륨을 찾을 수 없습니다.") from exc
        raise HTTPException(503, "스토리지 요청을 처리할 수 없습니다. Kubernetes 상태와 권한을 확인하세요.") from exc


def _write_namespace(request: Request) -> str:
    namespace = get_user_namespace(request)
    if namespace != get_owner_namespace(request):
        raise HTTPException(403, "자신이 소유한 사용자 영역의 볼륨만 변경할 수 있습니다.")
    return namespace


@router.get("")
async def list_volumes(request: Request):
    namespace = get_user_namespace(request)
    return {"namespace": namespace, "can_manage": namespace == get_owner_namespace(request),
            "volumes": _storage(volume_service.list_volumes, namespace)}


@router.post("", status_code=201)
async def create_volume(req: VolumeCreateRequest, request: Request):
    namespace = _write_namespace(request)
    name = _storage(volume_service.create_volume, namespace, req.name, f"{req.size_gib}Gi")
    return {"name": name, "namespace": namespace}


@router.delete("/{name}")
async def delete_volume(name: str, request: Request):
    return _storage(volume_service.delete_volume, _write_namespace(request), name)
