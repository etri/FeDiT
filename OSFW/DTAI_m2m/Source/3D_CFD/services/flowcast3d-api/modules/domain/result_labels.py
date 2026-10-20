import math
import re
from collections import Counter
from datetime import datetime, timedelta, timezone

from modules.domain.coordinates.compass import compass

KST = timezone(timedelta(hours=9))
ACTIVE = {"queued", "running"}
STATUS = {"queued": "대기", "running": "예측 중", "cancelled": "중단", "failed": "실패"}
SECTIONS = {"live": "실시간 예측", "saved": "저장된 결과", "source": "입력"}


def created_time(result):
    if result.created_at is not None:
        try:
            return datetime.fromtimestamp(result.created_at, KST)
        except (ValueError, OverflowError, OSError):
            pass
    matched = re.fullmatch(r"(\d{8}-\d{6})-[a-zA-Z0-9]+", result.job_id or "")
    if matched:
        try:
            return datetime.strptime(matched[1], "%Y%m%d-%H%M%S").replace(tzinfo=timezone.utc).astimezone(KST)
        except ValueError:
            pass
    return None


def result_order(result):
    created = created_time(result)
    return (created.timestamp() if created is not None else float("-inf"), result.job_id or "")


def clock_duration(seconds):
    seconds = round(max(0, seconds), 9)
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    parts = [f"{int(hours)}시간" if hours else "", f"{int(minutes)}분" if minutes else ""]
    if seconds or not any(parts):
        parts.append(f"{seconds:g}초")
    return " ".join(filter(None, parts))


def wind_summary(result):
    inflow = (result.prediction or {}).get("inflow")
    if not isinstance(inflow, dict):
        return ""
    try:
        direction, speed = float(inflow["direction"]), float(inflow["speed"])
    except (KeyError, TypeError, ValueError):
        return ""
    if not math.isfinite(direction) or not math.isfinite(speed) or speed < 0:
        return ""
    return f"{compass(direction % 360)} {speed:g} m/s"


def result_item(result):
    live = result.origin == "live" and result.state in ACTIVE
    created, wind = created_time(result), wind_summary(result)

    # 생성 시각과 예측 시간 범위를 제목에서 분리
    title = f"{wind} 풍장 예측" if wind else "실시간 예측" if live else "풍장 예측"
    seconds = max(0, result.completed_steps) * result.time_step
    span = (
        f"예측 구간 {clock_duration(seconds)}"
        if result.completed_steps
        else "예측 준비 중"
        if live
        else "입력 이력만 있음"
    )
    stamp = f"{created:%H:%M:%S} 생성" if created is not None else "생성 시각 없음"
    details = [f"작업 {result.job_id}"]
    if created is not None:
        details.insert(0, f"{created:%Y.%m.%d %H:%M:%S} KST")
    return {
        "title": title,
        "value": result.job_id,
        "subtitle": f"{stamp} | {span}",
        "selection_subtitle": f"{created:%Y.%m.%d %H:%M:%S}" if created is not None else "생성 시각 없음",
        "date": created.strftime("%Y.%m.%d") if created is not None else "",
        "created_at": created.timestamp() if created is not None else None,
        "group": "live" if live else "saved",
        "status": result.state or "stored",
        "status_label": STATUS.get(result.state, ""),
        "icon": "mdi-access-point" if live else "mdi-history",
        "details": " | ".join(details),
    }


def grouped_items(items):
    unique = {}
    for item in items:
        if item.get("value") is not None:
            unique.setdefault(item["value"], item)
    grouped = []
    for group, title in SECTIONS.items():
        members = [item for item in unique.values() if item.get("group", "saved") == group]

        # 저장 결과는 최신순으로 정렬하고 같은 날짜를 묶음
        if group == "saved":
            members.sort(
                key=lambda item: (
                    item.get("created_at") if item.get("created_at") is not None else float("-inf"),
                    str(item["value"]),
                ),
                reverse=True,
            )
        identities = [
            (item["title"], item.get("base_selection_subtitle", item.get("selection_subtitle", "")))
            for item in members
        ]
        collisions = Counter(identities)
        references = {item["value"]: str(item["value"]).rsplit("-", 1)[-1][-8:] for item in members}
        reference_counts = Counter(
            (identity, references[item["value"]]) for item, identity in zip(members, identities)
        )
        previous_date = None
        for index, (item, identity) in enumerate(zip(members, identities)):
            entry = {**item, "section": title if index == 0 else "", "date_heading": ""}
            if group == "saved":
                date = item.get("date", "")
                if date != previous_date:
                    entry["date_heading"] = date or "생성 일자 없음"
                previous_date = date

            # 제목과 생성 시각이 모두 같은 결과만 기존 작업 ID로 구분
            subtitle = entry.pop("base_subtitle", entry.get("subtitle", ""))
            selection = entry.pop("base_selection_subtitle", entry.get("selection_subtitle", ""))
            if "subtitle" in entry:
                entry["subtitle"] = subtitle
            if "selection_subtitle" in entry:
                entry["selection_subtitle"] = selection
            if group == "saved" and collisions[identity] > 1:
                reference = references[item["value"]]
                if reference_counts[(identity, reference)] > 1:
                    reference = str(item["value"])
                entry["base_subtitle"] = subtitle
                entry["subtitle"] = " | ".join(filter(None, (subtitle, f"#{reference}")))
                entry["base_selection_subtitle"] = selection
                entry["selection_subtitle"] = " | ".join(filter(None, (selection, f"#{reference}")))
            grouped.append(entry)
    return grouped
