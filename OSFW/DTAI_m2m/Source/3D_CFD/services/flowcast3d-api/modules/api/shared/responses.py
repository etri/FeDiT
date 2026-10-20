"""요청 파일을 전송 후 회수하는 HTTP 응답"""

from fastapi.responses import FileResponse


class OwnedJSONResponse(FileResponse):
    """응답 전송의 완료와 중단 모두에서 요청 파일 회수"""

    def __init__(self, path, operation):
        super().__init__(path, media_type="application/json", headers={"Cache-Control": "no-store"})
        self.operation = operation

    async def __call__(self, scope, receive, send):
        try:
            await super().__call__(scope, receive, send)
        finally:
            self.operation.close()
