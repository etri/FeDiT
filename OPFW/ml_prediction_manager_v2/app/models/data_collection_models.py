from typing import Any, Literal

from pydantic import BaseModel, Field


ConnectorType = Literal["mqtt", "rest", "kafka", "redis", "custom"]
ConnectorStatus = Literal["draft", "ready", "error", "offline"]
TwinStatus = Literal["online", "offline", "warning", "unknown"]


class ConnectorCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    connector_type: ConnectorType = "mqtt"
    twin_id: str = ""
    endpoint_url: str = ""
    port: int | None = Field(default=None, ge=1, le=65535)
    topic: str = ""
    method: str = ""
    yaml_config: str = ""
    status: ConnectorStatus | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ConnectorUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    connector_type: ConnectorType | None = None
    twin_id: str | None = None
    endpoint_url: str | None = None
    port: int | None = Field(default=None, ge=1, le=65535)
    topic: str | None = None
    method: str | None = None
    yaml_config: str | None = None
    status: ConnectorStatus | None = None
    metadata: dict[str, Any] | None = None


class TwinCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    description: str = ""
    status: TwinStatus = "offline"
    metadata: dict[str, Any] = Field(default_factory=dict)


class TwinUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = None
    status: TwinStatus | None = None
    metadata: dict[str, Any] | None = None


class DeviceDataIngestRequest(BaseModel):
    twin_id: str = ""
    connector_id: str = ""
    dataset_id: str = ""
    timestamp: str = ""
    type: str = "sensor"
    file_path: str = ""
    payload: dict[str, Any] = Field(default_factory=dict)
    meta: dict[str, Any] = Field(default_factory=dict)


class ConnectorCollectRequest(BaseModel):
    selected_attributes: list[str] = Field(default_factory=list)


class ConnectorRealtimeRequest(BaseModel):
    selected_attributes: list[str] = Field(default_factory=list)
    interval_seconds: float = Field(default=3.0, ge=1.0, le=3600.0)


class ConnectorRestOutputRequest(BaseModel):
    enabled: bool = False
    target_url: str = ""
    method: Literal["POST", "PUT", "PATCH"] = "POST"
    headers: dict[str, str] | None = None
    clear_headers: bool = False
    selected_fields: list[str] = Field(default_factory=list)
    flatten_ngsi_values: bool = True
    include_timestamp: bool = True
    field_mapping: dict[str, str] = Field(default_factory=dict)
    static_fields: dict[str, Any] = Field(default_factory=dict)
    envelope_key: str = ""
    timeout_seconds: float = Field(default=10.0, ge=1.0, le=30.0)


class ConnectorRestOutputTestRequest(ConnectorRestOutputRequest):
    sample_payload: dict[str, Any] = Field(default_factory=dict)



class DeviceHeartbeatRequest(BaseModel):
    twin_id: str = ""
    connector_id: str = ""
    status: TwinStatus = "online"
    timestamp: str = ""
    meta: dict[str, Any] = Field(default_factory=dict)


class CollectionDatasetExportRequest(BaseModel):
    dataset_id: str = ""
    dataset_name: str = Field(default="collection-records", min_length=1, max_length=80)
    description: str = ""
    twin_id: str = ""
    device_id: str = ""
    connector_id: str = ""
    record_ids: list[str] = Field(default_factory=list)
    selected_attributes: list[str] = Field(default_factory=list)
    limit: int = Field(default=500, ge=1, le=500)
    file_name: str = "collection-records.csv"
    pipeline_ready: bool = False
    publish: bool = False
    notes: str = ""



class NifiFlowSyncRequest(BaseModel):
    connector_id: str = ""
    connector_ids: list[str] = Field(default_factory=list)
    include_draft: bool = True
    auto_start: bool = False


class NifiFlowApplyRequest(BaseModel):
    spec_id: str = ""
    connector_id: str = ""
    connector_ids: list[str] = Field(default_factory=list)
    include_draft: bool = True
    auto_start: bool = False
    dry_run: bool = False


class EdgeAgentSpecRequest(BaseModel):
    connector_id: str = ""
    device_id: str = ""
    format: Literal["json", "yaml", "python", "curl"] = "json"
