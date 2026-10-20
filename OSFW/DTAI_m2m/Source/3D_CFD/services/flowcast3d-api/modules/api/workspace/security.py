import hmac
import os
import re
import secrets
from pathlib import Path
from urllib.parse import urlsplit

from modules.domain.errors import ApiError

COOKIE = "flowcast_workspace"


class WorkspaceSessions:
    """지속 세션 키와 동일 출처 및 CSRF 검증 관리"""

    def __init__(self, root: Path):
        path = root / ".session-key"
        try:
            with path.open("xb") as stream:
                os.chmod(path, 0o600)
                stream.write(secrets.token_bytes(32))
                stream.flush()
                os.fsync(stream.fileno())
        except FileExistsError:
            pass
        self.secret = path.read_bytes()
        if len(self.secret) != 32:
            raise ValueError("Workspace session key is invalid.")

    def csrf(self, session: str) -> str:
        return hmac.new(self.secret, session.encode(), "sha256").hexdigest()

    def session(self, request, *, mutation=False):
        origin = request.headers.get("origin")
        if origin:
            parsed = urlsplit(origin)
            if parsed.scheme not in {"http", "https"} or parsed.netloc != request.headers.get("host"):
                raise ApiError(403, "Cross-origin workspace requests are forbidden.")
        if request.headers.get("sec-fetch-site") not in {None, "same-origin", "none"}:
            raise ApiError(403, "Cross-site workspace requests are forbidden.")
        session = request.cookies.get(COOKIE, "")
        valid = bool(re.fullmatch(r"[a-f0-9]{64}", session))
        if mutation:
            if not valid or not secrets.compare_digest(
                request.headers.get("x-csrf-token", ""), self.csrf(session)
            ):
                raise ApiError(403, "Workspace session or CSRF token is invalid.")
        elif not valid:
            session = secrets.token_hex(32)
        return session
