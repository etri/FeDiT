"""공개 API 인증과 요청량 제한"""

import hmac
import math
import time
from collections import deque

from fastapi import Request
from fastapi.responses import JSONResponse


def install_public_access(app):
    """앱 인스턴스별 인증과 호출 제한 미들웨어 등록"""
    recent_requests = deque()
    active_requests = 0

    @app.middleware("http")
    async def public_access(request: Request, call_next):
        nonlocal active_requests
        if request.method != "POST" or request.url.path not in {"/v1/predict", "/v1/visualize"}:
            return await call_next(request)
        config = app.state.settings
        if config is None:
            return JSONResponse(status_code=503, content={"detail": "Application startup is incomplete."})
        if not config.api_key:
            return JSONResponse(
                status_code=503, content={"detail": "Public API authentication is not configured."}
            )

        # 인증 후 공개 서버 전체의 호출 수와 동시 작업 제한
        scheme, _, provided = request.headers.get("authorization", "").partition(" ")
        if scheme.lower() != "bearer" or not hmac.compare_digest(provided.encode(), config.api_key.encode()):
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid API key."},
                headers={"WWW-Authenticate": "Bearer"},
            )
        now = time.monotonic()
        while recent_requests and recent_requests[0] <= now - 60:
            recent_requests.popleft()
        if len(recent_requests) >= config.api_requests_per_minute:
            retry = max(1, math.ceil(recent_requests[0] + 60 - now))
            return JSONResponse(
                status_code=429,
                content={"detail": "Request rate limit exceeded."},
                headers={"Retry-After": str(retry)},
            )
        if active_requests >= config.api_max_concurrent_requests:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many concurrent requests."},
                headers={"Retry-After": "1"},
            )
        recent_requests.append(now)
        active_requests += 1
        try:
            return await call_next(request)
        finally:
            active_requests -= 1
