import asyncio
import csv
import io
import json
import mimetypes

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from starlette.concurrency import run_in_threadpool

from modules.api.workspace.schemas import DatasetTitle, ScenarioRetry
from modules.api.workspace.security import COOKIE, WorkspaceSessions
from modules.application.workspace.contracts import (
    AnalysisRequest,
    DispersionRequest,
    DispersionScenarioRequest,
    PredictRequest,
    Register,
    SceneRequest,
    ServerRegister,
)
from modules.domain.errors import ApiError
from modules.infrastructure.filesystem.uploads import CHUNK_BYTES, FILE_BYTES


def sessions(request: Request):
    security = getattr(request.app.state, "workspace_sessions", None)
    if security is None:
        service = getattr(request.app.state, "workspace", None)
        if service is None:
            raise ApiError(503, "Workspace is unavailable.")
        security = WorkspaceSessions(service.root)
        request.app.state.workspace_sessions = security
    return security


def workspace(request: Request):
    service = getattr(request.app.state, "workspace", None)
    if service is None:
        raise ApiError(503, "Workspace is unavailable.")
    sessions(request).session(request, mutation=request.method not in {"GET", "HEAD", "OPTIONS"})
    return service


router = APIRouter(prefix="/app-api", dependencies=[Depends(workspace)])


def tus_version(request):
    if request.headers.get("tus-resumable") != "1.0.0":
        raise ApiError(412, "Tus-Resumable must be 1.0.0.")


def integer_header(request, name):
    value = request.headers.get(name, "")
    if len(value) > 20 or not value.isascii() or not value.isdecimal():
        raise ApiError(400, f"{name} must be a nonnegative integer.")
    return int(value)


@router.get("/session")
def session(request: Request):
    workspace(request)
    session_id = sessions(request).session(request)
    response = JSONResponse(
        {
            "csrfToken": sessions(request).csrf(session_id),
            "upload": {
                "chunkBytes": CHUNK_BYTES,
                "maxFileBytes": FILE_BYTES,
                "maxBundleBytes": 64 * 1024**3,
                "concurrentFiles": 2,
                "expiresAfterSeconds": 7 * 86400,
            },
        }
    )
    response.set_cookie(
        COOKIE,
        session_id,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="strict",
        max_age=7 * 86400,
        path="/app-api",
    )
    response.headers["Cache-Control"] = "no-store"
    return response


@router.options("/uploads")
@router.options("/uploads/{upload_id}")
def upload_options(upload_id: str | None = None):
    return Response(
        status_code=204,
        headers={
            "Tus-Version": "1.0.0",
            "Tus-Resumable": "1.0.0",
            "Tus-Extension": "creation,termination,expiration,checksum",
            "Tus-Checksum-Algorithm": "sha1,sha256",
            "Tus-Max-Size": str(FILE_BYTES),
        },
    )


@router.post("/uploads", status_code=201)
def create_upload(request: Request):
    tus_version(request)
    service = workspace(request)
    record = service.uploads.create(
        integer_header(request, "Upload-Length"),
        request.headers.get("upload-metadata"),
        sessions(request).session(request, mutation=True),
    )
    return Response(
        status_code=201,
        headers=service.uploads.headers(record)
        | {
            "Location": f"/app-api/uploads/{record['_id']}",
        },
    )


@router.head("/uploads/{upload_id}")
def head_upload(upload_id: str, request: Request):
    tus_version(request)
    service = workspace(request)
    record = service.uploads.get(upload_id, sessions(request).session(request))
    return Response(headers=service.uploads.headers(record))


@router.get("/uploads")
def list_uploads(request: Request):
    service = workspace(request)
    owner = sessions(request).session(request)
    items = [
        {
            "id": item["_id"],
            "filename": item["filename"],
            "length": item["length"],
            "offset": item["offset"],
            "expiresAt": item["expiresAt"],
            "fingerprint": item.get("fingerprint"),
        }
        for item in service.uploads.collection.find({"owner": owner, "registered": False}).limit(512)
    ]
    return {"uploads": items}


@router.get("/uploads/{upload_id}/identity")
def upload_identity(upload_id: str, request: Request):
    service = workspace(request)
    return service.uploads.identity(upload_id, sessions(request).session(request))


@router.patch("/uploads/{upload_id}")
async def patch_upload(upload_id: str, request: Request):
    tus_version(request)
    if request.headers.get("content-type", "").split(";", 1)[0].strip() != "application/offset+octet-stream":
        raise ApiError(415, "Upload chunks require application/offset+octet-stream.")
    service = workspace(request)
    offset = integer_header(request, "Upload-Offset")
    length = integer_header(request, "Content-Length") if "content-length" in request.headers else None
    if length is not None and length > CHUNK_BYTES:
        raise ApiError(413, "Upload chunk exceeds the 32 MiB limit.")
    semaphore = getattr(request.app.state, "workspace_upload_slots", None)
    if semaphore is None:
        semaphore = asyncio.Semaphore(2)
        request.app.state.workspace_upload_slots = semaphore
    owner = sessions(request).session(request, mutation=True)
    checksum = request.headers.get("upload-checksum")
    if checksum and (" " not in checksum or len(checksum) > 128):
        raise ApiError(400, "Upload-Checksum is invalid.")
    async with semaphore:
        lock = service.uploads.lock(upload_id)
        await run_in_threadpool(lock.__enter__)
        stream = None
        record = None
        try:
            record, stream = await run_in_threadpool(service.uploads.open_patch, upload_id, owner, offset)
            received = 0
            async for chunk in request.stream():
                received += len(chunk)
                if received > CHUNK_BYTES or offset + received > record["length"]:
                    raise ApiError(413, "Upload chunk exceeds its size or remaining file limit.")
                if chunk:
                    await run_in_threadpool(stream.write, chunk)
            if length is not None and received != length:
                raise ApiError(400, "Upload chunk length does not match Content-Length.")
            result = await run_in_threadpool(service.uploads.commit, record, stream, received, checksum)
            return Response(status_code=204, headers=service.uploads.headers(result))
        except BaseException:
            if stream is not None and record is not None:
                await run_in_threadpool(stream.truncate, record["offset"])
            raise
        finally:
            if stream is not None:
                await run_in_threadpool(stream.close)
            await run_in_threadpool(lock.__exit__, None, None, None)


@router.delete("/uploads/{upload_id}", status_code=204)
def cancel_upload(upload_id: str, request: Request):
    service = workspace(request)
    service.uploads.cancel(upload_id, sessions(request).session(request, mutation=True))
    return Response(status_code=204, headers={"Tus-Resumable": "1.0.0"})


@router.get("/datasets")
def list_datasets(request: Request):
    return workspace(request).list_datasets()


@router.get("/sources")
def list_sources(request: Request):
    return workspace(request).list_sources()


@router.post("/datasets/from-server", status_code=202)
def register_server_dataset(body: ServerRegister, request: Request):
    return workspace(request).register_server(body)


@router.post("/dispersion", status_code=202)
def dispersion(body: DispersionRequest, request: Request):
    return workspace(request).dispersion(body)


@router.post("/dispersion-scenarios", status_code=202)
def create_dispersion_scenario(body: DispersionScenarioRequest, request: Request):
    return {"scenario": workspace(request).create_scenario(body)}


@router.get("/dispersion-scenarios")
def list_dispersion_scenarios(request: Request, datasetId: str | None = None):
    return workspace(request).list_scenarios(datasetId)


@router.get("/dispersion-scenarios/{scenario_id}")
def get_dispersion_scenario(scenario_id: str, request: Request):
    return {"scenario": workspace(request).scenario(scenario_id)}


@router.post("/dispersion-scenarios/{scenario_id}/cancel")
def cancel_dispersion_scenario(scenario_id: str, request: Request):
    return {"scenario": workspace(request).cancel_scenario(scenario_id)}


@router.post("/dispersion-scenarios/{scenario_id}/retry", status_code=202)
def retry_dispersion_scenario(scenario_id: str, request: Request, body: ScenarioRetry | None = None):
    return {"scenario": workspace(request).retry_scenario(scenario_id, body.role if body else None)}


@router.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: str, request: Request, resultId: str | None = None):
    return workspace(request).dataset(dataset_id, resultId)


@router.patch("/datasets/{dataset_id}")
def rename_dataset(dataset_id: str, body: DatasetTitle, request: Request):
    return workspace(request).rename_dataset(dataset_id, body.title)


@router.get("/datasets/{dataset_id}/thumbnail")
def dataset_thumbnail(dataset_id: str, request: Request):
    try:
        path = workspace(request).thumbnail(dataset_id)
    except ApiError as error:
        if error.status == 503:
            return JSONResponse({"detail": error.detail}, status_code=503, headers={"Retry-After": "2"})
        raise
    etag = f'"{path.stem}"'
    headers = {"Cache-Control": "private, max-age=86400", "ETag": etag, "X-Content-Type-Options": "nosniff"}
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)
    return FileResponse(path, media_type="image/png", headers=headers)


@router.post("/datasets", status_code=202)
def register_dataset(body: Register, request: Request):
    service = workspace(request)
    return service.register(body, sessions(request).session(request, mutation=True))


@router.post("/scene")
def scene(body: SceneRequest, request: Request):
    return workspace(request).selection(body, "scene")


@router.post("/analysis")
def analysis(body: AnalysisRequest, request: Request):
    return workspace(request).selection(body, "analysis")


@router.get("/assets/{name}")
def asset(name: str, request: Request):
    path = workspace(request).asset(name)
    media_type = {
        ".bin": "application/octet-stream",
        ".glb": "model/gltf-binary",
        ".json": "application/json",
    }.get(path.suffix, mimetypes.guess_type(str(path))[0] or "application/octet-stream")
    return FileResponse(
        path,
        media_type=media_type,
        headers={
            "Cache-Control": "private, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.get("/jobs")
def jobs(request: Request):
    return workspace(request).list_jobs()


@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: str, request: Request):
    return workspace(request).cancel(job_id)


@router.post("/jobs/{job_id}/retry")
def retry_job(job_id: str, request: Request):
    return workspace(request).retry(job_id)


@router.post("/predict", status_code=202)
def predict(body: PredictRequest, request: Request):
    return workspace(request).predict(body)


@router.get("/state")
def get_state(request: Request):
    return {"state": workspace(request).get_state()}


@router.put("/state")
async def save_state(request: Request):
    raw = bytearray()
    async for block in request.stream():
        raw.extend(block)
        if len(raw) > 1024 * 1024:
            raise ApiError(413, "Workspace settings exceed the 1 MiB limit.")
    try:
        value = json.loads(raw)
        if not isinstance(value, dict):
            raise ValueError("Not an object")
        json.dumps(value, allow_nan=False)
    except (ValueError, TypeError):
        raise ApiError(422, "Workspace settings must be a finite JSON object.") from None
    await run_in_threadpool(workspace(request).save_state, value)
    return {"state": value}


@router.post("/exports/analysis.csv")
def export_analysis(body: AnalysisRequest, request: Request):
    data = workspace(request).selection(body, "analysis")
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["context_key", data["contextKey"]])
    writer.writerow(["field", data["field"]["id"], "unit", data["field"]["unit"]])
    volumetric = data.get("analysisKind", "volume") == "volume"
    writer.writerow(
        ["probe_id", "time_s", "value"] if volumetric else ["probe_id", "axis_value", "axis_unit", "value"]
    )
    for series in data["timeseries"]:
        for timestamp, value in zip(series["times"], series["values"]):
            if volumetric:
                writer.writerow([series["id"], timestamp, value])
            else:
                unit = series.get("timeUnit", data["method"].get("timeUnit", "frame"))
                writer.writerow([series["id"], timestamp, "deg" if unit == "direction" else unit, value])
    writer.writerow([])
    writer.writerow(["bin_min", "bin_max", "volume_m3" if volumetric else "sample_count", "percentage"])
    histogram = data["histogram"]
    for lower, upper, volume, percent in zip(
        histogram["edges"],
        histogram["edges"][1:],
        histogram["volumes" if volumetric else "counts"],
        histogram["percentages"],
    ):
        writer.writerow([lower, upper, volume, percent])
    if volumetric:
        writer.writerow(["valid_volume_m3", data["validVolume"]])
        writer.writerow(["threshold_volume_m3", data["thresholdVolume"]])
    else:
        writer.writerow(["sample_count", data["statistics"]["cells"]])
    writer.writerow(["method", json.dumps(data["method"], sort_keys=True)])
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="flowcast-analysis.csv"',
            "Cache-Control": "no-store",
        },
    )
