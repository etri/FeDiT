# -*- coding: utf-8 -*-
"""Hourly-mean → LSTM (in=168h, out=48h) forecasting pipeline.

High-level loop:
- On schedule: acquire → 1-hour aggregation → train/infer → update shared memory
- REST API runs in a separate process; external I/O interface remains stable
"""

import os
import time
import json
import math
import gc
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple

import yaml
import pytz
import requests
import numpy as np
import pandas as pd

import torch
import torch.nn as nn
import torch.optim as optim

import hashlib
import multiprocessing as mp
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from flask import Flask, request, jsonify
from multiprocessing import Process, Event, Manager, Lock, set_start_method
from concurrent.futures import ProcessPoolExecutor, as_completed

# 동적 데이터 수집 주기 관리를 위한 FDO 상태 추적기
try:
    from fdo_status_tracker import FDOStatusTracker
    FDO_TRACKER_AVAILABLE = True
except ImportError:
    FDO_TRACKER_AVAILABLE = False
    log("[Warning] FDO 상태 추적기 import 실패 - 동적 수집 주기 비활성화")

HTTP_SESSION = None
DEFAULT_SOURCE_TZ = "UTC"

# =========================
# Global configuration
# =========================
CONFIG_PATH = "configs.yaml"
DATA_CACHE_DIR = "data_cache"
LOG_PATH = "app.log"
KST = pytz.timezone("Asia/Seoul")

# =========================
# Utilities & logging
# =========================
def log(msg: str) -> None:
    """Append a timestamped line to stdout and app.log (best-effort)."""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}")
    try:
        with open(LOG_PATH, "a") as f:
            f.write(f"[{ts}] {msg}\n")
    except Exception:
        pass


def pick_device() -> torch.device:
    """Pick CUDA → MPS → CPU in order of preference; log availability."""
    if torch.cuda.is_available():
        log("[Init] CUDA available → cuda 사용")
        return torch.device("cuda")

    mps_built = hasattr(torch.backends, "mps") and torch.backends.mps.is_built()
    mps_avail = mps_built and torch.backends.mps.is_available()
    if mps_avail:
        log("[Init] MPS available → mps 사용")
        return torch.device("mps")
    if mps_built and not mps_avail:
        log("[Init] PyTorch는 MPS로 빌드됐지만 현재 환경에서 사용 불가(MacOS/하드웨어/런타임 조건 확인)")
    else:
        log("[Init] PyTorch가 MPS로 빌드되지 않음")
    return torch.device("cpu")


DEVICE = pick_device()


def get_kst_now() -> datetime:
    """Return current time in KST as tz-aware datetime."""
    return datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(KST)


def sleep_until_next_top_of_hour() -> None:
    """Block until the next top of the hour (KST)."""
    now = get_kst_now()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    secs = (next_hour - now).total_seconds()
    if secs > 0:
        log(f"[Scheduler] 다음 정각까지 {int(secs)}초 대기")
        time.sleep(secs)


def sleep_until_next_run(params: dict) -> None:
    """Block until the next scheduled run according to params.run_mode.

    Modes:
      - "interval": fixed minutes interval, not aligned to the hour
      - "cron": run at specific hours of the day (KST)
      - default: align to next top of the hour
    """
    mode = str(params.get("run_mode", "top_of_hour")).lower()

    if mode == "interval":
        minutes = int(params.get("run_every_minutes", 60))
        minutes = max(1, minutes)
        time.sleep(minutes * 60)
        return

    if mode == "cron":
        hours = params.get("run_at_hours", [0])
        try:
            hours = sorted(set(int(h) % 24 for h in hours))
        except Exception:
            hours = [0]

        now = get_kst_now()
        today = now.date()
        candidates = [
            KST.localize(datetime(today.year, today.month, today.day, h, 0, 0))
            for h in hours
        ] + [
            KST.localize(datetime(today.year, today.month, today.day, h, 0, 0)) + timedelta(days=1)
            for h in hours
        ]
        next_run = min([c for c in candidates if c > now])
        time.sleep((next_run - now).total_seconds())
        return

    sleep_until_next_top_of_hour()


def ensure_dir(path: str) -> None:
    """Create directory if it does not exist."""
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)


def init_fdo_status_tracker(config: dict) -> Optional['FDOStatusTracker']:
    """FDO 상태 추적기 초기화"""
    if not FDO_TRACKER_AVAILABLE:
        log("[FDO Tracker] 동적 수집 주기 기능 비활성화됨")
        return None
    
    try:
        tracker = FDOStatusTracker(config)
        log("[FDO Tracker] 동적 수집 주기 기능 초기화 완료")
        return tracker
    except Exception as e:
        log(f"[FDO Tracker] 초기화 실패: {e}")
        return None


def warmstart_predictions_from_history(
    fdo_id: str, config: dict, out_h: int = 48
) -> Optional[List[Dict]]:
    """Warm-start by repeating the latest hourly vector for the next horizon.

    Returns a list of dict rows with 'date_time' and link_id columns, or None.
    """
    try:
        raw = get_source_data(
            fdo_id=fdo_id,
            count=required_count_for_days(min_period_minutes=10, days=3, margin=200),
            config=config,
            force_refresh=False,
        )
        if raw is None or raw.empty:
            return None

        hourly = resample_to_hourly_mean(raw).sort_values("date_time")
        link_cols = [c for c in hourly.columns if c != "date_time"]
        if not link_cols:
            return None

        now = get_kst_now()
        prev_hour = now.replace(minute=0, second=0, microsecond=0)
        hist = hourly[hourly["date_time"] <= prev_hour].tail(1)
        if hist.empty:
            return None
        last_vec = hist[link_cols].values.astype(float)[0]

        next_hour = prev_hour + timedelta(hours=1)
        times = pd.date_range(start=next_hour, periods=out_h, freq="1H", tz=KST)

        results = []
        for t in times:
            row = {"date_time": t.strftime("%Y-%m-%d %H:%M:%S")}
            for j, col in enumerate(link_cols):
                v = last_vec[j]
                row[str(col)] = float(np.round(v if np.isfinite(v) else 30.0, 1))
            results.append(row)
        return results
    except Exception as e:
        log(f"[WarmStart:{fdo_id}] 예외: {e}")
        return None


def preload_warmstart_predictions(
    config: dict, infer_dict, infer_lock: Lock, out_h: int = 48
) -> None:
    """Compute warm-start predictions for every FDO at process start-up."""
    for fid in list(config["mapper"].keys()):
        try:
            res = warmstart_predictions_from_history(fid, config, out_h=out_h)
            if res:
                with infer_lock:
                    infer_dict[fid] = json.dumps(res, ensure_ascii=False)
                log(f"[WarmStart] {fid}: 초기 예측 준비 완료 ({len(res)} rows)")
            else:
                log(f"[WarmStart] {fid}: 초기 복사용 데이터 부족 → skip")
        except Exception as e:
            log(f"[WarmStart] {fid}: 예외 - {e}")


def build_retry_session(params: dict) -> requests.Session:
    """Create a requests.Session with urllib3 retry/backoff configured."""
    r = params.get("retry", {})
    total = int(r.get("total", 5))
    kw = dict(
        total=total,
        connect=int(r.get("connect", total)),
        read=int(r.get("read", total)),
        backoff_factor=float(r.get("backoff_factor", 0.4)),
        status_forcelist=tuple(r.get("status_forcelist", [429, 500, 502, 503, 504])),
        raise_on_status=False,
    )
    try:
        retries = Retry(allowed_methods=frozenset(["GET", "HEAD"]), **kw)
    except TypeError:
        retries = Retry(method_whitelist=frozenset(["GET", "HEAD"]), **kw)
    s = requests.Session()
    adapter = HTTPAdapter(max_retries=retries, pool_connections=20, pool_maxsize=20)
    s.mount("http://", adapter)
    s.mount("https://", adapter)
    return s


def _hourly_ready(df_hourly: pd.DataFrame, need_hours: int) -> bool:
    """Return True if hourly df has at least need_hours rows."""
    return (df_hourly is not None) and (not df_hourly.empty) and (len(df_hourly) >= need_hours)


# --- MODIFY: try_fetch_hourly_for_fdo() to log 1H resample coverage ---
def try_fetch_hourly_for_fdo(fdo_id: str, config: dict, params: dict, force_refresh: bool) -> pd.DataFrame:
    acq = params.get("acquire", {})
    days = int(acq.get("per_request_days", 14))
    min_period = int(acq.get("min_period_minutes", 10))
    count = required_count_for_days(min_period_minutes=min_period, days=days, margin=500)

    raw = get_source_data(fdo_id, count, config, force_refresh=force_refresh)
    if raw is None or raw.empty:
        log(f"[Acquire|1H] fdo={fdo_id} hourly=0 reason=empty-raw")
        return pd.DataFrame()

    hourly = resample_to_hourly_mean(raw).sort_values("date_time")
    h_min, h_max = _dt_range(hourly)
    log(
        "[Acquire|1H] fdo=%s hours=%d range=[%s .. %s] links=%d"
        % (fdo_id, len(hourly), _fmt_dt(h_min), _fmt_dt(h_max), max(0, len([c for c in hourly.columns if c != 'date_time'])))
    )
    return hourly


def wait_until_all_fdos_ready_on_start(config: dict, params: dict) -> None:
    """On cold start: round-robin acquire until every FDO has 216h window or timeout."""
    acq = params.get("acquire", {})
    need_hours = int(params.get("seq_in_hours", 168)) + int(params.get("seq_out_hours", 48))
    max_minutes = int(acq.get("startup_max_wait_minutes", 30))
    max_rounds = int(acq.get("initial_rounds", 12))
    wait_fdo = float(acq.get("wait_between_fdo_seconds", 3))
    wait_round = float(acq.get("wait_between_rounds_seconds", 15))

    fdo_ids = list(config["mapper"].keys())
    ready = {fid: False for fid in fdo_ids}
    start_ts = time.time()

    for _ in range(1, max_rounds + 1):
        for fid in fdo_ids:
            if ready[fid]:
                continue
            try:
                hourly = try_fetch_hourly_for_fdo(fid, config, params, force_refresh=True)
                if _hourly_ready(hourly, need_hours):
                    ready[fid] = True
                    log(f"[Acquire] {fid}: 학습창 확보 완료 ({len(hourly)}h >= {need_hours}h)")
                else:
                    log(f"[Acquire] {fid}: 부족({len(hourly)}h/{need_hours}h) → 다음 fdo로")
            except Exception as e:
                log(f"[Acquire] {fid}: 예외 {e} → 다음 fdo로")
            time.sleep(wait_fdo)
            if (time.time() - start_ts) / 60.0 > max_minutes:
                break
        if all(ready.values()):
            log("[Acquire] 모든 fdo 학습창 확보 완료")
            return
        if (time.time() - start_ts) / 60.0 > max_minutes:
            break
        time.sleep(wait_round)

    not_ready = [fid for fid, ok in ready.items() if not ok]
    if not_ready:
        log(f"[Acquire] 일부 fdo 미확보({not_ready}) — 그래도 확보된 대상부터 학습을 진행합니다.")


def wait_until_ready_for_fdo_on_schedule(fdo_id: str, config: dict, params: dict) -> bool:
    """On schedule: wait up to a limit for enough hourly data to accumulate."""
    acq = params.get("acquire", {})
    need_hours = int(params.get("seq_in_hours", 168)) + int(params.get("seq_out_hours", 48))
    max_minutes = int(acq.get("schedule_max_wait_minutes", 15))
    wait_fdo = float(acq.get("wait_between_fdo_seconds", 3))

    deadline = time.time() + max_minutes * 60.0
    attempt = 0
    while time.time() < deadline:
        attempt += 1
        hourly = try_fetch_hourly_for_fdo(fdo_id, config, params, force_refresh=True)
        if _hourly_ready(hourly, need_hours):
            log(f"[Acquire@Sched] {fdo_id}: 학습창 확보 (시도 {attempt})")
            return True
        log(f"[Acquire@Sched] {fdo_id}: 아직 부족({len(hourly)}h/{need_hours}h) → 재시도 대기")
        time.sleep(wait_fdo)
    log(f"[Acquire@Sched] {fdo_id}: 제한 {max_minutes}분 초과 — 현재 수집분으로 학습 시도")
    return False


def _effective_workers(params: dict) -> int:
    """Derive the number of parallel workers given device availability and policy."""
    par = params.get("parallel", {})
    max_workers = int(par.get("max_workers", 2))
    allow_single_cuda = bool(par.get("allow_on_single_cuda", False))
    allow_single_mps = bool(par.get("allow_on_single_mps", False))

    if torch.cuda.is_available():
        try:
            n = max(1, torch.cuda.device_count())
        except Exception:
            n = 1
        if n <= 1 and not allow_single_cuda:
            return 1
        return max(1, min(max_workers, n))

    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return 1 if not allow_single_mps else max(1, max_workers)

    return max(1, max_workers)


def _tune_cpu_threads(params):
    """Tune torch.set_num_threads based on vCPU count and parallel workers."""
    try:
        vcpus = os.cpu_count() or 4
        workers = _effective_workers(params)
        thr = max(1, vcpus // max(1, workers))
        torch.set_num_threads(thr)
        log(f"[Threads] set_num_threads({thr}) with vCPUs={vcpus}, workers={workers}")
    except Exception as e:
        log(f"[Threads] tuning skipped: {e}")


def _seed_all(seed=42):
    """Seed Python, NumPy, and Torch RNGs; seed CUDA if available."""
    import random
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def _set_deterministic(enabled: bool = False) -> None:
    """Enable deterministic algorithms for reproducibility (may reduce performance)."""
    try:
        import torch.backends.cudnn as cudnn
        if enabled:
            torch.use_deterministic_algorithms(True)
            cudnn.deterministic = True
            cudnn.benchmark = False
            log("[Deterministic] Enabled")
        else:
            log("[Deterministic] Disabled")
    except Exception as e:
        log(f"[Deterministic] setup skipped: {e}")


# =========================
# Cache helpers
# =========================
def cache_path_for(fdo_id: str) -> str:
    """Return the per-FDO cache file path."""
    ensure_dir(DATA_CACHE_DIR)
    return os.path.join(DATA_CACHE_DIR, f"{fdo_id}_raw.pkl")


def save_cache(fdo_id: str, df: pd.DataFrame) -> None:
    """Persist dataframe to a pickle cache."""
    try:
        df.to_pickle(cache_path_for(fdo_id))
        log(f"[Cache] {fdo_id}: 저장 ({len(df)} rows)")
    except Exception as e:
        log(f"[Cache] {fdo_id}: 저장 실패 - {e}")


def load_cache(fdo_id: str, max_age_hours: int = 24) -> Optional[pd.DataFrame]:
    """Load dataframe from cache if not older than max_age_hours, else None."""
    try:
        p = cache_path_for(fdo_id)
        if not os.path.exists(p):
            return None
        age_h = (time.time() - os.path.getmtime(p)) / 3600.0
        if age_h > max_age_hours:
            log(f"[Cache] {fdo_id}: 캐시 만료({age_h:.1f} h) → 무시")
            return None
        df = pd.read_pickle(p)
        log(f"[Cache] {fdo_id}: 로드 ({len(df)} rows, {age_h:.1f} h ago)")
        return df
    except Exception as e:
        log(f"[Cache] {fdo_id}: 로드 실패 - {e}")
        return None


def next_anchor_dt() -> datetime:
    """Return the next top-of-hour KST anchor."""
    now = get_kst_now()
    return now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)


def has_cached_for_anchor(fid: str, infer_dict, infer_lock: Lock, anchor_dt: datetime) -> bool:
    """Return True if infer_dict[fid] already contains predictions for this anchor."""
    try:
        with infer_lock:
            raw = infer_dict.get(fid)
        if not raw:
            return False
        arr = json.loads(raw)
        if not arr:
            return False
        return arr[0].get("date_time") == anchor_dt.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return False

# =========================
# Cache pruning (time-based)
# =========================
def prune_cache_df(df: pd.DataFrame, params: dict) -> pd.DataFrame:
    """Trim cached raw data to keep only recent rows.

    Policy:
      - Keep at most `keep_days` days.
      - Always keep at least `min_hours + safety_margin_hours`.
    """
    try:
        cr = (params or {}).get("cache_retention", {})
        if not cr or not bool(cr.get("enabled", True)):
            return df
        if df is None or df.empty or "date_time" not in df.columns:
            return df

        df = df.copy()
        df["date_time"] = pd.to_datetime(df["date_time"], errors="coerce")
        df = df.dropna(subset=["date_time"]).sort_values("date_time").reset_index(drop=True)
        if df.empty:
            return df

        keep_days = int(cr.get("keep_days", 30))
        min_hours = int(cr.get("min_hours", 216))
        safety_margin_hours = int(cr.get("safety_margin_hours", 24))

        max_dt = df["date_time"].max()
        cutoff_primary = max_dt - pd.Timedelta(days=keep_days)
        cutoff_min_keep = max_dt - pd.Timedelta(hours=min_hours + safety_margin_hours)

        final_cutoff = min(cutoff_primary, cutoff_min_keep)

        pruned = df[df["date_time"] >= final_cutoff].reset_index(drop=True)
        removed = len(df) - len(pruned)
        if removed > 0:
            log(f"[CachePrune] {removed} rows removed; kept from {final_cutoff} to {max_dt}")
        return pruned
    except Exception as e:
        log(f"[CachePrune] prune skipped: {e}")
        return df

# =========================
# Device helpers (CUDA / MPS / CPU)
# =========================
def device_type(dev: Optional[torch.device] = None) -> str:
    """Return the short device type name (e.g., 'cuda', 'mps', 'cpu')."""
    return (dev or DEVICE).type


def empty_device_cache() -> None:
    """Release cached device memory where available (best-effort)."""
    try:
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:
        pass
    try:
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            import torch.mps
            torch.mps.empty_cache()
    except Exception:
        pass

# =========================
# Data acquisition & hourly aggregation
# =========================
def _normalize_to_kst(series: pd.Series, source_tz: str = None) -> pd.Series:
    """Normalize timestamps to KST; localize naive inputs with source_tz."""
    tz = source_tz or DEFAULT_SOURCE_TZ
    dt = pd.to_datetime(series, errors="coerce")
    if getattr(dt.dt, "tz", None) is None:
        dt = dt.dt.tz_localize(tz)
    return dt.dt.tz_convert(KST)


def resample_to_hourly_mean(df: pd.DataFrame) -> pd.DataFrame:
    """Return 1H-mean resampled dataframe, numeric-only, with simple imputation."""
    if "date_time" not in df.columns or df.empty:
        return pd.DataFrame(columns=["date_time"])
    df = df.copy()
    df["date_time"] = _normalize_to_kst(df["date_time"])
    df = df.dropna(subset=["date_time"]).sort_values("date_time").set_index("date_time")

    value_cols = [c for c in df.columns if c != "date_time"]
    df[value_cols] = df[value_cols].apply(pd.to_numeric, errors="coerce")
    hourly = df[value_cols].resample("1H").mean()
    hourly = hourly.interpolate(limit_direction="both").ffill().bfill()
    return hourly.reset_index()


# --- ADD: helper to format timestamps and summarize collections ---
def _fmt_dt(dt) -> str:
    """Format Pandas/py datetime for logs."""
    try:
        if isinstance(dt, (pd.Timestamp, datetime)) and pd.notna(dt):
            return dt.tz_convert(KST).strftime("%Y-%m-%d %H:%M:%S %Z") if hasattr(dt, "tzinfo") and dt.tzinfo else dt.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        pass
    return "NA"

def _dt_range(df: pd.DataFrame) -> Tuple[Optional[pd.Timestamp], Optional[pd.Timestamp]]:
    """Return (min_dt, max_dt) from a dataframe's date_time column (safe)."""
    try:
        if df is None or df.empty or "date_time" not in df.columns:
            return None, None
        dt = pd.to_datetime(df["date_time"], errors="coerce")
        dt = dt.dropna()
        if dt.empty:
            return None, None
        return dt.min(), dt.max()
    except Exception:
        return None, None

def _log_source_collection_stats(
    fdo_id: str,
    requested_count: int,
    raw_items: Optional[int],
    df_before: pd.DataFrame,
    df_after: pd.DataFrame
) -> None:
    """Emit structured collection stats for visibility."""
    pre_rows = 0 if df_before is None or df_before.empty else len(df_before)
    post_rows = 0 if df_after is None or df_after.empty else len(df_after)
    try:
        uniq_ts = pd.to_datetime(df_before["date_time"], errors="coerce").dropna().nunique() if pre_rows else 0
    except Exception:
        uniq_ts = 0
    pre_min, pre_max = _dt_range(df_before)
    post_min, post_max = _dt_range(df_after)
    dropped = max(0, pre_rows - post_rows)

    log(
        "[Data|Collect] fdo=%s requested=%d raw_items=%s rows_pre=%d uniq_ts=%d "
        "range_pre=[%s .. %s] rows_post=%d dropped=%d range_post=[%s .. %s]"
        % (
            fdo_id,
            requested_count,
            "NA" if raw_items is None else raw_items,
            pre_rows,
            uniq_ts,
            _fmt_dt(pre_min), _fmt_dt(pre_max),
            post_rows,
            dropped,
            _fmt_dt(post_min), _fmt_dt(post_max),
        )
    )

# --- MODIFY: get_source_data() to emit collection stats and final cache stats ---
def get_source_data(
    fdo_id: str, count: int, config: dict, force_refresh: bool = False, 
    fdo_tracker: Optional['FDOStatusTracker'] = None
) -> pd.DataFrame:
    count = int(count)
    
    # 동적 수집 주기 확인
    if fdo_tracker and not force_refresh:
        if not fdo_tracker.should_collect_data(fdo_id):
            cached = load_cache(fdo_id, max_age_hours=24)
            if cached is not None:
                log(f"[FDO Tracker] {fdo_id}: 수집 주기 미도달 → 캐시 사용")
                return cached
    
    if not force_refresh:
        cached = load_cache(fdo_id, max_age_hours=24)
        if cached is not None and len(cached) >= count * 0.8:
            return cached

    data_url = config["urls"]["source"]
    mapper = config["mapper"]
    connect_url = f"{data_url}{fdo_id}/data?count={count}"

    global HTTP_SESSION
    if HTTP_SESSION is None:
        HTTP_SESSION = build_retry_session(config.get("params", {}))

    headers = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
    raw = None
    try:
        resp = HTTP_SESSION.get(connect_url, headers=headers, timeout=120)
        resp.raise_for_status()
        raw = resp.json()
    except Exception as e:
        log(f"[Data|Fetch] fdo={fdo_id} error={e} url={connect_url}")
        return load_cache(fdo_id, max_age_hours=24 * 365) or pd.DataFrame()

    rows = []
    keys = mapper.get(fdo_id) or []
    key0 = keys[0] if keys else None
    if key0 is None:
        log(f"[Data|Parse] fdo={fdo_id} mapper-key-missing")
        return load_cache(fdo_id, max_age_hours=24 * 365) or pd.DataFrame()

    for item in raw:
        try:
            if "data" in item and key0 in item["data"]:
                vals = item["data"][key0]["trafficMeasurement"]["value"]
                d = {}
                for idx, v in enumerate(vals):
                    if idx == 0:
                        d["date_time"] = v["date_time"]
                    d[str(v["link_id"])] = v["speed"]
                rows.append(d)
        except Exception:
            continue

    df_before = pd.DataFrame(rows)
    if df_before.empty or "date_time" not in df_before.columns:
        log(f"[Data|Parse] fdo={fdo_id} no-valid-rows")
        return load_cache(fdo_id, max_age_hours=24 * 365) or pd.DataFrame()

    # Clean/normalize and drop duplicates
    df_after = df_before.copy()
    df_after["date_time"] = pd.to_datetime(df_after["date_time"], errors="coerce")
    df_after = df_after.dropna(subset=["date_time"]).sort_values("date_time")
    df_after = df_after.drop_duplicates(subset=["date_time"], keep="first").reset_index(drop=True)

    # Emit collection stats (requested vs. fetched vs. kept)
    _log_source_collection_stats(
        fdo_id=fdo_id,
        requested_count=count,
        raw_items=(len(raw) if isinstance(raw, list) else None),
        df_before=df_before,
        df_after=df_after,
    )

    # Drop columns with >50% missing (except date_time)
    nan_ratio = df_after.isna().mean()
    drop_cols = [c for c in nan_ratio[nan_ratio > 0.5].index if c != "date_time"]
    if drop_cols:
        log(f"[Data|Clean] fdo={fdo_id} drop_cols(>50%%-NaN)={drop_cols}")
        df_after = df_after.drop(columns=drop_cols)

    # Merge with cache and keep latest per timestamp
    try:
        old = load_cache(fdo_id, max_age_hours=24 * 365)
        if old is not None and not old.empty:
            merged = pd.concat([old, df_after], ignore_index=True)
            merged = merged.drop_duplicates(subset=["date_time"], keep="last").sort_values("date_time")
            df_after = merged.reset_index(drop=True)
    except Exception:
        pass

    # Prune old history (keep only the recent window + safety)
    try:
        df_after = prune_cache_df(df_after, config.get("params", {}))
    except Exception:
        pass

    # Final cache stats (post-merge & prune)
    fin_min, fin_max = _dt_range(df_after)
    log(
        "[Cache|Final] fdo=%s rows=%d range=[%s .. %s] cols=%d"
        % (fdo_id, len(df_after), _fmt_dt(fin_min), _fmt_dt(fin_max), len(df_after.columns))
    )

    # FDO 상태 추적기에 데이터 품질 정보 업데이트
    if fdo_tracker:
        try:
            # 사용 가능한 시간 수 계산 (최소 10분 간격 기준)
            available_hours = len(df_after) * 10 / 60  # 10분 단위를 시간으로 변환
            fdo_tracker.update_data_quality(fdo_id, int(available_hours))
            log(f"[FDO Tracker] {fdo_id}: 데이터 품질 업데이트 ({int(available_hours)}시간)")
        except Exception as e:
            log(f"[FDO Tracker] {fdo_id}: 데이터 품질 업데이트 실패 - {e}")

    save_cache(fdo_id, df_after)
    return df_after


def get_link_ids_for_fdo(fdo_id: str, config: dict, sample_count: int = 50) -> List[str]:
    """Return available link_id columns for an FDO based on recent samples."""
    df = get_source_data(fdo_id, count=sample_count, config=config, force_refresh=False)
    if df is None or df.empty:
        return []
    return [c for c in df.columns if c != "date_time"]


def required_count_for_days(min_period_minutes: int, days: int, margin: int = 500) -> int:
    """Compute an upper-bound count to cover `days` days at a min sampling period."""
    pts_per_day = int((24 * 60) / max(1, min_period_minutes))
    return days * pts_per_day + margin

# =========================
# Windowing for train/infer
# =========================
def build_windows(
    df_hourly: pd.DataFrame, link_cols: List[str], in_h: int, out_h: int
) -> Tuple[np.ndarray, np.ndarray]:
    """Construct sliding windows: X=(in_h, links), Y=(links, out_h)."""
    X, Y = [], []
    values = df_hourly[link_cols].values
    total = len(df_hourly)
    need = in_h + out_h
    if total < need:
        return np.empty((0, in_h, len(link_cols))), np.empty((0, len(link_cols), out_h))
    for s in range(0, total - need + 1):
        x = values[s : s + in_h, :]
        y = values[s + in_h : s + in_h + out_h, :].T
        X.append(x)
        Y.append(y)
    return np.asarray(X, dtype=np.float32), np.asarray(Y, dtype=np.float32)

# --- NEW: hourly resample helpers (pre/post imputation) ---
def _resample_hourly_no_impute(df: pd.DataFrame) -> pd.DataFrame:
    """Resample to hourly mean WITHOUT any interpolation/fill (NaNs indicate missing hours)."""
    if "date_time" not in df.columns or df.empty:
        return pd.DataFrame(columns=["date_time"])
    df = df.copy()
    df["date_time"] = _normalize_to_kst(df["date_time"])
    df = df.dropna(subset=["date_time"]).sort_values("date_time").set_index("date_time")
    value_cols = [c for c in df.columns if c != "date_time"]
    df[value_cols] = df[value_cols].apply(pd.to_numeric, errors="coerce")
    hourly = df[value_cols].resample("1H").mean()
    return hourly.reset_index()

def _impute_hourly(df_hourly: pd.DataFrame, direction: str = "forward") -> pd.DataFrame:
    if df_hourly.empty:
        return df_hourly
    df = df_hourly.copy().set_index("date_time")
    value_cols = [c for c in df.columns if c != "date_time"]
    if direction == "forward":
        df[value_cols] = df[value_cols].interpolate(limit_direction="forward").ffill()
    else:
        df[value_cols] = df[value_cols].interpolate(limit_direction="both").ffill().bfill()
    return df.reset_index()

def _missing_ratio_in_window(df_hourly_noimp: pd.DataFrame, link_cols: List[str], window_hours: int) -> float:
    """Share of missing values (before imputation) within the last `window_hours`."""
    if df_hourly_noimp.empty:
        return 1.0
    tail = df_hourly_noimp.sort_values("date_time").tail(window_hours)
    if tail.empty:
        return 1.0
    subset = tail[link_cols] if link_cols else tail.drop(columns=["date_time"], errors="ignore")
    if subset.empty:
        return 1.0
    total = subset.size
    miss = subset.isna().sum().sum()
    return float(miss) / float(total) if total > 0 else 1.0

# --- NEW: build-and-split by time (holdout) ---
def build_and_split_windows(
    df_hourly_imputed: pd.DataFrame,
    link_cols: List[str],
    in_h: int,
    out_h: int,
    val_hours: int,
    gap_hours: int = 0
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Build windows on full series, then split TRAIN/VAL by time with optional embargo gap.
       All windows whose TARGET END <= cutoff go to TRAIN; TARGET END >= cutoff+gap go to VAL.
       Windows overlapping the embargo interval are dropped to avoid leakage.
    """
    df = df_hourly_imputed.sort_values("date_time")
    X_all, Y_all = build_windows(df, link_cols, in_h, out_h)
    if X_all.size == 0:
        return X_all, Y_all, np.empty((0, in_h, len(link_cols))), np.empty((0, len(link_cols), out_h))

    total = len(df)
    cutoff_idx = max(0, total - int(val_hours))
    need = in_h + out_h
    train_idx, val_idx = [], []
    for s in range(0, total - need + 1):
        tgt_end = s + need
        if tgt_end <= cutoff_idx:
            train_idx.append(s)
        elif tgt_end >= cutoff_idx + int(max(0, gap_hours)):
            val_idx.append(s)
        # else: in the embargo zone -> drop

    X_tr = X_all[train_idx] if train_idx else np.empty((0, in_h, len(link_cols)))
    Y_tr = Y_all[train_idx] if train_idx else np.empty((0, len(link_cols), out_h))
    X_va = X_all[val_idx]   if val_idx   else np.empty((0, in_h, len(link_cols)))
    Y_va = Y_all[val_idx]   if val_idx   else np.empty((0, len(link_cols), out_h))
    return X_tr, Y_tr, X_va, Y_va




# =========================
# Model
# =========================
class MultiLinkLSTM(nn.Module):
    """LSTM encoder over time; linear head produces (links × horizon) outputs."""
    def __init__(self, input_dim: int, hidden_dim: int, num_layers: int, out_h: int):
        super().__init__()
        self.input_dim = input_dim
        self.out_h = out_h
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers=num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, input_dim * out_h)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out, _ = self.lstm(x)
        last = out[:, -1, :]
        pred = self.fc(last)
        return pred.view(-1, self.input_dim, self.out_h)

# =========================
# Training & inference
# =========================
# --- NEW: metrics ---
def _safe_mape(y_true: np.ndarray, y_pred: np.ndarray, eps: float = 1e-6) -> float:
    denom = np.maximum(np.abs(y_true), eps)
    return float(np.mean(np.abs((y_true - y_pred) / denom)) * 100.0)

def _smape(y_true: np.ndarray, y_pred: np.ndarray, eps: float = 1e-6) -> float:
    num = np.abs(y_pred - y_true)
    denom = np.maximum((np.abs(y_true) + np.abs(y_pred)) / 2.0, eps)
    return float(np.mean(num / denom) * 100.0)

def evaluate_metrics(model: nn.Module, X: np.ndarray, Y: np.ndarray) -> Dict[str, float]:
    """Compute MAE/RMSE/MAPE/sMAPE over all windows, links and horizons."""
    if X.size == 0 or Y.size == 0:
        return {"MAE": float("nan"), "RMSE": float("nan"), "MAPE": float("nan"), "sMAPE": float("nan")}
    model.eval()
    with torch.no_grad():
        xb = torch.tensor(X, dtype=torch.float32, device=DEVICE)
        pred = model(xb).cpu().numpy()  # (N, links, out_h)
    y = Y  # (N, links, out_h)
    y_true = y.reshape(-1)
    y_pred = pred.reshape(-1)
    mae  = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    mape = _safe_mape(y_true, y_pred)
    smape = _smape(y_true, y_pred)
    return {"MAE": mae, "RMSE": rmse, "MAPE": mape, "sMAPE": smape}

# --- Feature scaling (per-link z-score) --------------------------------------
def _fit_link_scaler_from_df(df: pd.DataFrame, link_cols: List[str]) -> Tuple[np.ndarray, np.ndarray]:
    """Fit per-link (mean, std) from a dataframe of hourly values."""
    vals = df[link_cols].astype(float).values
    mean = np.nanmean(vals, axis=0)
    std  = np.nanstd(vals, axis=0)
    std  = np.where(std < 1e-6, 1.0, std)  # avoid divide-by-zero
    return mean.astype(np.float32), std.astype(np.float32)

def _scale_XY_with_stats(X: np.ndarray, Y: np.ndarray, mean: np.ndarray, std: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Apply z-score scaling to X:[N,in,links] over last dim; Y:[N,links,out] over axis=1."""
    Xs = (X - mean.reshape(1, 1, -1)) / std.reshape(1, 1, -1)
    Ys = (Y - mean.reshape(1, -1, 1)) / std.reshape(1, -1, 1)
    return Xs.astype(np.float32), Ys.astype(np.float32)

def _inverse_scale_pred(pred: np.ndarray, mean: np.ndarray, std: np.ndarray) -> np.ndarray:
    """Inverse z-score for predictions shaped [links, out_h] or [N,links,out_h]."""
    if pred.ndim == 3:
        return (pred * std.reshape(1, -1, 1) + mean.reshape(1, -1, 1))
    return (pred * std.reshape(-1, 1) + mean.reshape(-1, 1))

# --- Baseline (naive persistence) & skill ------------------------------------
def _naive_persistence_baseline(X: np.ndarray) -> np.ndarray:
    """Return naive baseline preds: repeat last observed value over horizon.
       X: [N,in_h,links] -> baseline: [N,links,out_h] (caller repeats across out_h)."""
    last = X[:, -1, :]  # [N,links]
    return last  # caller will tile across horizon

def _evaluate_metrics_numpy(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Compute MAE/RMSE/MAPE/sMAPE on flattened arrays (original scale)."""
    eps = 1e-6
    y_t = y_true.reshape(-1)
    y_p = y_pred.reshape(-1)
    mae  = float(np.mean(np.abs(y_t - y_p)))
    rmse = float(np.sqrt(np.mean((y_t - y_p) ** 2)))
    denom = np.maximum(np.abs(y_t), eps)
    mape = float(np.mean(np.abs((y_t - y_p) / denom)) * 100.0)
    num = np.abs(y_p - y_t)
    den = np.maximum((np.abs(y_t) + np.abs(y_p)) / 2.0, eps)
    smape = float(np.mean(num / den) * 100.0)
    return {"MAE": mae, "RMSE": rmse, "MAPE": mape, "sMAPE": smape}

def _per_horizon_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> List[Dict[str, float]]:
    """Return metrics per forecast horizon step (list length = out_h)."""
    N, L, H = y_true.shape
    out = []
    for h in range(H):
        out.append(_evaluate_metrics_numpy(y_true[:, :, h], y_pred[:, :, h]))
    return out


# --- UPDATED: train_model to support validation + early stopping ---
def train_model(
    X: np.ndarray,
    Y: np.ndarray,
    hidden_dim: int,
    num_layers: int,
    out_h: int,
    lr: float,
    epochs: int,
    batch_size: int = 64,
    clip_grad: float = 1.0,
    X_val: Optional[np.ndarray] = None,
    Y_val: Optional[np.ndarray] = None,
    early_stopping_patience: int = 0,
    use_amp: bool = False
) -> nn.Module:
    model = MultiLinkLSTM(X.shape[2], hidden_dim, num_layers, out_h).to(DEVICE)
    opt = optim.Adam(model.parameters(), lr=lr)
    crit = nn.MSELoss()

    tr_ds = torch.utils.data.TensorDataset(torch.tensor(X, dtype=torch.float32), torch.tensor(Y, dtype=torch.float32))
    tr_dl = torch.utils.data.DataLoader(tr_ds, batch_size=batch_size, shuffle=True, drop_last=False,
                                        pin_memory=torch.cuda.is_available())

    has_val = (X_val is not None) and (Y_val is not None) and (X_val.size > 0) and (Y_val.size > 0)
    if has_val:
        va_ds = torch.utils.data.TensorDataset(torch.tensor(X_val, dtype=torch.float32), torch.tensor(Y_val, dtype=torch.float32))
        va_dl = torch.utils.data.DataLoader(va_ds, batch_size=batch_size, shuffle=False, drop_last=False,
                                            pin_memory=torch.cuda.is_available())
    else:
        va_ds = va_dl = None

    scaler = torch.cuda.amp.GradScaler(enabled=use_amp and (DEVICE.type == "cuda"))

    best_state, best_val = None, float("inf")
    patience = int(max(0, early_stopping_patience))
    no_improve = 0

    for ep in range(1, epochs + 1):
        model.train()
        tr_loss = 0.0
        for xb, yb in tr_dl:
            xb = xb.to(DEVICE); yb = yb.to(DEVICE)
            opt.zero_grad()
            with torch.cuda.amp.autocast(enabled=use_amp and (DEVICE.type == "cuda")):
                out = model(xb)
                loss = crit(out, yb)
            scaler.scale(loss).backward()
            if clip_grad is not None:
                scaler.unscale_(opt)
                torch.nn.utils.clip_grad_norm_(model.parameters(), clip_grad)
            scaler.step(opt)
            scaler.update()
            tr_loss += loss.item() * xb.size(0)
        tr_loss /= len(tr_ds)

        if has_val:
            model.eval()
            va_loss = 0.0
            with torch.no_grad():
                for xb, yb in va_dl:
                    xb = xb.to(DEVICE); yb = yb.to(DEVICE)
                    with torch.cuda.amp.autocast(enabled=use_amp and (DEVICE.type == "cuda")):
                        out = model(xb)
                        va_loss += crit(out, yb).item() * xb.size(0)
            va_loss /= len(va_ds)
            log(f"[Train] Epoch {ep}/{epochs} - TrainLoss: {tr_loss:.5f} | ValLoss: {va_loss:.5f}")

            if va_loss + 1e-12 < best_val:
                best_val = va_loss
                best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
                no_improve = 0
            else:
                no_improve += 1
                if patience > 0 and no_improve >= patience:
                    log(f"[Train] Early stopping at epoch {ep} (best ValLoss={best_val:.5f})")
                    break
        else:
            log(f"[Train] Epoch {ep}/{epochs} - TrainLoss: {tr_loss:.5f}")

    if has_val and best_state is not None:
        model.load_state_dict(best_state)

    del tr_ds, tr_dl, va_ds, va_dl
    gc.collect()
    empty_device_cache()
    return model


@torch.no_grad()
def infer_next_48(
    model: nn.Module,
    df_hourly: pd.DataFrame,
    link_cols: List[str],
    in_h: int,
    out_h: int,
) -> List[Dict]:
    """Infer next horizon using the most recent input window and return rows."""
    df_hourly = df_hourly.sort_values("date_time")
    x = df_hourly[link_cols].iloc[-in_h:].values.astype(np.float32)
    x_t = torch.tensor(x, dtype=torch.float32, device=DEVICE).unsqueeze(0)

    model.eval()
    pred = model(x_t).cpu().numpy()[0]  # (links, out_h)
    clip_min = 0.0
    clip_max = 120.0

    now = get_kst_now()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    times = pd.date_range(start=next_hour, periods=out_h, freq="1H", tz=KST)

    results = []
    for i, t in enumerate(times):
        row = {"date_time": t.strftime("%Y-%m-%d %H:%M:%S")}
        for j, link in enumerate(link_cols):
            val = float(pred[j, i])
            if math.isnan(val) or math.isinf(val):
                val = 30.0
            val = max(clip_min, min(clip_max, val))
            row[str(link)] = round(val, 1)
        results.append(row)
    return results

# =========================
# Per-FDO pipeline
# =========================
# --- NEW: ensure hourly coverage with iterative backfill ---
def ensure_training_hourly(fdo_id: str, config: dict, params: dict) -> pd.DataFrame:
    """
    Iteratively (re)request source data with larger 'count' (derived from days)
    until we have enough hourly coverage and acceptable missingness BEFORE imputation.
    """
    acq = params.get("acquire", {})
    days = int(acq.get("per_request_days", 14))
    min_period = int(acq.get("min_period_minutes", 10))
    max_days = int(acq.get("max_backfill_days", 60))
    max_retries = int(acq.get("max_backfill_retries", 5))
    tol_missing = float(acq.get("missing_tolerance_ratio", 0.15))

    in_h  = int(params.get("seq_in_hours", 168))
    out_h = int(params.get("seq_out_hours", 48))
    val_h = int(params.get("training", {}).get("val_hours", 168))
    need_h = in_h + out_h + val_h

    tries, best_noimp = 0, None
    link_cols_probe: List[str] = []

    while True:
        tries += 1
        cnt = required_count_for_days(min_period_minutes=min_period, days=min(days, max_days), margin=500)
        raw = get_source_data(fdo_id, cnt, config, force_refresh=True)
        if raw is None or raw.empty:
            if tries >= max_retries:
                return pd.DataFrame(columns=["date_time"])
            # wait a bit and retry
            time.sleep(1.0)
            continue

        # resample without imputation for missingness check
        noimp = _resample_hourly_no_impute(raw).sort_values("date_time")
        if best_noimp is None or (not noimp.empty and noimp["date_time"].min() < best_noimp["date_time"].min()):
            best_noimp = noimp

        # determine candidate link columns from available columns
        probe_cols = [c for c in noimp.columns if c != "date_time"]
        link_cols_probe = probe_cols if probe_cols else link_cols_probe

        enough_length = len(noimp) >= need_h
        miss_ratio = _missing_ratio_in_window(noimp, link_cols_probe, need_h) if link_cols_probe else 1.0

        if enough_length and miss_ratio <= tol_missing:
            return _impute_hourly(noimp, direction="forward")

        if tries >= max_retries and days >= max_days:
            # give up and impute best we have
            return _impute_hourly(best_noimp if best_noimp is not None else noimp, direction="forward")

        # exponentially expand the backfill horizon
        days = min(max_days, max(days + 1, days * 2))
        time.sleep(float(acq.get("wait_between_fdo_seconds", 3)))

# --- REPLACE: run_train_infer_for_fdo() to use coverage+validation ---
def run_train_infer_for_fdo(
    fdo_id: str, config: dict, params: dict, fdo_tracker=None
) -> Optional[List[Dict]]:
    # 1) Ensure hourly coverage (pre-impute missingness check, then impute)
    hourly = ensure_training_hourly(fdo_id, config, params)
    in_h  = int(params.get("seq_in_hours", 168))
    out_h = int(params.get("seq_out_hours", 48))
    if hourly.empty or len(hourly) < (in_h + out_h):
        log(f"[FDO:{fdo_id}] hourly data insufficient after backfill ({len(hourly)}) → skip")
        return None

    link_cols = [c for c in hourly.columns if c != "date_time"]
    if not link_cols:
        log(f"[FDO:{fdo_id}] no link columns → skip")
        return None

    # 2) Build windows and time-based split with optional gap
    tr_cfg = params.get("training", {}) or {}
    val_h = int(tr_cfg.get("val_hours", 168))
    gap_h = int(tr_cfg.get("gap_hours", 0))
    X_tr, Y_tr, X_va, Y_va = build_and_split_windows(hourly, link_cols, in_h, out_h, val_h, gap_h)
    log(f"[Data|Windows] {fdo_id} | links={len(link_cols)} | X_tr={X_tr.shape} Y_tr={Y_tr.shape} | X_va={X_va.shape} Y_va={Y_va.shape}")

    if X_tr.size == 0:
        log(f"[FDO:{fdo_id}] no training samples → skip")
        return None

    # 3) Fit per-link scaler on TRAIN PORTION ONLY and scale X/Y
    train_df_for_stats = hourly.sort_values("date_time").iloc[: max(0, len(hourly) - val_h)] if val_h > 0 else hourly
    mean, std = _fit_link_scaler_from_df(train_df_for_stats, link_cols)
    X_tr_s, Y_tr_s = _scale_XY_with_stats(X_tr, Y_tr, mean, std)
    X_va_s, Y_va_s = (np.empty((0,)), np.empty((0,))) if X_va.size == 0 else _scale_XY_with_stats(X_va, Y_va, mean, std)

    # 4) Train with validation/early-stopping/AMP
    model = train_model(
        X_tr_s, Y_tr_s,
        hidden_dim=params["hidden_dim"],
        num_layers=params["num_layers"],
        out_h=out_h,
        lr=params["learning_rate"],
        epochs=params["epochs"],
        X_val=(None if X_va_s.size == 0 else X_va_s),
        Y_val=(None if Y_va_s.size == 0 else Y_va_s),
        early_stopping_patience=int(tr_cfg.get("early_stopping_patience", 0)),
        use_amp=bool(tr_cfg.get("use_amp", False))
    )

    # 5) Evaluate on validation (original scale), with optional baseline & per-horizon
    try:
        metrics, metrics_per_h, baseline, skill = {}, [], {}, {}
        if X_va_s.size > 0:
            with torch.no_grad():
                xb = torch.tensor(X_va_s, dtype=torch.float32, device=DEVICE)
                pred_s = model(xb).cpu().numpy()                # scaled
                pred   = _inverse_scale_pred(pred_s, mean, std) # original scale

            y_true = Y_va                                   # original scale (unscaled)
            metrics = _evaluate_metrics_numpy(y_true, pred)

            if bool(tr_cfg.get("metrics_per_horizon", True)):
                metrics_per_h = _per_horizon_metrics(y_true, pred)

            if bool(tr_cfg.get("save_baseline", True)):
                last = _naive_persistence_baseline(X_va)     # [N,links]
                base = np.tile(last[:, :, None], (1, 1, out_h))
                baseline = _evaluate_metrics_numpy(y_true, base)
                # simple MAE/RMSE skill (1 - model/baseline); clamp if baseline=0
                def _skill(m, b): 
                    return float("nan") if b <= 1e-12 else float(1.0 - (m / b))
                skill = {k: _skill(metrics.get(k, float("nan")), baseline.get(k, float("nan")))
                         for k in ("MAE", "RMSE")}
            with open(f"metrics_{fdo_id}.json", "w", encoding="utf-8") as f:
                json.dump({"overall": metrics, "per_horizon": metrics_per_h, "baseline": baseline, "skill": skill},
                          f, ensure_ascii=False, indent=2)
            log(f"[Eval] {fdo_id} overall={metrics} baseline={baseline} skill={skill}")
    except Exception as e:
        log(f"[Eval] {fdo_id} metrics error: {e}")

    # 6) Inference for next horizon (use scaled input, then inverse-scale preds)
    try:
        df_sorted = hourly.sort_values("date_time")
        x_last = df_sorted[link_cols].iloc[-in_h:].values.astype(np.float32)
        x_last_s = (x_last - mean.reshape(1, -1)) / std.reshape(1, -1)
        x_t = torch.tensor(x_last_s, dtype=torch.float32, device=DEVICE).unsqueeze(0)
        with torch.no_grad():
            pred_s = model(x_t).cpu().numpy()[0]                 # [links,out_h] scaled
        pred = _inverse_scale_pred(pred_s, mean, std)            # original scale
        clip_min, clip_max = 0.0, 120.0
        now = get_kst_now()
        next_hour = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
        times = pd.date_range(start=next_hour, periods=out_h, freq="1H", tz=KST)

        results = []
        for i, t in enumerate(times):
            row = {"date_time": t.strftime("%Y-%m-%d %H:%M:%S")}
            for j, link in enumerate(link_cols):
                v = float(np.clip(pred[j, i], clip_min, clip_max))
                if not np.isfinite(v):
                    v = 30.0
                row[str(link)] = round(v, 1)
            results.append(row)
    except Exception as e:
        log(f"[Infer] {fdo_id} inference error: {e}")
        return None

    # FDO 상태 추적기에 학습 완료 상태 업데이트
    if fdo_tracker:
        try:
            fdo_tracker.update_training_status(fdo_id, True)
            log(f"[FDO Tracker] {fdo_id}: 학습 완료 상태 업데이트")
        except Exception as e:
            log(f"[FDO Tracker] {fdo_id}: 학습 완료 상태 업데이트 실패 - {e}")

    del model
    gc.collect()
    empty_device_cache()
    return results


def run_bootstrap_train_for_fdo(
    fdo_id: str, config: dict, params: dict
) -> Optional[List[Dict]]:
    """Short bootstrap training using the most recent 216h window, then infer."""
    need_hours = params["seq_in_hours"] + params["seq_out_hours"]
    raw = get_source_data(
        fdo_id=fdo_id,
        count=required_count_for_days(min_period_minutes=10, days=10, margin=300),
        config=config,
        force_refresh=False,
    )
    if raw is None or raw.empty:
        log(f"[Bootstrap:{fdo_id}] 원시데이터 없음 → skip")
        return None

    hourly = resample_to_hourly_mean(raw).sort_values("date_time")
    if len(hourly) < need_hours:
        log(f"[Bootstrap:{fdo_id}] 1H 데이터 부족({len(hourly)}/{need_hours}) → skip")
        return None

    hourly = hourly.tail(need_hours)
    link_cols = [c for c in hourly.columns if c != "date_time"]
    valid = [c for c in link_cols if hourly[c].notna().mean() >= 0.5]
    if not valid:
        log(f"[Bootstrap:{fdo_id}] 유효 링크 없음 → skip")
        return None

    X, Y = build_windows(
        hourly.dropna(subset=valid, how="all"),
        valid,
        params["seq_in_hours"],
        params["seq_out_hours"],
    )
    if X.size == 0:
        log(f"[Bootstrap:{fdo_id}] 학습 샘플 0 → skip")
        return None

    boot_epochs = int(params.get("bootstrap_epochs", max(1, min(3, params.get("epochs", 10)))))
    model = train_model(
        X,
        Y,
        hidden_dim=params["hidden_dim"],
        num_layers=params["num_layers"],
        out_h=params["seq_out_hours"],
        lr=params["learning_rate"],
        epochs=boot_epochs,
    )

    results = infer_next_48(model, hourly, valid, params["seq_in_hours"], params["seq_out_hours"])
    del model
    gc.collect()
    empty_device_cache()
    return results


def bootstrap_train_once(config: dict, params: dict, infer_dict, infer_lock: Lock) -> None:
    """Run a one-shot bootstrap pass over all FDOs, possibly in parallel."""
    fdo_ids = list(config["mapper"].keys())
    workers = _effective_workers(params)
    use_parallel = params.get("parallel", {}).get("enabled", True) and workers > 1

    if mp.current_process().daemon:
        log("[Bootstrap] 데몬 프로세스 감지 → 순차 실행으로 강제 전환")
        use_parallel = False

    if not use_parallel:
        for fid in fdo_ids:
            log(f"[Bootstrap] {fid} 직전 168h 학습 시작")
            res = run_bootstrap_train_for_fdo(fid, config, params)
            if res:
                with infer_lock:
                    infer_dict[fid] = json.dumps(res, ensure_ascii=False)
            log(f"[Bootstrap] {fid} 완료/스킵")
        return

    log(f"[Bootstrap] 병렬 실행 시작 (workers={workers})")
    ctx = mp.get_context("spawn")
    with ProcessPoolExecutor(max_workers=workers, mp_context=ctx) as ex:
        futs = {ex.submit(run_bootstrap_train_for_fdo, fid, config, params): fid for fid in fdo_ids}
        for fut in as_completed(futs):
            fid = futs[fut]
            try:
                res = fut.result()
                if res:
                    with infer_lock:
                        infer_dict[fid] = json.dumps(res, ensure_ascii=False)
                log(f"[Bootstrap] {fid} 완료/스킵")
            except Exception as e:
                log(f"[Bootstrap] {fid} 예외: {e}")

# =========================
# Parallel job wrapper
# =========================
def train_infer_with_wait_job(
    fdo_id: str, config: dict, params: dict, fdo_tracker=None
) -> Tuple[str, Optional[List[Dict]]]:
    """Worker job: wait for enough data (bounded), then train/infer with fallbacks."""
    global DEFAULT_SOURCE_TZ
    DEFAULT_SOURCE_TZ = config.get("params", {}).get("source_tz", "UTC")

    _tune_cpu_threads(params)
    _seed_all(params.get("seed", 42))

    try:
        wait_until_ready_for_fdo_on_schedule(fdo_id, config, params)
        results = run_train_infer_for_fdo(fdo_id, config, params, fdo_tracker)
        if results is None:
            ws = warmstart_predictions_from_history(fdo_id, config, out_h=params["seq_out_hours"])
            if ws:
                return fdo_id, ws
            dummy = _make_dummy_predictions([fdo_id], config, params["seq_out_hours"])[fdo_id]
            return fdo_id, dummy
        return fdo_id, results
    except Exception as e:
        log(f"[ParallelJob:{fdo_id}] 예외: {e}")
        try:
            dummy = _make_dummy_predictions([fdo_id], config, params.get("seq_out_hours", 48))[fdo_id]
            return fdo_id, dummy
        except Exception:
            return fdo_id, None

# =========================
# Orchestrator process (acquire→train/infer)
# =========================
def trainer_process(config: dict, infer_dict, infer_lock: Lock, stop_evt: Event, fdo_tracker=None) -> None:
    """Main training loop executed in its own process based on schedule."""
    global DEFAULT_SOURCE_TZ
    DEFAULT_SOURCE_TZ = config.get("params", {}).get("source_tz", "UTC")

    log("[Trainer] 시작")
    params = config.get("params", {})
    params.setdefault("seq_in_hours", 168)
    params.setdefault("seq_out_hours", 48)
    params.setdefault("hidden_dim", 128)
    params.setdefault("num_layers", 2)
    params.setdefault("learning_rate", 1e-4)
    params.setdefault("epochs", 10)

    _tune_cpu_threads(params)
    _seed_all(params.get("seed", 42))
    _set_deterministic(bool(params.get("training", {}).get("deterministic", False)))

    wait_until_all_fdos_ready_on_start(config, params)
    if params.get("bootstrap_train_on_start", True):
        bootstrap_train_once(config, params, infer_dict, infer_lock)

    while not stop_evt.is_set():
        sleep_until_next_run(params)

        anchor = next_anchor_dt()
        fdo_ids = list(config["mapper"].keys())
        todo_ids = [fid for fid in fdo_ids if not has_cached_for_anchor(fid, infer_dict, infer_lock, anchor)]
        if not todo_ids:
            log(f"[Trainer] 현재 앵커({anchor.strftime('%Y-%m-%d %H:%M:%S')}) 캐시 존재 → 전체 스킵")
            continue

        workers = _effective_workers(params)
        use_parallel = params.get("parallel", {}).get("enabled", True) and workers > 1

        if mp.current_process().daemon:
            log("[Trainer] 데몬 프로세스 감지 → 프로세스 풀 병렬 비활성화")
            use_parallel = False

        if not use_parallel:
            for fdo_id in todo_ids:
                if stop_evt.is_set():
                    break
                try:
                    _, results = train_infer_with_wait_job(fdo_id, config, params, fdo_tracker)
                    if results:
                        with infer_lock:
                            infer_dict[fdo_id] = json.dumps(results, ensure_ascii=False)
                        with open(f"infer_results_{fdo_id}.json", "w", encoding="utf-8") as f:
                            json.dump(results, f, ensure_ascii=False, indent=2)
                        log(f"[Trainer] {fdo_id} 완료 (예측 {len(results)} rows)")
                except Exception as e:
                    log(f"[Trainer] {fdo_id} 예외: {e}")
            continue

        log(f"[Trainer] 병렬 학습 시작 (workers={workers}, jobs={len(todo_ids)})")
        ctx = mp.get_context("spawn")
        with ProcessPoolExecutor(max_workers=workers, mp_context=ctx) as ex:
            futs = {ex.submit(train_infer_with_wait_job, fid, config, params, fdo_tracker): fid for fid in todo_ids}
            for fut in as_completed(futs):
                fid = futs[fut]
                if stop_evt.is_set():
                    break
                try:
                    _, results = fut.result()
                    if results:
                        with infer_lock:
                            infer_dict[fid] = json.dumps(results, ensure_ascii=False)
                        with open(f"infer_results_{fid}.json", "w", encoding="utf-8") as f:
                            json.dump(results, f, ensure_ascii=False, indent=2)
                        log(f"[Trainer] {fid} 완료 (예측 {len(results)} rows)")
                    else:
                        log(f"[Trainer] {fid} 결과 없음")
                except Exception as e:
                    log(f"[Trainer] {fid} 예외: {e}")

# =========================
# REST API process
# =========================
def _make_dummy_predictions_for_links(link_ids: List[str], out_h: int) -> List[Dict]:
    """Return random dummy predictions for the requested horizon."""
    now = get_kst_now()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    times = pd.date_range(start=next_hour, periods=out_h, freq="1H", tz=KST)
    results = []
    for t in times:
        row = {"date_time": t.strftime("%Y-%m-%d %H:%M:%S")}
        for lid in link_ids:
            row[str(lid)] = float(np.round(np.random.uniform(20, 80), 1))
        results.append(row)
    return results


def _make_dummy_predictions(fdo_ids: List[str], config: dict, out_h: int = 48) -> Dict[str, List[Dict]]:
    """Build dummy predictions per FDO; attempt real link ids first, else fallback."""
    out = {}
    for fdo_id in fdo_ids:
        link_ids = get_link_ids_for_fdo(fdo_id, config, sample_count=50)
        if not link_ids:
            link_ids = ["4050000301", "4050000302", "4050000303", "4050000802"]
        out[fdo_id] = _make_dummy_predictions_for_links(link_ids, out_h)
    return out


def rest_server_process(config: dict, infer_dict, infer_lock: Lock, stop_evt: Event) -> None:
    """Start a Flask HTTP server for predictions; interface kept backward-compatible."""
    global DEFAULT_SOURCE_TZ
    DEFAULT_SOURCE_TZ = config.get("params", {}).get("source_tz", "UTC")

    app = Flask(__name__)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint."""
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "server_info": "Production REST API Server"
        })

    @app.route('/api/status', methods=['GET'])
    def status_check():
        """Detailed status check endpoint."""
        return jsonify({
            "server_type": "production",
            "config_loaded": True,
            "fdo_count": len(config.get("mapper", {})),
            "timestamp": datetime.now().isoformat()
        })

    @app.route('/api/fdo/status', methods=['GET'])
    def fdo_status():
        """FDO 상태 및 동적 수집 주기 정보 엔드포인트"""
        try:
            # FDO 상태 추적기 초기화 (프로세스별로 독립적)
            fdo_tracker = init_fdo_status_tracker(config)
            if fdo_tracker:
                summary = fdo_tracker.get_status_summary()
                return jsonify({
                    "success": True,
                    "fdo_status": summary,
                    "dynamic_scheduling_enabled": True,
                    "timestamp": datetime.now().isoformat()
                })
            else:
                return jsonify({
                    "success": False,
                    "error": "FDO 상태 추적기 초기화 실패",
                    "dynamic_scheduling_enabled": False,
                    "timestamp": datetime.now().isoformat()
                })
        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e),
                "dynamic_scheduling_enabled": False,
                "timestamp": datetime.now().isoformat()
            }), 500

    @app.route('/api/tci/ai_engine/road_pred', methods=['GET', 'POST'])
    def road_prediction():
        """Serve predictions for requested FDOs. POST: success=false if any unknown FDO IDs."""
        try:
            def _parse_post_payload(req):
                payload = request.get_json(silent=True) or {}
                fids_val = payload.get("fdo_id_list", "")
                if isinstance(fids_val, list):
                    raw_ids = [str(x).strip() for x in fids_val if str(x).strip()]
                elif isinstance(fids_val, str):
                    raw_ids = [x.strip() for x in fids_val.split(",") if x.strip()]
                else:
                    raw_ids = []
                try:
                    cnt = int(payload.get("count", 48))
                except Exception:
                    cnt = 48
                cnt = max(1, min(cnt, 48))
                return raw_ids, cnt

            if request.method == "GET":
                fdo_id_list = request.args.get("fdo_id_list", "")
                count = int(request.args.get("count", 48))
                count = max(1, min(count, 48))
                requested_ids = [x.strip() for x in fdo_id_list.split(",") if x.strip()]
                if not requested_ids:
                    requested_ids = list(config["mapper"].keys())
            else:
                requested_ids, count = _parse_post_payload(request)

            mapper_keys = set(config["mapper"].keys())
            unknown_ids = [fid for fid in requested_ids if fid not in mapper_keys]
            known_ids = [fid for fid in requested_ids if fid in mapper_keys]

            predictions: Dict[str, str] = {}
            if known_ids:
                with infer_lock:
                    raw_map = {fid: infer_dict.get(fid) for fid in known_ids}

                for fid, raw in raw_map.items():
                    if raw:
                        try:
                            arr = json.loads(raw)
                            sliced = arr[:count]
                            predictions[fid] = json.dumps(sliced, ensure_ascii=False)
                        except Exception:
                            predictions[fid] = raw
                    else:
                        ws = warmstart_predictions_from_history(fid, config, out_h=count)
                        if ws:
                            predictions[fid] = json.dumps(ws, ensure_ascii=False)
                        else:
                            dummy = _make_dummy_predictions([fid], config, out_h=count)[fid]
                            predictions[fid] = json.dumps(dummy, ensure_ascii=False)

            payload = {"predictions": predictions, "success": True}

            if request.method == "POST":
                if not requested_ids or unknown_ids:
                    payload["success"] = False

            resp = jsonify(payload)

            now = get_kst_now()
            next_hour = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
            ttl = max(0, int((next_hour - now).total_seconds()))
            resp.headers["Cache-Control"] = f"public, max-age={ttl}, must-revalidate"

            body = resp.get_data()
            etag = hashlib.md5(body).hexdigest()
            resp.set_etag(etag)

            inm = request.if_none_match
            if inm and inm.contains(etag):
                return ("", 304, {"Cache-Control": resp.headers["Cache-Control"], "ETag": etag})

            return resp

        except Exception as e:
            log(f"[REST] 예외: {e}")
            # 예외가 발생해도 모든 FDO의 예측값을 제공하되 success는 false로 설정
            try:
                # 모든 FDO에 대해 더미 예측값 생성 (실제 link_id 사용)
                all_fdo_ids = list(config["mapper"].keys())
                dummy_predictions = _make_dummy_predictions(all_fdo_ids, config, out_h=count)
                predictions = {fid: json.dumps(dummy_predictions[fid], ensure_ascii=False) for fid in all_fdo_ids}
                
                payload = {"predictions": predictions, "success": False, "error": str(e)}
                return jsonify(payload)
            except Exception as fallback_e:
                log(f"[REST] 폴백 예측 생성 실패: {fallback_e}")
                # 최종 폴백: 빈 예측값으로 응답
                return jsonify({"predictions": {}, "success": False, "error": str(e)}), 500

    # YAML 설정에서 서버 설정 읽기
    server_config = config.get("server", {})
    host = server_config.get("host", "0.0.0.0")
    port = server_config.get("port", 5000)
    debug = server_config.get("debug", False)
    use_reloader = server_config.get("use_reloader", False)
    
    log(f"[REST] 서버 설정: {host}:{port}, debug={debug}")
    log("[REST] Flask 서버 시작")
    app.run(host=host, port=port, debug=debug, use_reloader=use_reloader)

# =========================
# Main entry
# =========================
def main():
    """Entry point: load config, spawn REST + trainer processes, heartbeat loop."""
    global DEFAULT_SOURCE_TZ

    log(f"[Init] DEVICE={DEVICE}")

    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)

        params = config.get("params", {})
        DEFAULT_SOURCE_TZ = params.get("source_tz", "UTC")
        _tune_cpu_threads(params)
        _seed_all(params.get("seed", 42))
        _set_deterministic(bool(params.get("training", {}).get("deterministic", False)))
        log(f"[Main] 설정 로드 (FDO 수: {len(config['mapper'])})")

        manager = Manager()
        infer_dict = manager.dict()
        infer_lock = Lock()
        stop_evt = Event()

        # FDO 상태 추적기 초기화
        fdo_tracker = init_fdo_status_tracker(config)
        
        # 빠른 시작을 위한 백그라운드 데이터 수집 시작
        log("[Main] 백그라운드 데이터 수집 시작")
        
        # 백그라운드에서 warmstart 예측 미리 생성
        preload_warmstart_predictions(config, infer_dict, infer_lock, out_h=params.get("seq_out_hours", 48))
        
        # 백그라운드에서 실제 데이터 수집 시작 (선택적)
        if params.get("bootstrap_train_on_start", False):
            log("[Main] 시작 시 부트스트랩 학습 활성화됨")
        
        procs: List[Process] = []

        p_rest = Process(target=rest_server_process, args=(config, infer_dict, infer_lock, stop_evt), daemon=True)
        p_rest.start()
        procs.append(p_rest)
        log("[Main] REST 서버 프로세스 시작")

        p_trainer = Process(target=trainer_process, args=(config, infer_dict, infer_lock, stop_evt, fdo_tracker), daemon=True)
        p_trainer.start()
        procs.append(p_trainer)
        log("[Main] 트레이너 프로세스 시작")
        
        # 서버 설정 읽기
        server_config = config.get("server", {})
        host = server_config.get("host", "0.0.0.0")
        port = server_config.get("port", 5000)
        
        # 서버 상태 요약 출력
        log(f"[Main] 모든 프로세스 시작 완료 - REST API: {host}:{port}")
        log(f"[Main] FDO 수: {len(config['mapper'])}, 예측 시간: {params.get('seq_out_hours', 48)}시간")

        while True:
            time.sleep(60)
            log("[Main] heartbeat...")

    except KeyboardInterrupt:
        log("[Main] 종료 신호 수신")
        stop_evt.set()
        for p in procs:
            p.join(timeout=10)
    except Exception as e:
        log(f"[Main] 예외: {e}")


if __name__ == "__main__":
    try:
        if mp.get_start_method(allow_none=True) != "spawn":
            set_start_method("spawn")
    except RuntimeError:
        pass

    main()
