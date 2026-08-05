from typing import Literal
from pydantic import BaseModel, Field


DatasetType = Literal["csv", "json", "jsonl", "parquet", "image"]
DatasetTask = Literal["regression", "classification", "labeling", "unknown"]
DatasetSourceKind = Literal["raw", "preprocessed", "image_standardized", "labeling_project", "labeling_export", "collection_export", "nifi_output", "external_uri"]
DatasetVersionStatus = Literal["registered", "ready", "published", "deprecated", "archived"]


class DatasetCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    description: str = ""
    data_type: DatasetType = "csv"
    task: DatasetTask = "unknown"
    target_column: str = ""


class DatasetVersionCreateRequest(BaseModel):
    source_uri: str = Field(..., min_length=1)
    source_kind: DatasetSourceKind = "external_uri"
    file_name: str = ""
    pipeline_ready: bool = False
    notes: str = ""
    metadata: dict = Field(default_factory=dict)


class PreprocessRequest(BaseModel):
    source_versions: list[int] | None = None
    task: DatasetTask | None = None
    target_column: str | None = None
    clean_columns: bool = True
    fill_missing: bool = True
    expand_payload_json: bool = True
    drop_duplicates: bool = True
    normalize_numeric: bool = False
    remove_outliers: bool = False
    sample_rows: int | None = Field(default=None, ge=1, le=1_000_000)
    output_name: str = "preprocessed.csv"
    pipeline_ready: bool = True
    notes: str = ""


class ImageStandardizeRequest(BaseModel):
    target_format: Literal["jpeg", "png"] = "jpeg"
    max_width: int | None = Field(default=None, ge=1, le=10000)
    max_height: int | None = Field(default=None, ge=1, le=10000)
    keep_aspect_ratio: bool = True
    background_color: str = "#ffffff"
    quality: int = Field(default=95, ge=1, le=100)
    output_name: str = "standardized-images.zip"
    pipeline_ready: bool = True
    notes: str = ""


class LabelStudioProjectRequest(BaseModel):
    project_name: str = ""
    label_config: str = ""
    data_key: str = "image"
    file_path_column: str = "file_path"
    task_limit: int = Field(default=500, ge=1, le=5000)
    create_remote: bool = False
    output_name: str = "label-studio-project.json"
    notes: str = ""


class DatasetVersionUpdateRequest(BaseModel):
    status: DatasetVersionStatus | None = None
    pipeline_ready: bool | None = None
    target_column: str | None = None
    notes: str | None = None
    metadata: dict = Field(default_factory=dict)


class PipelineInputsRequest(BaseModel):
    registered_name: str = ""
    target_column: str = ""
    threshold: float = 0.90
    max_attempts: int = 10


class PipelineRunRecordRequest(BaseModel):
    dataset_version: int = Field(..., ge=1)
    run_id: str = Field(..., min_length=1)
    run_name: str = ""
    state: str = ""
    experiment_id: str = ""
    experiment_name: str = ""
    pipeline_id: str = ""
    pipeline_name: str = ""
    pipeline_version_id: str = ""
    pipeline_version_name: str = ""
    service_account: str = ""
    ui_url: str = ""
    params: dict = Field(default_factory=dict)
    kfp_run: dict = Field(default_factory=dict)


class PipelineRunStatusUpdateRequest(BaseModel):
    state: str = ""
    kfp_run: dict = Field(default_factory=dict)
