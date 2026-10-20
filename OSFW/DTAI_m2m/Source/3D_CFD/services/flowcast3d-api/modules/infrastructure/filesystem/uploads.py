import base64
import binascii
import fcntl
import hashlib
import os
import re
import secrets
import time
from contextlib import contextmanager
from pathlib import Path, PurePosixPath

from modules.domain.errors import ApiError

CHUNK_BYTES = 32 * 1024 * 1024
FILE_BYTES = 32 * 1024**3
BUNDLE_BYTES = 64 * 1024**3
UPLOAD_TTL = 7 * 86400
IDENTIFIER = re.compile(r"^[a-f0-9]{32}$")
ALLOWED = {
    ".npy",
    ".npz",
    ".obj",
    ".stl",
    ".mtl",
    ".png",
    ".jpg",
    ".jpeg",
    ".vtk",
    ".vti",
    ".vtu",
    ".vtp",
    ".vtr",
    ".vts",
    ".pvd",
    ".vtm",
    ".json",
}


def identifier(value):
    if not isinstance(value, str) or not IDENTIFIER.fullmatch(value):
        raise ApiError(404, "Upload was not found.")
    return value


def metadata(value):
    entries = {}
    if not value or len(value) > 16384:
        raise ApiError(400, "Upload-Metadata must contain a filename.")
    try:
        for item in value.split(","):
            parts = item.strip().split(" ", 1)
            key, encoded = parts[0], parts[1] if len(parts) == 2 else ""
            if not key or key in entries or not re.fullmatch(r"[A-Za-z0-9_-]+", key):
                raise ValueError("Duplicate metadata key")
            entries[key] = base64.b64decode(encoded, validate=True).decode("utf-8")
    except (ValueError, UnicodeError, binascii.Error):
        raise ApiError(400, "Upload-Metadata contains invalid Base64 text.") from None
    name = entries.get("filename", "")
    path = PurePosixPath(name)
    if (
        not name
        or len(name) > 512
        or "\\" in name
        or "\x00" in name
        or path.is_absolute()
        or any(part in {"", ".", ".."} for part in name.split("/"))
        or any(ord(character) < 32 for character in name)
    ):
        raise ApiError(400, "Upload filename is invalid.")
    if path.suffix.lower() not in ALLOWED:
        raise ApiError(415, "Upload file format is unsupported.")
    fingerprint = entries.get("fingerprint")
    if fingerprint is not None and not re.fullmatch(r"[a-f0-9]{64}", fingerprint):
        raise ApiError(400, "Upload fingerprint must be a SHA-256 hexadecimal digest.")
    return name, fingerprint


class Uploads:
    allowed_formats = frozenset(ALLOWED)

    def __init__(self, root, database, *, create=True):
        self.root = Path(root) / "uploads"
        if create:
            self.root.mkdir(parents=True, exist_ok=True)
        self.collection = database["workspace_uploads"]

    @contextmanager
    def lock(self, upload_id, *, blocking=True, create=True):
        name = "admission" if upload_id == "admission" else identifier(upload_id)
        try:
            stream = (self.root / f"{name}.lock").open("a+b" if create else "r+b")
        except FileNotFoundError:
            yield True
            return
        with stream:
            try:
                fcntl.flock(stream.fileno(), fcntl.LOCK_EX | (0 if blocking else fcntl.LOCK_NB))
            except BlockingIOError:
                yield False
                return
            try:
                yield True
            finally:
                fcntl.flock(stream.fileno(), fcntl.LOCK_UN)

    def create(self, length, header, owner):
        if not isinstance(length, int) or isinstance(length, bool) or not 0 < length <= FILE_BYTES:
            raise ApiError(413, "Upload length must be greater than zero and at most 32 GiB.")
        name, fingerprint = metadata(header)
        with self.lock("admission"):
            active = list(
                self.collection.find({"owner": owner, "registered": False, "expiresAt": {"$gt": time.time()}})
            )
            if len(active) >= 512 or sum(item["length"] for item in active) + length > BUNDLE_BYTES:
                raise ApiError(413, "Upload bundle exceeds the 64 GiB or 512-file limit.")
            space = os.statvfs(self.root)
            if length > space.f_bavail * space.f_frsize:
                raise ApiError(507, "Upload storage has insufficient free space.")
            upload_id = secrets.token_hex(16)
            path = self.root / f"{upload_id}.part"
            path.touch(mode=0o600, exist_ok=False)
            now = time.time()
            document = {
                "_id": upload_id,
                "owner": owner,
                "filename": name,
                "length": length,
                "offset": 0,
                "createdAt": now,
                "expiresAt": now + UPLOAD_TTL,
                "registered": False,
                "fingerprint": fingerprint,
            }
            try:
                self.collection.insert_one(document)
            except BaseException:
                path.unlink(missing_ok=True)
                raise
        return document

    def get(self, upload_id, owner, *, allow_expired=False):
        document = self.collection.find_one({"_id": identifier(upload_id), "owner": owner})
        if document is None:
            raise ApiError(404, "Upload was not found.")
        if not allow_expired and document["expiresAt"] < time.time() and not document["registered"]:
            raise ApiError(410, "Upload has expired.")
        return document

    def headers(self, document):
        from email.utils import formatdate

        return {
            "Tus-Resumable": "1.0.0",
            "Upload-Offset": str(document["offset"]),
            "Upload-Length": str(document["length"]),
            "Cache-Control": "no-store",
            "Upload-Expires": formatdate(document["expiresAt"], usegmt=True),
        }

    def open_patch(self, upload_id, owner, offset):
        document = self.get(upload_id, owner)
        if document["registered"] or document.get("registrationId"):
            raise ApiError(409, "Upload is already registered.")
        if document["offset"] != offset:
            raise ApiError(409, "Upload offset does not match the committed server offset.")
        path = self.root / f"{identifier(upload_id)}.part"
        stream = path.open("r+b")
        stream.truncate(document["offset"])
        stream.seek(document["offset"])
        return document, stream

    def commit(self, document, stream, received, checksum):
        stream.flush()
        os.fsync(stream.fileno())
        if checksum is not None:
            algorithm, encoded = checksum.split(" ", 1)
            if algorithm not in {"sha1", "sha256"}:
                raise ApiError(400, "Upload checksum algorithm must be sha1 or sha256.")
            stream.seek(document["offset"])
            digest = hashlib.new(algorithm)
            remaining = received
            while remaining:
                block = stream.read(min(1024 * 1024, remaining))
                digest.update(block)
                remaining -= len(block)
            try:
                matched = secrets.compare_digest(digest.digest(), base64.b64decode(encoded, validate=True))
            except binascii.Error:
                matched = False
            if not matched:
                raise ApiError(460, "Upload checksum does not match the chunk.")
        offset = document["offset"] + received
        changed = self.collection.update_one(
            {"_id": document["_id"], "offset": document["offset"], "registered": False},
            {"$set": {"offset": offset, "expiresAt": time.time() + UPLOAD_TTL}},
        )
        if changed.matched_count != 1:
            raise ApiError(409, "Upload offset changed during the request.")
        return document | {"offset": offset}

    def cancel(self, upload_id, owner):
        with self.lock(upload_id):
            document = self.get(upload_id, owner, allow_expired=True)
            if document["registered"] or document.get("registrationId"):
                raise ApiError(409, "Registered uploads cannot be cancelled.")
            (self.root / f"{upload_id}.part").unlink(missing_ok=True)
            self.collection.delete_one({"_id": upload_id, "owner": owner, "registered": False})

    def prune_expired(self, dry_run=False):
        """잠긴 원본과 등록 중인 업로드를 보존하며 만료 파일 정리"""
        now = time.time()
        query = {"registered": False, "registrationId": {"$exists": False}, "expiresAt": {"$lt": now}}
        result = {"candidates": 0, "removed": 0, "bytes": 0, "busy": 0, "errors": 0}
        for item in self.collection.find(query, {"_id": 1}):
            try:
                upload_id = identifier(item["_id"])
                with self.lock(upload_id, blocking=False, create=not dry_run) as acquired:
                    if not acquired:
                        result["busy"] += 1
                        continue
                    document = self.collection.find_one(query | {"_id": upload_id})
                    if document is None:
                        continue
                    path = self.root / f"{upload_id}.part"
                    if path.is_symlink():
                        raise ValueError("Upload file must not be a symbolic link.")
                    size = path.stat().st_size if path.is_file() else 0
                    result["candidates"] += 1
                    if not dry_run:
                        path.unlink(missing_ok=True)
                        self.collection.delete_one(query | {"_id": upload_id})
                        result["removed"] += 1
                    result["bytes"] += size
            except Exception:
                result["errors"] += 1
        return result

    def identity(self, upload_id, owner):
        with self.lock(upload_id):
            document = self.get(upload_id, owner)
            length = min(document["offset"], 1024 * 1024)
            path = self.root / f"{upload_id}.part"
            if document["registered"] or not path.is_file():
                raise ApiError(409, "Upload is no longer available for resumption.")
            with path.open("rb") as stream:
                digest = hashlib.sha256(stream.read(length)).hexdigest()
            return {
                "id": upload_id,
                "filename": document["filename"],
                "length": document["length"],
                "offset": document["offset"],
                "prefixBytes": length,
                "prefixSha256": digest,
                "fingerprint": document.get("fingerprint"),
            }
