from __future__ import annotations

import argparse
import json
import os
import re
import secrets
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path
from uuid import uuid4

from modules.infrastructure.mongo.cleanup import prune_asset_blobs
from modules.infrastructure.mongo.connection import database
from modules.infrastructure.mongo.storage import MongoAssets, MongoZarrStore
from modules.settings.validation import env_port


def _signature(path):
    stat = path.stat(follow_symlinks=False)
    return {
        name: getattr(stat, name) for name in ("st_size", "st_mtime_ns", "st_ctime_ns", "st_ino", "st_dev")
    }


def _zarr_key(relative):
    for index, name in enumerate(relative.parts[:-1]):
        if name.endswith((".zarr", ".zarr.partial")):
            return Path(*relative.parts[: index + 1]), Path(*relative.parts[index + 1 :]).as_posix()
    return None


def migrate_assets(source, namespace="/data", verify_only=False, db=None, report_path=None):
    """원본을 유지하며 MongoDB로 이관하고 문서와 크기 확인"""
    from bson.binary import Binary

    from modules.domain.schemas import Case

    # 이관 원본 검증과 진행 기록 준비
    source = Path(source).absolute()
    logical = Path(namespace)
    if source.is_symlink() or not source.is_dir() or not logical.is_absolute():
        raise ValueError("A source directory and absolute logical path are required.")
    active_db = database() if db is None else db
    assets = MongoAssets(active_db)
    journal = active_db.asset_migrations
    report = {
        "source": str(source),
        "namespace": str(logical),
        "verify_only": verify_only,
        "started_at": time.time(),
        "items": [],
        "permanent_bytes": 0,
        "excluded_bytes": 0,
        "verified": 0,
        "failed": 0,
        "excluded": 0,
    }
    entries = sorted(source.rglob("*"), key=lambda path: (path.name == ".zgroup", str(path)))
    blocked_stores = set()
    failed_stores = set()
    # 기존 청크를 모두 검증한 뒤 추가 이관
    for path in entries:
        if path.is_symlink():
            raise ValueError(f"Symbolic-link sources cannot be migrated: {path}.")
        if not path.is_file():
            continue
        relative = path.relative_to(source)
        located = _zarr_key(relative)
        if located is None or "mesh_cache" in relative.parts:
            continue
        store_relative, key = located
        store = MongoZarrStore(logical / store_relative, readonly=True, collection=active_db.zarr_chunks)
        if ".zgroup" not in store or key not in store:
            continue
        before = _signature(path)
        source_size = before["st_size"]
        mongo_size = store.size(key)
        if before != _signature(path) or source_size != mongo_size:
            blocked_stores.add(str(logical / store_relative))

    # 항목별 자료 이관과 MongoDB 크기 확인
    for path in entries:
        if not path.is_file():
            continue
        relative = path.relative_to(source)
        target = logical / relative
        item = {"source": str(path), "path": str(target), "relative": relative.as_posix()}
        migration = {"source": str(path), "path": str(target)}
        try:
            before = _signature(path)
            size = before["st_size"]
            if before != _signature(path):
                raise ValueError("Source file changed while reading its size.")
            item.update(size=size, source_stat=before)
            if "mesh_cache" in relative.parts or path.name == ".gitkeep":
                item.update(
                    kind="derived_cache" if "mesh_cache" in relative.parts else "placeholder",
                    status="excluded",
                )
                report["excluded_bytes"] += size
                report["excluded"] += 1
                report["items"].append(item)
                continue
            report["permanent_bytes"] += size
            located = _zarr_key(relative)
            if located is not None:
                store_relative, key = located
                store_path = logical / store_relative
                item.update(kind="zarr", store=str(store_path), key=key)
                if str(store_path) in blocked_stores:
                    raise FileExistsError(
                        f"Existing MongoDB Zarr data differs from the source. The store was preserved: {store_path}."
                    )
                if key == ".zgroup" and str(store_path) in failed_stores:
                    raise ValueError("Migration contains failed chunks. The Zarr store was not published.")
                store = MongoZarrStore(store_path, readonly=verify_only, collection=active_db.zarr_chunks)
                if not verify_only:
                    store.write_stream(key, path, overwrite=False)
                stored_size = store.size(key)
            elif relative.parts[:1] == ("cases",) and len(relative.parts) == 3 and path.name == "case.json":
                item["kind"] = "case"
                original = path.read_bytes()
                case = Case.model_validate_json(original)
                if case.id != relative.parts[1]:
                    raise ValueError("Case ID differs from the source directory name.")
                revision_query = {"case_id": case.id, "data": Binary(original)}
                if not verify_only:
                    active_db.case_revisions.update_one(
                        revision_query,
                        {
                            "$setOnInsert": {
                                "_id": uuid4().hex,
                                "case_id": case.id,
                                "data": Binary(original),
                                "size": size,
                            }
                        },
                        upsert=True,
                    )
                    active_db.cases.update_one(
                        {"_id": case.id},
                        {"$setOnInsert": {"case": case.model_dump(mode="json", by_alias=True)}},
                        upsert=True,
                    )
                revision = active_db.case_revisions.find_one(revision_query)
                current = active_db.cases.find_one({"_id": case.id})
                if revision is None or current is None:
                    raise FileNotFoundError("MongoDB case or source descriptor history is missing.")
                stored_size = len(revision["data"])
                item["preserved_current_case"] = current["case"] != case.model_dump(
                    mode="json", by_alias=True
                )
            else:
                item["kind"] = "asset"
                existing = assets.info(target)
                if existing is not None and existing["size"] != size:
                    raise FileExistsError(f"Existing MongoDB asset differs from the source: {target}.")
                if not verify_only and existing is None:
                    assets.save(target, path, metadata={"mtime_ns": before["st_mtime_ns"]}, overwrite=False)
                saved = assets.verify(target)
                stored_size = saved["size"]
            if stored_size != size:
                raise ValueError("Source and MongoDB size differ.")
            if before != _signature(path):
                raise ValueError("Source file changed during migration or verification.")
            item["status"] = "verified"
            report["verified"] += 1
        except Exception as error:
            item.update(status="failed", error=f"{type(error).__name__}: {error}")
            report["failed"] += 1
            if item.get("kind") == "zarr":
                failed_stores.add(item["store"])
        if not verify_only:
            journal.update_one(
                migration,
                {"$set": {**item, "updated_at": time.time()}, "$setOnInsert": {"_id": uuid4().hex}},
                upsert=True,
            )
        report["items"].append(item)
        if len(report["items"]) % 100 == 0:
            print(
                json.dumps(
                    {
                        "processed": len(report["items"]),
                        "verified": report["verified"],
                        "failed": report["failed"],
                    }
                ),
                flush=True,
            )
            if report_path:
                _write_report(report_path, report)

    # 최종 이관 상태와 보고서 확정
    report.update(finished_at=time.time(), status="failed" if report["failed"] else "verified")
    if report_path:
        _write_report(report_path, report)
    return report


def _write_report(path, report):
    """임시 파일 기록을 마친 뒤 원자적으로 보고서 공개"""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    os.replace(temporary, path)


def request(
    base: str, path: str, body: dict | None = None, timeout: float = 180, *, api_key: str | None = None
) -> object:
    content = None if body is None else json.dumps(body).encode()
    query = urllib.request.Request(base.rstrip("/") + path, data=content)
    if content is not None:
        query.add_header("Content-Type", "application/json")
    if api_key:
        query.add_header("Authorization", f"Bearer {api_key}")
    try:
        with urllib.request.urlopen(query, timeout=timeout) as response:
            raw = response.read()
            return (
                raw
                if response.headers.get_content_type() in {"image/png", "image/gif", "video/mp4"}
                else json.loads(raw)
            )
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"{path}: HTTP {error.code}: {error.read().decode()}") from error


def bootstrap(args, parser) -> None:
    source = args.source.absolute()
    if not (source / "cases").is_dir():
        parser.error(f"Source case directory does not exist: {source / 'cases'}.")
    report = migrate_assets(source, args.namespace, args.verify_only, report_path=args.report)
    print(json.dumps({key: value for key, value in report.items() if key != "items"}, ensure_ascii=False))
    if report["failed"]:
        raise SystemExit(1)


def public_prediction(args, api_key):
    """작은 마스크의 예측 결과를 시각화 요청으로 직접 전달"""
    # 별도 데이터 폴더 없이 입력 배열 구성
    size = 16
    mask = [
        [[4 <= x < 8 and 4 <= y < 8 and z < 6 for x in range(size)] for y in range(size)] for z in range(size)
    ]
    prediction = request(
        args.api_url,
        "/v1/predict",
        {
            "building_mask": mask,
            "grid": {"origin": [0, 0, 0], "spacing": [2, 2, 2]},
            "wind": {"speed": 3, "direction": 270},
        },
        timeout=args.timeout,
        api_key=api_key,
    )
    if not isinstance(prediction, dict) or prediction.get("schema") != "flowcast.prediction/1":
        raise RuntimeError("Prediction response does not match flowcast.prediction/1.")
    required = {"velocity", "pressure", "building_mask", "valid_mask", "grid", "wind", "units", "axis_order"}
    if not required.issubset(prediction):
        raise RuntimeError("Prediction response is missing required fields.")
    print("초기 배열 예측과 공통 JSON 결과 반환 완료", flush=True)

    # 반환 결과 전체와 출력 형식만으로 렌더링 검증
    output_format = getattr(args, "format", "png")
    media = request(
        args.api_url,
        "/v1/visualize",
        {
            "prediction": prediction,
            "format": output_format,
        },
        timeout=args.timeout,
        api_key=api_key,
    )
    signatures = {"png": b"\x89PNG\r\n\x1a\n", "gif": b"GIF"}
    valid = isinstance(media, bytes) and (
        media[4:8] == b"ftyp" if output_format == "mp4" else media.startswith(signatures[output_format])
    )
    if not valid:
        raise RuntimeError(f"Rendered output is not a valid {output_format.upper()} file.")
    print(f"PyVista {output_format.upper()} 렌더링 완료: {len(media)} bytes", flush=True)
    return prediction, media


def public_smoke(args, parser):
    """독립 공개 API의 예측과 시각화 연결 검증"""
    api_key = os.environ.get("FLOWCAST_API_KEY", "")
    if not api_key:
        parser.error("FLOWCAST_API_KEY is required for public API checks.")
    prediction, media = public_prediction(args, api_key)
    if args.output_dir:
        args.output_dir.mkdir(parents=True, exist_ok=True)
        (args.output_dir / "prediction.json").write_text(json.dumps(prediction), encoding="utf-8")
        (args.output_dir / f"prediction.{args.format}").write_bytes(media)
        print(f"검증 결과: {args.output_dir}")


def smoke(args, root: Path, parser) -> None:
    api_key = os.environ.get("FLOWCAST_API_KEY", "")
    if not api_key:
        parser.error("FLOWCAST_API_KEY is required for public API checks.")

    # 내부 관리 주소와 요청 분류 식별자 준비
    management_api = args.management_api_url
    if management_api is None:
        container = subprocess.check_output(
            ["docker", "compose", "ps", "-q", "flowcast3d-api"], cwd=root, text=True
        ).strip()
        networks = json.loads(
            subprocess.check_output(
                ["docker", "inspect", "--format", "{{json .NetworkSettings.Networks}}", container], text=True
            )
        )
        address = networks.get("flowcast3d", {}).get("IPAddress")
        if not address:
            parser.error("Management API URL is required. Set --management-api-url.")
        management_api = f"http://{address}:{env_port('FLOWCAST_MANAGEMENT_PORT', 8082)}"
    suffix = f"smoke_{time.strftime('%Y%m%d_%H%M%S')}_{secrets.token_hex(3)}"

    # 서비스 연결과 공개 경로 제한 검증
    health = request(management_api, "/health")
    if health.get("database") != "ok" or health.get("executor") != "ok":
        raise RuntimeError(f"API connection is not ready: {health}.")
    request(args.viewer_url, "/health")
    for path in ("/health", "/docs", "/openapi.json", "/v1/cases"):
        try:
            urllib.request.urlopen(args.api_url.rstrip("/") + path, timeout=5).close()
        except urllib.error.HTTPError as error:
            if error.code != 404:
                raise RuntimeError(f"Public API access check failed: {path}: {error.code}.") from error
        else:
            raise RuntimeError(f"Management route is exposed through the public API: {path}.")
    print("API, MongoDB, 작업자, 웹 뷰어 연결 완료", flush=True)

    # 공개 경로는 서버 자료와 식별자 없이 연결 검증
    prediction, image = public_prediction(args, api_key)

    # Case 작업과 Zarr 결과 분석 검증
    request(management_api, f"/v1/cases/{args.case_id}")
    job = request(
        management_api,
        "/v1/jobs",
        {
            "case_id": args.case_id,
            "steps": 1,
            "max_voxels": 32 * 32 * 16,
            "output": f"results/{suffix}.zarr",
        },
    )
    job_id = job["job_id"]
    deadline = time.monotonic() + args.timeout
    while job["state"] in {"queued", "running"}:
        if time.monotonic() > deadline:
            raise TimeoutError(f"Case prediction timed out: {job_id}.")
        time.sleep(1)
        job = request(management_api, f"/v1/jobs/{job_id}")
    if job["state"] != "succeeded":
        raise RuntimeError(f"Case prediction failed: {job}.")
    output = Path(job["spec"]["output"])
    local_result = root / "services/flowcast3d-api/data" / output.relative_to("/data")
    if local_result.exists() or Path(str(local_result) + ".partial").exists():
        raise RuntimeError("Prediction output was saved to files instead of MongoDB.")
    model_root = root / "services/flowcast3d-model"
    for forbidden in ("predictions", "checkpoints", "entrypoint.py", "requirements-serving.txt", "deploy.py"):
        if (model_root / forbidden).exists():
            raise RuntimeError(f"Unexpected path was created outside the model structure: {forbidden}.")
    result = request(management_api, f"/v1/results/{job_id}")
    grid = result["grid"]
    center = [
        origin + size * spacing / 2
        for origin, size, spacing in zip(grid["origin"], grid["shape"], grid["spacing"])
    ]
    probe = request(management_api, "/v1/analysis/probe", {"result": job_id, "point": center})
    request(management_api, "/v1/analysis/timeseries", {"result": job_id, "point": center})
    request(management_api, f"/v1/cases/{args.case_id}/results")
    print(f"케이스 작업, MongoDB Zarr 결과, 이력과 지점 분석 완료: {job_id}", flush=True)
    summary = {"prediction": prediction, "job": job, "result": result, "probe": probe}
    if args.output_dir:
        args.output_dir.mkdir(parents=True, exist_ok=True)
        (args.output_dir / "prediction.png").write_bytes(image)
        (args.output_dir / "smoke.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2))
        print(f"검증 결과: {args.output_dir}")


def cleanup(args):
    """기본 미리보기로 만료 업로드와 고아 blob 집계"""
    from modules.application.housekeeping import Housekeeping
    from modules.infrastructure.filesystem.uploads import Uploads

    active_db = database()
    root = Path(os.environ.get("FLOWCAST_WORKSPACE_DIR", "/var/lib/flowcast3d-api/workspace"))
    uploads = Uploads(root, active_db, create=False)
    result = Housekeeping(
        uploads, interval=0, grace_seconds=args.grace_seconds, db=active_db, prune_blobs=prune_asset_blobs
    ).run_once(dry_run=not args.apply)
    print(json.dumps(result, sort_keys=True))


def _load_environment(root: Path) -> None:
    """프로세스 설정을 유지하며 저장소의 환경 파일 로드"""
    path = root / ".env"
    if not path.is_file():
        return
    escapes = {"n": "\n", "r": "\r", "t": "\t", '"': '"', "\\": "\\"}
    for number, line in enumerate(path.read_text(encoding="utf-8-sig").splitlines(), 1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, separator, value = line.removeprefix("export ").partition("=")
        key, value = key.strip(), value.strip()
        if not separator or re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key) is None:
            raise ValueError(f"Invalid environment assignment at {path}:{number}.")
        if value.startswith(("'", '"')):
            quote = value[0]
            pattern = r"'([^']*)'\s*(?:#.*)?" if quote == "'" else r'"((?:[^"\\]|\\.)*)"\s*(?:#.*)?'
            match = re.fullmatch(pattern, value)
            if match is None:
                raise ValueError(f"Invalid quoted environment value at {path}:{number}.")
            value = match[1]
            if quote == '"':
                value = re.sub(r'\\([nrt"\\])', lambda item: escapes[item[1]], value)
        else:
            value = re.split(r"\s+#", value, maxsplit=1)[0].rstrip()
        os.environ.setdefault(key, value)


def _service_url(host_variable: str, port_variable: str, default_port: int) -> str:
    """바인드 주소를 로컬 접속 가능한 서비스 URL로 변환"""
    host = os.environ.get(host_variable, "127.0.0.1").strip().strip("[]")
    host = {"": "127.0.0.1", "0.0.0.0": "127.0.0.1", "::": "::1"}.get(host, host)
    if ":" in host:
        host = f"[{host}]"
    return f"http://{host}:{env_port(port_variable, default_port)}"


def main(argv=None) -> None:
    root = Path(__file__).resolve().parents[4]
    parser = argparse.ArgumentParser(description="서비스 자료 준비와 실제 추론 연결 검증 명령")
    try:
        _load_environment(root)
    except ValueError as error:
        parser.error(str(error))
    commands = parser.add_subparsers(dest="command", required=True)
    bootstrap_parser = commands.add_parser(
        "migrate-assets", aliases=["bootstrap"], help="영구 자료 MongoDB 이관과 검증"
    )
    bootstrap_parser.add_argument("--source", type=Path, required=True)
    bootstrap_parser.add_argument("--namespace", default="/data")
    bootstrap_parser.add_argument("--verify-only", action="store_true")
    bootstrap_parser.add_argument("--report", type=Path, default=Path("/tmp/flowcast-assets-migration.json"))
    smoke_parser = commands.add_parser("smoke", help="실제 추론과 저장 및 시각화 연결 검증")
    smoke_parser.add_argument("--api-url")
    smoke_parser.add_argument("--viewer-url")
    smoke_parser.add_argument("--management-api-url")
    smoke_parser.add_argument("--case-id", default="kalasatama")
    smoke_parser.add_argument("--timeout", type=float, default=300)
    smoke_parser.add_argument("--output-dir", type=Path)
    public_parser = commands.add_parser("public-smoke", help="저장소 없이 공개 예측과 시각화 연결 검증")
    public_parser.add_argument("--api-url")
    public_parser.add_argument("--format", choices=("png", "gif", "mp4"), default="png")
    public_parser.add_argument("--timeout", type=float, default=7200)
    public_parser.add_argument("--output-dir", type=Path)
    cleanup_parser = commands.add_parser("cleanup", help="만료 업로드와 고아 blob 정리 대상 확인")
    cleanup_parser.add_argument("--apply", action="store_true", help="미리보기 대신 실제 정리 실행")
    cleanup_parser.add_argument(
        "--grace-seconds", type=float, default=3600, help="GridFS 파일 정리 유예 시간"
    )
    args = parser.parse_args(argv)
    # 명시한 URL을 우선하며 서비스별 환경 설정으로 검증 주소 구성
    try:
        if args.command in {"smoke", "public-smoke"} and args.api_url is None:
            args.api_url = _service_url("FLOWCAST_3D_API_HOST", "FLOWCAST_3D_API_PORT", 3001)
        if args.command == "smoke" and args.viewer_url is None:
            args.viewer_url = _service_url("FLOWCAST_VIEWER_HOST_IP", "FLOWCAST_VIEWER_PORT", 8090)
    except ValueError as error:
        parser.error(str(error))
    if args.command in {"bootstrap", "migrate-assets"}:
        bootstrap(args, bootstrap_parser)
    elif args.command == "cleanup":
        cleanup(args)
    elif args.command == "public-smoke":
        public_smoke(args, public_parser)
    else:
        smoke(args, root, smoke_parser)


if __name__ == "__main__":
    main()
