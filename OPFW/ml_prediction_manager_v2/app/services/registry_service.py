"""Local image catalogue used by the Prediction Manager image UI.

The installation keeps the Docker Registry on loopback so TCP 5000 is never
published outside the host.  Kubernetes Pods consequently cannot call the
Registry HTTP endpoint directly.  Docker's Unix socket is already mounted for
the image build workflow; this module uses it as a read-only catalogue fallback
when the Registry endpoint is deliberately private.
"""

from __future__ import annotations

from collections import defaultdict

import docker
import httpx

from app.config import settings
from app.resource_policy import image_owner
from fastapi import HTTPException


SYSTEM_IMAGES = {
    "prediction-manager-app": {
        "category": "예측매니저",
        "description": "예측매니저 백엔드 (FastAPI).",
        "protected": True,
    },
    "union-twin-fe": {
        "category": "FeDiT",
        "description": "FeDiT 메인 화면 React 앱.",
        "protected": True,
    },
    "fedit-frontend": {
        "category": "FeDiT",
        "description": "FeDiT 메인 화면 React 앱.",
        "protected": True,
    },
    "ray-mlflow": {
        "category": "Ray · MLflow",
        "description": "Ray Tune + MLflow 통합 이미지.",
        "protected": True,
    },
    "label-studio": {
        "category": "Label Studio",
        "description": "학습 데이터 라벨링 도구 이미지.",
        "protected": True,
    },
    "mlflow-postgres": {
        "category": "MLflow",
        "description": "MLflow 실험 이력 저장소 PostgreSQL 이미지.",
        "protected": True,
    },
    "prediction-manager-nifi-python": {
        "category": "Apache NiFi",
        "description": "NiFi Python 확장 실행 이미지.",
        "protected": True,
    },
}


def _classify(repo_name: str) -> dict:
    if repo_name in SYSTEM_IMAGES:
        return {"type": "system", **SYSTEM_IMAGES[repo_name]}
    if "/" in repo_name:
        namespace = image_owner(repo_name)
        if namespace:
            return {
                "type": "user",
                "category": "사용자",
                "description": f"{namespace} 사용자가 빌드한 이미지",
                "protected": False,
            }
    return {
        "type": "orphan",
        "category": "미분류",
        "description": "소유자·용도를 자동 식별하지 못한 이미지입니다.",
        "protected": True,
    }


def owner_namespace(repo_name: str) -> str | None:
    return image_owner(repo_name)


def _repository_info(repo: str, tags: list[str]) -> dict:
    classification = _classify(repo)
    compatible_types = ["jupyter"] if classification["type"] == "user" else []
    return {
        "name": repo,
        "tags": sorted(tags),
        "registry_host": settings.registry_host,
        "owner_namespace": owner_namespace(repo),
        "compatible_types": compatible_types,
        **classification,
    }


def _local_docker_catalogue() -> dict[str, list[str]]:
    """Return the local Docker tags that use the configured Registry prefix."""
    prefix = f"{settings.registry_host.rstrip('/')}/"
    catalogue: dict[str, set[str]] = defaultdict(set)
    try:
        client = docker.DockerClient(base_url=settings.docker_socket)
        for image in client.images.list():
            for reference in image.tags:
                if not reference.startswith(prefix):
                    continue
                name_tag = reference[len(prefix):]
                name, separator, tag = name_tag.rpartition(":")
                if separator and name and tag:
                    catalogue[name].add(tag)
    except docker.errors.DockerException:
        return {}
    return {name: sorted(tags) for name, tags in catalogue.items()}


async def _catalogue() -> dict[str, list[str]]:
    """Get Registry metadata, falling back to Docker when it is loopback-only."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.registry_url}/v2/_catalog")
            response.raise_for_status()
            catalogue: dict[str, list[str]] = {}
            for repository in response.json().get("repositories", []):
                tags_response = await client.get(
                    f"{settings.registry_url}/v2/{repository}/tags/list"
                )
                tags_response.raise_for_status()
                catalogue[repository] = tags_response.json().get("tags", []) or []
            return catalogue
    except (httpx.HTTPError, ValueError):
        return _local_docker_catalogue()


async def list_repositories(namespace: str | None = None, include_system: bool = False) -> list[dict]:
    result = []
    for repository, tags in (await _catalogue()).items():
        classification = _classify(repository)
        if namespace:
            if include_system and classification["type"] == "system":
                pass
            elif owner_namespace(repository) != namespace:
                continue
        if tags:
            result.append(_repository_info(repository, tags))
    return sorted(result, key=lambda item: item["name"])


async def list_all_repositories() -> list[dict]:
    """Application-wide user catalogue; never return platform or unknown images."""
    return [
        _repository_info(repository, tags)
        for repository, tags in sorted((await _catalogue()).items())
        if tags and image_owner(repository)
    ]


async def list_shared_repositories() -> list[dict]:
    return [
        _repository_info(repository, tags)
        for repository, tags in sorted((await _catalogue()).items())
        if tags and image_owner(repository)
    ]


async def get_tags(name: str) -> list[str]:
    if not image_owner(name):
        raise HTTPException(403, "사용자 이미지의 태그만 조회할 수 있습니다.")
    return (await _catalogue()).get(name, [])


async def delete_image(name: str, tag: str) -> bool:
    """Delete user images; use Docker only when the private Registry is unreachable."""
    if not image_owner(name):
        raise HTTPException(403, "플랫폼 또는 소유권이 확인되지 않은 이미지는 삭제할 수 없습니다.")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            manifest = await client.get(
                f"{settings.registry_url}/v2/{name}/manifests/{tag}",
                headers={"Accept": "application/vnd.docker.distribution.manifest.v2+json"},
            )
            manifest.raise_for_status()
            digest = manifest.headers.get("Docker-Content-Digest")
            if not digest:
                return False
            deleted = await client.delete(
                f"{settings.registry_url}/v2/{name}/manifests/{digest}"
            )
            return deleted.status_code == 202
    except httpx.HTTPError:
        try:
            docker.DockerClient(base_url=settings.docker_socket).images.remove(
                f"{settings.registry_host}/{name}:{tag}", force=False, noprune=True
            )
            return True
        except docker.errors.DockerException:
            return False
