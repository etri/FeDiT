### templates.py
import re
from datetime import datetime

def make_digital_twin_payload(identifier: str, name: str) -> dict:
    return {
        "digital_twin_identifier": identifier,
        "digital_twin_name": name,
        "description": f"mcp로 등록한 디지털 트윈 {name} 입니다.",
        "owner": "mcp",
        "keywords": ["mcp", "디지털 트윈", name],
        "creation_time": datetime.now().strftime("%Y-%m-%dT%H%M%S"),
        "modification_time": datetime.now().strftime("%Y-%m-%dT%H%M%S"),
        "creator_id": "mcp"
    }

def make_digital_object_payload(identifier: str, name: str) -> dict:
    return {
        "digital_object_identifier": identifier,
        "digital_object_name": name,
        "description": f"mcp로 등록한 디지털 객체 {name} 입니다.",
        "keywords": ["mcp", "센서", "객체"],
        "creation_time": datetime.now().strftime("%Y-%m-%dT%H%M%S"),
        "modification_time": datetime.now().strftime("%Y-%m-%dT%H%M%S"),
        "subject": ["mcp"],
        "digital_object_data_source_type": "PUSH"
    }

def make_federated_twin_payload(identifier: str, name: str) -> dict:
    return {
        "federated_digital_twin_identifier": identifier,
        "federated_digital_twin_name": name,
        "point_of_access": "http://",
        "description": f"mcp로 등록한 연합 디지털 트윈 {name}입니다.",
        "owner": "mcp",
        "keywords": ["연합", "FDT", "mcp"],
        "creator_id": "mcp"
    }

def make_federated_object_payload(identifier: str, name: str, member_ids: list[str], fdt_id: str, time_sync_cond: dict | None = None,) -> dict:
    return {
        "federated_digital_object_identifier": identifier,
        "federated_digital_object_name": name,
        "description": f"mcp로 등록한 연합 디지털 트윈 객체 {name}입니다.",
        "keywords": ["연합", "FDO", "mcp"],
        "access_protocol": "kafka",
        "creator_id": "mcp",
        "member_digital_twin_object_ids": member_ids,
        "federated_digital_twin_id": fdt_id,
        "time_sync_cond": time_sync_cond or {"time_interval": 0}
    }

def make_simulation_payload(
    name: str,
    subject_ids: list[str],
    access_url: str,
    time_step: int,
    description: str = "simulation created through mcp",
    creator_id: str = "mcp",
    keywords: list[str] = ["mcp", "simulation"],
    simulation_type: str = "later",
    resource_type: str = "federated_digital_object",
    include_input: str = "false"
) -> dict:
    return {
        "simulation_name": name,
        "description": description,
        "creator_id": creator_id,
        "keywords": keywords,
        "simulation_subject": subject_ids,
        "simulation_access_url": access_url,
        "time_step": time_step,
        "simulation_type": simulation_type,
        "resource_type": resource_type,
        "include_input": include_input
    }

def make_fdo_control_payload(
    creator: str,
    fdo_control_id: str,
    commands: list[dict]
) -> dict:
    return {
        "control_data_creator": creator,
        "federated_digital_object_control_data_id": fdo_control_id,
        "commands": commands
    }

