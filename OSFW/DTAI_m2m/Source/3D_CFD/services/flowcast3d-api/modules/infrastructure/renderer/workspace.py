import re
from pathlib import Path
from typing import Any

import httpx

from modules.domain.errors import ApiError


class WorkspaceRendererClient:
    """Viewer 작업 프로세스의 HTTP 연결과 내부 오류 변환"""

    def __init__(self, url: str, root: Path):
        self.url = url
        self.root = root
        self.client = httpx.Client(timeout=3600, trust_env=False, follow_redirects=False)

    def close(self) -> None:
        self.client.close()

    def __call__(self, operation: str, params: dict[str, Any]) -> dict[str, Any]:
        try:
            response = self.client.post(
                f"{self.url}/process", json={"operation": operation, "params": params}
            )
        except httpx.HTTPError:
            raise ApiError(503, "Visualization worker is unavailable.") from None
        if not response.is_success:
            try:
                detail = response.json().get("detail", "Visualization processing failed.")
            except ValueError:
                detail = "Visualization processing failed."
            status = response.status_code if response.status_code in {400, 404, 409, 413, 422, 503} else 502
            # 내부 경로는 사용자 오류에 포함하지 않음
            if (
                not isinstance(detail, str)
                or str(self.root) in detail
                or re.search(r"(?:^|[ '\"])/[^\s]+", detail)
            ):
                detail = "Dataset processing failed. Check the input format and mapping."
            raise ApiError(status, detail)
        return response.json()
