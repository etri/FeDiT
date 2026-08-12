import asyncio
import json

import yaml

from fastapi import APIRouter, HTTPException, Query, Request, Response
from fastapi.responses import StreamingResponse

from app.auth import get_user_namespace, require_authenticated
from app.models.data_collection_models import (
    CollectionDatasetExportRequest,
    ConnectorCollectRequest,
    ConnectorCreateRequest,
    ConnectorRealtimeRequest,
    ConnectorRestOutputRequest,
    ConnectorRestOutputTestRequest,
    ConnectorUpdateRequest,
    DeviceDataIngestRequest,
    DeviceHeartbeatRequest,
    EdgeAgentSpecRequest,
    NifiFlowApplyRequest,
    NifiFlowSyncRequest,
    TwinCreateRequest,
    TwinUpdateRequest,
)
from app.services import data_collection_service


router = APIRouter()
devices_router = APIRouter()


async def _ingest_from_request(device_id: str, request: Request):
    ingest_token = request.headers.get("x-pm-ingest-token", "")
    ingest_namespace = request.headers.get("x-pm-namespace", "")
    if ingest_token:
        if not data_collection_service.validate_nifi_ingest_token(ingest_namespace, ingest_token):
            raise HTTPException(status_code=401, detail="유효하지 않은 NiFi 수집 인증 정보")
        namespace = ingest_namespace
        email = f"nifi@{namespace}.internal"
    else:
        email = require_authenticated(request)
        namespace = get_user_namespace(request)
    body = await request.body()
    content_type = (request.headers.get("content-type") or "").split(";")[0].strip().lower()
    try:
        if not body:
            req = DeviceDataIngestRequest()
            return data_collection_service.ingest_device_data(namespace, device_id, req, email)
        if content_type == "application/json" or body.lstrip().startswith((b"{", b"[")):
            payload = json.loads(body.decode("utf-8-sig"))
            if isinstance(payload, dict) and any(k in payload for k in ("payload", "twin_id", "connector_id", "timestamp", "meta")):
                return data_collection_service.ingest_device_data(namespace, device_id, DeviceDataIngestRequest(**payload), email)
        return data_collection_service.ingest_raw_device_data(namespace, device_id, body, dict(request.headers), content_type, email)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


def _not_found_or_bad_request(exc: ValueError) -> HTTPException:
    text = str(exc)
    status = 404 if "찾을 수 없습니다" in text else 400
    return HTTPException(status_code=status, detail=text)


@router.get("/overview")
async def overview(request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    return data_collection_service.overview(namespace)


@router.get("/twins")
async def list_twins(request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    return {"namespace": namespace, "twins": data_collection_service.list_twins(namespace)}


@router.post("/twins")
async def create_twin(req: TwinCreateRequest, request: Request):
    email = require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.create_twin(namespace, email, req)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.put("/twins/{twin_id}")
async def update_twin(twin_id: str, req: TwinUpdateRequest, request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.update_twin(namespace, twin_id, req)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.delete("/twins/{twin_id}")
async def delete_twin(twin_id: str, request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.delete_twin(namespace, twin_id)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.get("/twins/{twin_id}/detail")
async def get_twin_detail(twin_id: str, request: Request, limit: int = 30):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        twin = data_collection_service.get_twin(namespace, twin_id)
        connectors = [
            connector
            for connector in data_collection_service.list_connectors(namespace)
            if connector.get("twin_id") == twin_id
        ]
        records = data_collection_service.list_records(namespace, twin_id=twin_id, limit=limit)
        return {"namespace": namespace, "twin": twin, "connectors": connectors, "records": records}
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.get("/connectors")
async def list_connectors(request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    return {"namespace": namespace, "connectors": data_collection_service.list_connectors(namespace)}


@router.post("/connectors")
async def create_connector(req: ConnectorCreateRequest, request: Request):
    email = require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.create_connector(namespace, email, req)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.put("/connectors/{connector_id}")
async def update_connector(connector_id: str, req: ConnectorUpdateRequest, request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.update_connector(namespace, connector_id, req)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.delete("/connectors/{connector_id}")
async def delete_connector(connector_id: str, request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.delete_connector(namespace, connector_id)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.post("/connectors/{connector_id}/test")
async def test_connector(connector_id: str, request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.test_connector(namespace, connector_id)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.post("/connectors/{connector_id}/preview")
async def preview_connector_data(connector_id: str, request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        # The connector implementation is synchronous and may call an HTTP
        # endpoint.  Run it off the event loop so a connector targeting this
        # API does not deadlock while the preview request is being served.
        return await asyncio.to_thread(
            data_collection_service.preview_connector_data,
            namespace,
            connector_id,
        )
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.post("/connectors/{connector_id}/collect")
async def collect_connector_now(connector_id: str, request: Request, req: ConnectorCollectRequest | None = None):
    email = require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return await asyncio.to_thread(
            data_collection_service.collect_connector_now,
            namespace,
            connector_id,
            email,
            selected_attributes=(req.selected_attributes if req else None),
        )
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.post("/connectors/{connector_id}/realtime/start")
async def start_realtime_collection(connector_id: str, req: ConnectorRealtimeRequest, request: Request):
    email = require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.start_realtime_collection(
            namespace,
            connector_id,
            email,
            req.selected_attributes,
            req.interval_seconds,
        )
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.post("/connectors/{connector_id}/realtime/stop")
async def stop_realtime_collection(connector_id: str, request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.stop_realtime_collection(namespace, connector_id)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.get("/connectors/{connector_id}/realtime/status")
async def realtime_collection_status(connector_id: str, request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.get_realtime_collection_status(namespace, connector_id)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.get("/connectors/{connector_id}/rest-output")
async def connector_rest_output(connector_id: str, request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.get_connector_rest_output(namespace, connector_id)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.put("/connectors/{connector_id}/rest-output")
async def save_connector_rest_output(
    connector_id: str,
    req: ConnectorRestOutputRequest,
    request: Request,
):
    email = require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.save_connector_rest_output(
            namespace,
            connector_id,
            email,
            req,
        )
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.delete("/connectors/{connector_id}/rest-output")
async def delete_connector_rest_output(connector_id: str, request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.delete_connector_rest_output(namespace, connector_id)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.post("/connectors/{connector_id}/rest-output/test")
async def test_connector_rest_output(
    connector_id: str,
    req: ConnectorRestOutputTestRequest,
    request: Request,
):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.test_connector_rest_output(namespace, connector_id, req)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.get("/connectors/{connector_id}/rest-output/logs")
async def connector_rest_output_logs(connector_id: str, request: Request, limit: int = 30):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return {
            "connector_id": connector_id,
            "logs": data_collection_service.list_connector_rest_output_logs(
                namespace,
                connector_id,
                limit,
            ),
        }
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.get("/connectors/{connector_id}/edge-agent")
async def connector_edge_agent(connector_id: str, request: Request, device_id: str = "", format: str = "json"):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        spec = data_collection_service.edge_agent_spec(
            namespace,
            EdgeAgentSpecRequest(connector_id=connector_id, device_id=device_id, format=format if format in {"json", "yaml", "python", "curl"} else "json"),
        )
    except ValueError as e:
        raise _not_found_or_bad_request(e)
    fmt = (format or "json").lower()
    if fmt == "yaml":
        return Response(content=yaml.safe_dump(spec["config"], allow_unicode=True, sort_keys=False), media_type="text/yaml; charset=utf-8")
    if fmt == "python":
        return Response(content=spec["python"], media_type="text/x-python; charset=utf-8")
    if fmt == "curl":
        return Response(content=spec["curl"], media_type="text/plain; charset=utf-8")
    return spec


@router.post("/nifi/sync")
async def sync_nifi_flow(req: NifiFlowSyncRequest, request: Request):
    email = require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.sync_nifi_flow_spec(namespace, email, req)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.get("/nifi/flow-spec/latest")
async def latest_nifi_flow(request: Request, connector_id: str = ""):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    spec = data_collection_service.latest_nifi_flow_spec(namespace, connector_id)
    return {"namespace": namespace, "flow_spec": spec}


@router.post("/nifi/apply")
async def apply_nifi_flow(req: NifiFlowApplyRequest, request: Request):
    email = require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.apply_nifi_flow_spec(namespace, email, req)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.get("/records")
async def list_records(
    request: Request,
    twin_id: str = "",
    device_id: str = "",
    connector_id: str = "",
    limit: int = 100,
):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    return {
        "namespace": namespace,
        "records": data_collection_service.list_records(namespace, twin_id, device_id, connector_id, limit),
    }


@router.get("/records/stream")
async def stream_records(
    request: Request,
    twin_id: str = "",
    connector_id: str = "",
):
    require_authenticated(request)
    namespace = get_user_namespace(request)

    async def event_stream():
        initial_records = data_collection_service.list_records(
            namespace,
            twin_id=twin_id,
            connector_id=connector_id,
            limit=200,
        )
        known_ids = {record["id"] for record in initial_records}
        ready = {
            "type": "ready",
            "namespace": namespace,
            "records": initial_records[:80],
        }
        yield f"data: {json.dumps(ready, ensure_ascii=False)}\n\n"
        heartbeat_ticks = 0
        while not await request.is_disconnected():
            records = data_collection_service.list_records(
                namespace,
                twin_id=twin_id,
                connector_id=connector_id,
                limit=200,
            )
            new_records = [record for record in reversed(records) if record["id"] not in known_ids]
            for record in new_records:
                known_ids.add(record["id"])
                payload = {"type": "record", "record": record}
                yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
            if len(known_ids) > 1000:
                known_ids = {record["id"] for record in records}
            heartbeat_ticks += 1
            if heartbeat_ticks >= 15:
                heartbeat_ticks = 0
                yield ": heartbeat\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/records/export")
async def export_records(
    request: Request,
    format: str = "csv",
    twin_id: str = "",
    device_id: str = "",
    connector_id: str = "",
    limit: int = 500,
    record_ids: list[str] = Query(default=[]),
    selected_attributes: list[str] = Query(default=[]),
):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    records = (
        data_collection_service.list_records_by_ids(namespace, record_ids)
        if record_ids
        else data_collection_service.list_records(namespace, twin_id, device_id, connector_id, limit)
    )
    fmt = (format or "csv").strip().lower()
    if fmt == "json":
        exported_records = (
            data_collection_service.records_to_selected_rows(records, selected_attributes)
            if selected_attributes
            else data_collection_service.records_to_json(records)
        )
        content = json.dumps({"namespace": namespace, "records": exported_records}, ensure_ascii=False, indent=2)
        return Response(
            content=content,
            media_type="application/json; charset=utf-8",
            headers={"Content-Disposition": 'attachment; filename="collection-records.json"'},
        )
    if fmt != "csv":
        raise HTTPException(status_code=400, detail="지원하지 않는 export format입니다.")

    return Response(
        content=(
            data_collection_service.records_to_selected_csv(records, selected_attributes)
            if selected_attributes
            else data_collection_service.records_to_csv(records)
        ),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="collection-records.csv"'},
    )


@router.post("/records/dataset-version")
async def create_dataset_version_from_records(req: CollectionDatasetExportRequest, request: Request):
    email = require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.export_records_to_dataset(namespace, email, req)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.get("/records/{record_id}")
async def get_record(record_id: str, request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.get_record(namespace, record_id)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.post("/devices/{device_id}/data")
async def ingest_device_data(device_id: str, request: Request):
    return await _ingest_from_request(device_id, request)


@router.post("/devices/{device_id}/heartbeat")
async def heartbeat_device(device_id: str, req: DeviceHeartbeatRequest, request: Request):
    email = require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.heartbeat_device(namespace, device_id, req, email)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@router.delete("/records/{record_id}")
async def delete_record(record_id: str, request: Request):
    require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.delete_record(namespace, record_id)
    except ValueError as e:
        raise _not_found_or_bad_request(e)


@devices_router.post("/{device_id}/data")
async def ingest_device_data_short_path(device_id: str, request: Request):
    return await _ingest_from_request(device_id, request)


@devices_router.post("/{device_id}/heartbeat")
async def heartbeat_device_short_path(device_id: str, req: DeviceHeartbeatRequest, request: Request):
    email = require_authenticated(request)
    namespace = get_user_namespace(request)
    try:
        return data_collection_service.heartbeat_device(namespace, device_id, req, email)
    except ValueError as e:
        raise _not_found_or_bad_request(e)
