import httpx

from modules.domain.schemas import ResultMetadata


class ApiUnreachable(Exception):
    """연결 실패 또는 시간 초과"""


class ApiError(Exception):
    """API 거절 응답이며 detail에 거절 사유 보관"""

    def __init__(self, status, detail):
        self.status, self.detail = status, detail
        super().__init__(f"HTTP {status}: {detail}")


class ApiClient:
    def __init__(self, base_url, timeout=30.0, transport=None):
        self.http = httpx.Client(base_url=base_url, timeout=timeout, transport=transport)

    def get(self, path):
        return self.request("GET", path)

    def post(self, path, body=None):
        return self.request("POST", path, body)

    def request(self, method, path, body=None):
        try:
            response = self.http.request(method, path, json=body)
        except httpx.TransportError as error:
            raise ApiUnreachable(f"{self.http.base_url}: {error!r}") from None
        if response.is_error:
            try:
                detail = response.json()["detail"]
            except (ValueError, KeyError, TypeError):
                detail = response.text
            raise ApiError(response.status_code, detail)
        return response.json()

    def cases(self):
        return self.get("/cases")

    def case(self, case_id):
        return self.get(f"/cases/{case_id}")["case"]

    def case_results(self, case_id):
        return self.get(f"/cases/{case_id}/results")

    def result(self, job_id):
        return ResultMetadata.model_validate(self.get(f"/results/{job_id}"))

    def job(self, job_id):
        return self.get(f"/jobs/{job_id}")

    def start_live(self, case_id, direction, speed, steps, replaces=None):
        """풍향은 북쪽부터 시계 방향의 도, 풍속은 지면 위 10 m 기준(m/s)"""
        body = {"direction": direction, "speed": speed, "steps": steps, "replaces": replaces}
        return self.post(f"/cases/{case_id}/live", body)

    def cancel(self, job_id):
        return self.post(f"/jobs/{job_id}/cancel")

    def create_case(self, document):
        return self.post("/cases", document)

    def ingest(self, case_id, upload_id, kind):
        return self.post(f"/cases/{case_id}/ingest", {"upload_id": upload_id, "kind": kind})

    def ingest_status(self, ingest_id):
        return self.get(f"/ingests/{ingest_id}")

    def create_domain(self, case_id):
        return self.post(f"/cases/{case_id}/domain")
