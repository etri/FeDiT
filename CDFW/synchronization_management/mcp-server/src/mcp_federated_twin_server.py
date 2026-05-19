# mcp_federated_twin_server.py
import requests
from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.server import Settings
import sys
from datetime import datetime
import json
import traceback
from templates import (
    make_digital_twin_payload,
    make_digital_object_payload,
    make_federated_twin_payload,
    make_federated_object_payload,
    make_simulation_payload,
    make_fdo_control_payload
)


mcp = FastMCP("FederatedTwinServer")
HOST = "172.26.28.126"  # 서버 호스트 주소
CONNECTOR_BASE_URL = f"http://{HOST}:1219/fedit/v1"
BRAIN_BASE_URL = f"http://{HOST}:1213/fedit/v1/federated-twins"

@mcp.resource("fedit://digital-twins")
def all_digital_twins() -> list[dict]:
    print("resource) all_digital_twins...")
    """등록된 모든 디지털 트윈(Digital Twin) 정보를 조회합니다."""
    res = requests.get(f"{CONNECTOR_BASE_URL}/digital-twins")
    print("all_digital_twins response:", res.status_code, res.text)
    return res.json() if res.ok else { "msg":"조회 실패", "error": res.text}

@mcp.resource("fedit://digital-twins/{digital_twin_id}/digital-objects")
def all_digital_objects(digital_twin_id: str) -> list[dict]:
    print("resource) all_digital_objects...")
    """지정한 디지털 트윈에 속한 객체들을 조회합니다."""
    res = requests.get(f"{CONNECTOR_BASE_URL}/digital-twins/{digital_twin_id}/digital-objects")
    return res.json() if res.ok else {"msg": "조회 실패", "error": res.text}

@mcp.resource("fedit://federated-twins")
def all_federated_digital_twins() -> list[dict]:
    print("resource) all_federated_digital_twins...")
    """등록된 모든 연합 디지털 트윈(Federated Digital Twin) 정보를 조회합니다."""
    res = requests.get(f"{BRAIN_BASE_URL}")
    print("all_federated_digital_twins response:", res.status_code, res.text)
    return res.json() if res.ok else { "msg":"조회 실패", "error": res.text}

@mcp.resource("fedit://federated-twins/{federated_twin_id}/federated-digital-objects")
def all_federated_digital_objects(federated_twin_id: str) -> list[dict]:
    print("resource) all_federated_digital_objects...")
    """지정한 federated_twin_id에 등록된 모든 연합 디지털 객체(Federated Digital Object) 정보를 조회합니다."""
    res = requests.get(f"{BRAIN_BASE_URL}/{federated_twin_id}/federated-digital-objects")
    return res.json() if res.ok else { "msg":"조회 실패", "error": res.text}


@mcp.tool(description="등록된 모든 연합 디지털 트윈 정보를 요약해 반환합니다.")
def list_federated_digital_twins() -> str:
    print("tool) list_federated_digital_twins...")
    try:
        ftwins = all_federated_digital_twins()
        print("ftwins) ", ftwins)
        if not isinstance(ftwins, list):
            return "[오류] 연합 디지털 트윈 데이터를 불러올 수 없습니다."
        if not ftwins:
            return "등록된 연합 디지털 트윈이 없습니다."

        result = "📦 등록된 연합 디지털 트윈(FDT) 목록:\n"
        for fdt in ftwins:
            if not isinstance(fdt, dict):
                continue

            keywords = fdt.get("keywords", [])
            keywords_str = (
                ", ".join(keywords[:5]) +
                (" ...더 있음" if len(keywords) > 5 else "")
            ) if keywords else "-"

            # location 정보는 null이거나 dict일 수 있으니 방어
            lat = "-"
            lng = "-"
            location = fdt.get("location")
            if isinstance(location, dict):
                lat = location.get("lat", "-")
                lng = location.get("lng", "-")

            result += (
                f"\nID: `{fdt.get('federated_digital_twin_id', '-')}`"
                f"\n이름: **{fdt.get('federated_digital_twin_name', '-') }**"
                f"\n설명: {fdt.get('description', '-')[:80]}{'...' if len(fdt.get('description', '')) > 80 else ''}"
                f"\n접근주소: {fdt.get('point_of_access', '-')}"
                f"\n키워드: {keywords_str}"
                f"\n연결 FDO 수: {fdt.get('number_of_federated_digital_objects', 0)}"
                f", 구독: {fdt.get('number_of_subscriptions', 0)}"
                f", 서비스: {fdt.get('number_of_services', 0)}"
                f", 시뮬레이션: {fdt.get('number_of_simulations', 0)}"
                f", DT 수: {fdt.get('number_of_digital_twins', 0)}"
                f", 3D 모델: {fdt.get('number_of_visual_models', 0)}"
                f"\n생성자: {fdt.get('creator_id', '-')}, 생성일: {fdt.get('creation_time', '-')[:10]}"
                f"\n위치: 위도 {lat}, 경도 {lng}"
                "\n─────────────────────────────"
            )
        return result

    except Exception as e:
        return f"[예외 발생] {str(e)}"



@mcp.tool(description="등록된 모든 디지털 트윈 정보를 요약해 반환합니다.")
def list_digital_twins() -> str:
    print("tool) list_digital_twins...")
    try:
        twins = all_digital_twins()
        print("twins) ", twins)
        if not isinstance(twins, list):
            return "[오류] 디지털 트윈 데이터를 불러올 수 없습니다."
        if not twins:
            return "등록된 디지털 트윈이 없습니다."

        result = "📦 등록된 디지털 트윈 목록:\n"
        for tw in twins:
            if not isinstance(tw, dict):
                continue

            location = tw.get("location") or {}
            lat = location.get("lat", "-") if isinstance(location, dict) else "-"
            lng = location.get("lng", "-") if isinstance(location, dict) else "-"

            member_ids = tw.get("member_digital_objects_ids") or []
            safe_ids = [str(i) for i in member_ids if i is not None]
            member_ids_str = (
                ", ".join(safe_ids[:5]) +
                (" ...더 있음" if len(safe_ids) > 5 else "")
            ) if safe_ids else "-"

            result += (
                f"\nID: `{tw.get('digital_twin_id', '-')}`"
                f"\n이름: **{tw.get('digital_twin_name', '-') }**"
                f"\n설명: {tw.get('description', '-')[:100]}{'...' if len(tw.get('description', '')) > 100 else ''}"
                f"\n포인트 접근: {tw.get('point_of_access', '-')}"
                f"\n연결된 DO: {member_ids_str} (총 {tw.get('number_of_digital_objects', 0) or 0}개)"
                f"\n서비스: {tw.get('number_of_services', 0) or 0}개, 시뮬레이션: {tw.get('number_of_simulations', 0) or 0}개"
                f"\n생성자: {tw.get('creator_id', '-')}, 생성일: {str(tw.get('creation_time', '-'))[:10]}"
                f"\n위치: 위도 {lat}, 경도 {lng}"
                "\n─────────────────────────────"
            )
        return result

    except Exception as e:
        return f"[예외 발생] {e}\n{traceback.format_exc()}"

    
@mcp.tool(description="등록된 모든 연합 디지털 객체(FDO) 정보를 요약해 보기 좋게 반환합니다.")
def list_federated_digital_objects(federated_twin_id: str) -> str:
    print("tool) list_federated_digital_objects...")
    try:
        fdo_list = all_federated_digital_objects(federated_twin_id)
        print("fdo_list)", fdo_list)
        if not isinstance(fdo_list, list):
            return "[오류] 연합 디지털 객체 데이터를 불러올 수 없습니다."
        if not fdo_list:
            return "등록된 연합 디지털 객체(FDO)가 없습니다."

        result = f"🧩 연합 디지털 객체(FDO) 목록 (FDT: {federated_twin_id}):\n"
        for fdo in fdo_list:
            if not isinstance(fdo, dict):
                continue

            member_ids = fdo.get("member_digital_twin_object_ids", [])
            member_ids_str = (
                ", ".join(member_ids[:5]) +
                (" ...더 있음" if len(member_ids) > 5 else "")
            ) if member_ids else "-"

            keywords = fdo.get("keywords", [])
            keywords_str = (
                ", ".join(keywords[:5]) +
                (" ...더 있음" if len(keywords) > 5 else "")
            ) if keywords else "-"

            # location은 null일 수 있으니 방어
            lat = "-"
            lng = "-"
            location = fdo.get("location")
            if isinstance(location, dict):
                lat = location.get("lat", "-")
                lng = location.get("lng", "-")

            result += (
                f"\nID: `{fdo.get('federated_digital_object_id', '-')}`"
                f"\n이름: **{fdo.get('federated_digital_object_name', '-') }**"
                f"\n설명: {fdo.get('description', '-')[:80]}{'...' if len(fdo.get('description', '')) > 80 else ''}"
                f"\nFDT ID: `{fdo.get('federated_digital_twin_id', '-')}`"
                f"\n연결된 DO: {member_ids_str} (총 {fdo.get('member_digital_twin_object_count', 0)}개)"
                f"\n접근 프로토콜: {fdo.get('access_protocol', '-')}"
                f"\n키워드: {keywords_str}"
                f"\n생성자: {fdo.get('creator_id', '-')}, 생성일: {fdo.get('creation_time', '-')[:10]}"
                f"\n위치: 위도 {lat}, 경도 {lng}"
                "\n─────────────────────────────"
            )
        return result

    except Exception as e:
        return f"[예외 발생] {str(e)}"


@mcp.tool(description="등록된 모든 디지털 객체(DO) 정보를 요약해 보기 좋게 반환합니다.")
def list_digital_objects(digital_twin_id: str) -> str:
    print("tool) list_digital_objects...")
    try:
        dos = all_digital_objects(digital_twin_id)
        if not isinstance(dos, list):
            return "[오류] 디지털 객체 데이터를 불러오지 못했습니다."
        if not dos:
            return "등록된 디지털 객체(DO)가 없습니다."

        result = "🧱 등록된 디지털 객체 목록:\n"
        for do in dos:
            result += (
                f"\n ID: `{do.get('digital_object_id', '-')}` / 이름: **{do.get('digital_object_name', '-') }**\n"
                f" 설명: {do.get('description', '-')[:80]}{'...' if len(do.get('description', '')) > 80 else ''}\n"
                f" 소속 DT: `{do.get('digital_twin_id', '-')}` / 생성자: `{do.get('creator_id', '-')}`\n"
                f" 접근 방식: `{do.get('access_protocol', '-')}` / 센서 수: `{do.get('member_sensor_count', 0)}`\n"
                f" 연결 센서: {', '.join(do.get('member_sensor_ids', [])[:3])} {'...더 있음' if len(do.get('member_sensor_ids', [])) > 3 else ''}\n"
                f" 태그: {', '.join(do.get('tags', [])[:5])} {'...더 있음' if len(do.get('tags', [])) > 5 else ''}\n"
                f" 생성일: {do.get('creation_time', '-')[:10]}\n"
                "─────────────────────────────"
            )
        return result

    except Exception as e:
        return f"[예외 발생] {str(e)}"

@mcp.tool(description="지정된 연합 디지털 트윈(FDT)의 모든 시뮬레이션 목록을 조회합니다.")
def list_simulations(fdt_id: str) -> dict:
    print("tool) list_simulations...")
    try:
        url = f"{BRAIN_BASE_URL}/{fdt_id}/simulations"
        res = requests.get(url)
        if not res.ok:
            return f"[조회 실패] {res.status_code} {res.text}"

        sims = res.json()
        if not isinstance(sims, list):
            return "[오류] 시뮬레이션 데이터를 불러오지 못했습니다."
        if not sims:
            return f"FDT `{fdt_id}`에 등록된 시뮬레이션이 없습니다."

        lines = [f"🎯 **연합 디지털 트윈 `{fdt_id}`의 시뮬레이션 목록**"]

        for sim in sims:
            sim = sim or {}
            sim_id = sim.get("simulation_id", "-")
            name = sim.get("simulation_name", "-")
            state = sim.get("simulation_state", "-")
            step = sim.get("time_step", "-")
            access_url = sim.get("simulation_access_url", "-")
            creator = sim.get("creator_id", "-")
            include_input_raw = sim.get("include_input", "false")
            creation_time = sim.get("creation_time", "-")
            include_str = "포함" if str(include_input_raw).lower() == "true" else "미포함"

            # description 말줄임(80자)
            desc_val = sim.get("description", "-")
            desc = "-"
            if isinstance(desc_val, str):
                desc = desc_val if len(desc_val) <= 80 else desc_val[:80] + "..."
            elif desc_val is not None:
                desc = str(desc_val)

            # subjects 처리 (list or comma string)
            subjects_val = sim.get("simulation_subject")
            if isinstance(subjects_val, list):
                subjects_str = ", ".join([str(x) for x in subjects_val]) if subjects_val else "-"
            elif isinstance(subjects_val, str):
                parts = [p.strip() for p in subjects_val.split(",") if p.strip()]
                subjects_str = ", ".join(parts) if parts else "-"
            else:
                subjects_str = "-"



            lines += [
                "",
                f"- ID: `{sim_id}` / 이름: **{name}** / 상태: `{state}`",
                f"  • 주기: `{step}`초 / 입력: {include_str}",
                f"  • 대상: {subjects_str}",
                f"  • Access URL: {access_url}",
                f"  • 생성일(KST): {creation_time} / 생성자: `{creator}`",
                f"  • 설명: {desc}",
                "  ─────────────────────────────",
            ]

        return "\n".join(lines)

    except Exception as e:
        return f"[예외 발생] {str(e)}"


@mcp.tool(description="id와 이름으로 디지털 트윈을 등록합니다.")
def register_digital_twin_auto(identifier: str, name: str) -> dict:
    payload = make_digital_twin_payload(identifier, name)
    res = requests.post(f"http://{HOST}:1219/light/digital-twins", json=payload)
    return res.json() if res.ok else {"msg": "등록 실패", "error": res.text}

@mcp.tool(description="디지털 트윈 ID, 객체 ID, 이름으로 디지털 객체를 등록합니다.")
def register_digital_object_auto(digital_twin_id: str, identifier: str, name: str) -> dict:
    payload = make_digital_object_payload(identifier, name)
    url = f"http://{HOST}:1219/light/digital-twins/{digital_twin_id}/digital-objects"
    res = requests.post(url, json=payload)
    return res.json() if res.ok else {"msg": "등록 실패", "error": res.text}

@mcp.tool(description="id와 이름으로 연합 디지털 트윈을 등록합니다.")
def register_federated_twin_auto(identifier: str, name: str) -> dict:
    payload = make_federated_twin_payload(identifier, name)
    res = requests.post(f"{BRAIN_BASE_URL}", json=payload)
    return res.json() if res.ok else {"msg": "등록 실패", "error": res.text}

@mcp.tool(description="연합트윈 ID, 객체 ID, 이름, 구성 DO ID들로 연합 객체를 등록합니다.")
def register_federated_object_auto(fdt_id: str, identifier: str, name: str, member_ids: list[str], time_interval: int = 0) -> dict:
    payload = make_federated_object_payload(identifier, name, member_ids, fdt_id, time_sync_cond={"time_interval": time_interval} if time_interval else None)
    url = f"{BRAIN_BASE_URL}/{fdt_id}/federated-digital-objects"
    res = requests.post(url, json=payload)
    return res.json() if res.ok else {"msg": "등록 실패", "error": res.text}


@mcp.tool()
def get_do_latest_data(dt_id: str, do_id: str, count: int = 1) -> str:
    """
    특정 디지털 트윈(digital_twin_id) 내 지정된 디지털 객체(do_id)의 최신 데이터를 조회합니다.
    count 인자를 통해 반환할 데이터 개수를 조절할 수 있으며, 실패 시 status code를 포함한 에러 message를 반환합니다.
    """
    try:
        url = f"{CONNECTOR_BASE_URL}/digital-twins/{dt_id}/digital-objects/{do_id}/data?count={count}"
        res = requests.get(url)
        data = res.json() if res.ok else {"error": res.status_code, "message": res.text}

        if isinstance(data, dict) and "error" in data:
            return f"[{data['error']}] 디지털 객체 데이터 조회 실패"

        if not data:
            return f"디지털 객체 '{do_id}' (DT: {dt_id})에 대한 데이터가 없습니다."

        summary = "\n".join([f"{i+1}. {d}" for i, d in enumerate(data)])
        return f"디지털 객체 '{do_id}' (DT: {dt_id})의 최신 데이터 {count}개:\n\n{summary}"

    except Exception as e:
        return f"[예외 발생] {str(e)}"

@mcp.tool()
def get_fdo_latest_data(fdt_id: str, fdo_id: str, count: int = 1) -> str:
    """
    특정 연합 디지털 트윈(fdt_id) 내 지정된 연합 디지털 객체(fdo_id)의 최신 데이터를 조회합니다.
    
    count 인자를 통해 반환할 데이터 개수를 조절할 수 있으며, 실패 시 status code를 포함한 에러 message를 반환합니다.
    """
    try:
        url = f"{BRAIN_BASE_URL}/{fdt_id}/federated-digital-objects/{fdo_id}/data?count={count}"
        res = requests.get(url)
        data = res.json() if res.ok else {"error": res.status_code, "message": res.text}

        if isinstance(data, dict) and "error" in data:
            return f"[{data['error']}] 연합 디지털 객체(FDO) 데이터 조회 실패"

        if not data:
            return f"연합 디지털 객체(FDO) '{fdo_id}' (DT: {fdt_id})에 대한 데이터가 없습니다."

        summary = "\n".join([f"{i+1}. {d}" for i, d in enumerate(data)])
        return f"연합 디지털 객체(FDO) '{fdo_id}' (DT: {fdt_id})의 최신 데이터 {count}개:\n\n{summary}"
    except Exception as e:
        return f"[예외 발생] {str(e)}"


@mcp.tool()
def get_fdo_data_time(fdt_id: str, fdo_id: str, from_time: str, to_time: str) -> str:
    """
    시간 기준으로 특정 연합 디지털 객체(FDO) 데이터를 조회하여 기간 내 데이터를 제공합니다. 입력: dt_id, fdo_id, from_time, to_time
    특정 연합 디지털 트윈(fdt_id) 내 지정된 연합 디지털 객체(fdo_id)의 데이터를 시간 기준으로 조회하여 시간 범위(`from_time` ~ `to_time`) 내 수집된 데이터를 제공합니다.
    - from_time, to_time은 ISO8601 형식의 문자열이어야 합니다. (예: 2025-05-25T00:00:00)
    - 실패 시 에러 status code를 포함한 에러 message를 반환합니다.
    """
    try:
        url = f"{BRAIN_BASE_URL}/{fdt_id}/federated-digital-objects/{fdo_id}/data?from={from_time}&to={to_time}"
        res = requests.get(url)
        data = res.json() if res.ok else {"error": res.status_code, "message": res.text}
        if isinstance(data, dict) and "error" in data:
            return f"[{data['error']}] 연합 디지털 객체(FDO) 시간 조회 실패"
        if not data:
            return f"연합 디지털 객체(FDO) '{fdo_id}' (DT: {fdt_id})의 해당 기간 데이터가 없습니다."

        summary = "\n".join([f"{i+1}. {d}" for i, d in enumerate(data)])
        return f"연합 디지털 객체(FDO) '{fdo_id}' (DT: {fdt_id})의 {from_time} ~ {to_time} 데이터:\n\n{summary}"
    except Exception as e:
        return f"[예외 발생] {str(e)}"

@mcp.tool()
def get_do_data_time(dt_id: str, do_id: str, from_time: str, to_time: str) -> str:
    """
    시간 기준으로 특정 디지털 객체 데이터를 조회하여 기간 내 데이터를 제공합니다. 입력: dt_id, do_id, from_time, to_time
    지정된 디지털 트윈(dt_id)의 디지털 객체(do_id)로부터 시간 범위(`from_time` ~ `to_time`) 내 수집된 데이터를 조회합니다.
    - from_time, to_time은 ISO8601 형식의 문자열이어야 합니다. (예: 2025-05-25T00:00:00)
    - 실패 시 에러 status code를 포함한 message를 반환합니다.
    """
    try:
        url = f"{CONNECTOR_BASE_URL}/digital-twins/{dt_id}/digital-objects/{do_id}/data?from={from_time}&to={to_time}"
        res = requests.get(url)
        data = res.json() if res.ok else {"error": res.status_code, "message": res.text}
        if isinstance(data, dict) and "error" in data:
            return f"[{data['error']}] DO 시간 조회 실패"
        if not data:
            return f"디지털 객체 '{do_id}' (DT: {dt_id})의 해당 기간 데이터가 없습니다."

        summary = "\n".join([f"{i+1}. {d}" for i, d in enumerate(data)])
        return f"디지털 객체 '{do_id}' (DT: {dt_id})의 {from_time} ~ {to_time} 데이터:\n\n{summary}"
    except Exception as e:
        return f"[예외 발생] {str(e)}"
    
@mcp.tool()
def get_parent_digital_twin(digital_object_id: str) -> str:
    """
    디지털 객체 ID로부터 부모 디지털 트윈 정보를 조회합니다.
    입력: digital_object_id
    반환: 부모 디지털 트윈 정보 (ID, 이름, 설명 등)
    """
    try:
        url = f"{CONNECTOR_BASE_URL}/digital-objects/{digital_object_id}"
        res = requests.get(url)
        if res.status_code == 404:
            return f"디지털 객체 '{digital_object_id}'에 대한 부모 디지털 트윈이 없습니다."
        data = res.json() if res.ok else {"error": res.status_code, "message": res.text}
        return json.dumps(data, indent=2, ensure_ascii=False) if isinstance(data, dict) else str(data)
    except Exception as e:
        return f"[예외 발생] {str(e)}"

@mcp.tool(description="연합 디지털 트윈 ID와 시뮬레이션 정보를 기반으로 시뮬레이션을 등록합니다.")
def register_simulation(
    fdt_id: str,
    name: str,
    subject_ids: list[str],
    access_url: str,
    time_step: int,
    description: str,
    creator_id: str,
    keywords: list[str],
    include_input: str
) -> dict:
    """
    시뮬레이션을 등록합니다. subject_ids에는 FDO ID들을 리스트로 넣어야 합니다.
    """
    try:
        payload = make_simulation_payload(
            name=name,
            subject_ids=subject_ids,
            access_url=access_url,
            time_step=time_step,
            description=description,
            creator_id=creator_id,
            keywords=keywords,
            include_input=include_input
        )
        url = f"{BRAIN_BASE_URL}/{fdt_id}/simulations"
        res = requests.post(url, json=payload)
        return res.json() if res.ok else {"msg": "등록 실패", "error": res.text}
    except Exception as e:
        return {"msg": "예외 발생", "error": str(e)}

@mcp.tool(description="지정된 연합 디지털 트윈과 시뮬레이션 ID를 사용하여 시뮬레이션을 실행합니다.")
def execute_simulation(fdt_id: str, simulation_id: str) -> dict:
    """
    지정된 연합 디지털 트윈(FDT)과 시뮬레이션 ID(FSIM...)로 시뮬레이션을 실행합니다.
    """
    try:
        url = f"{BRAIN_BASE_URL}/{fdt_id}/simulations/{simulation_id}/execute"
        res = requests.post(url)
        return res.json() if res.ok else {"msg": "실행 실패", "error": res.text}
    except Exception as e:
        return {"msg": "예외 발생", "error": str(e)}

@mcp.tool(description="지정된 연합 디지털 트윈과 시뮬레이션 ID를 사용하여 시뮬레이션을 중지합니다.")
def stop_simulation(fdt_id: str, simulation_id: str) -> dict:
    """
    지정된 연합 디지털 트윈(FDT)과 시뮬레이션 ID(FSIM...)로 시뮬레이션을 중지합니다.
    """
    try:
        url = f"{BRAIN_BASE_URL}/{fdt_id}/simulations/{simulation_id}/termination"
        res = requests.post(url)
        return res.json() if res.ok else {"msg": "중지 실패", "error": res.text}
    except Exception as e:
        return {"msg": "예외 발생", "error": str(e)}
    
@mcp.tool(description="지정된 연합 디지털 트윈과 시뮬레이션 ID를 사용하여 시뮬레이션을 재시작합니다.") 
def resume_simulation(fdt_id: str, simulation_id: str) -> dict:
    """
    지정된 연합 디지털 트윈(FDT)과 시뮬레이션 ID(FSIM...)로 시뮬레이션을 재시작합니다.
    """
    try:
        url = f"{BRAIN_BASE_URL}/{fdt_id}/simulations/{simulation_id}/resume"
        res = requests.post(url)
        return res.json() if res.ok else {"msg": "재시작 실패", "error": res.text}
    except Exception as e:
        return {"msg": "예외 발생", "error": str(e)}

@mcp.tool(description="지정된 연합 디지털 트윈과 시뮬레이션 ID를 사용하여 시뮬레이션의 결과 데이터를 조회합니다.")
def get_simulation_result(fdt_id: str, simulation_id: str, count: int = 1) -> dict:
    """
    지정된 연합 디지털 트윈(FDT)과 시뮬레이션 ID(FSIM...)로 시뮬레이션의 결과 데이터를 조회합니다.
    """
    try:
        url = f"{BRAIN_BASE_URL}/{fdt_id}/simulations/{simulation_id}/data?count={count}"
        res = requests.get(url)
        return res.json() if res.ok else {"msg": "결과 조회 실패", "error": res.text}
    except Exception as e:
        return {"msg": "예외 발생", "error": str(e)}


@mcp.tool(description="FDO 제어 명령을 실행합니다.")
def control_federated_digital_object(
    fdt_id: str,
    fdo_id: str,
    creator: str,
    control_id: str,
    commands: list[dict]
) -> dict:
    """
    연합 디지털 객체(FDO)에 제어 명령을 전송합니다.
    
    commands 예시:
    [
        {
            "digital_object_id": "KR-109012-0011",
            "control_command": "{\"name\": \"PTZ Camera Control\",\"description\" : \"PTZ Camera Control & SensingData\",\"commands\" : [{\"control_type\" : \"SensingData\",\"command\" : \"GetStatus\",\"control_value\": \"-\"}]}"
        },
        ...
    ]
    """
    try:
        payload = make_fdo_control_payload(creator, control_id, commands)
        url = f"{BRAIN_BASE_URL}/{fdt_id}/federated-digital-objects/{fdo_id}/control"
        res = requests.post(url, json=payload)
        return res.json() if res.ok else {"msg": "제어 실패", "error": res.text}
    except Exception as e:
        return {"msg": "예외 발생", "error": str(e)}



if __name__ == "__main__":
    mcp.settings = Settings(port=8000)
    mcp.run(transport="sse")
