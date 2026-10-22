from __future__ import annotations

from pathlib import Path
from typing import Any

from boxmot import create_tracker


REID_REQUIRED = {"strongsort", "deepocsort"}
REID_OPTIONAL = {"botsort", "hybridsort", "boosttrack"}
OPTIONAL_REID_DEFAULTS = {
    "botsort": True,
    "hybridsort": True,
    "boosttrack": False,
}
PROJECT_ROOT = Path(__file__).resolve().parents[3]


def default_reid_weights() -> Path:
    return PROJECT_ROOT / "artifacts" / "reid" / "osnet_x0_25_msmt17.pt"


def build_tracker(
    tracker_name: str,
    tracker_params: dict[str, Any],
    *,
    frame_rate: int,
    image_width: int,
    image_height: int,
    device: str,
    half: bool,
    reid_weights: str | None,
):
    params = dict(tracker_params)

    
    
    try:
        if "max_age" in params:
            max_age = int(params["max_age"])
            if "max_obs" not in params:
                params["max_obs"] = max_age
            else:
                params["max_obs"] = max(int(params["max_obs"]), max_age)
    except Exception:
        pass

    resolved_device = str(device or "cpu").strip().lower()
    if resolved_device in {"mps", "cuda"}:
        try:
            import torch

            if resolved_device == "mps":
                if not (hasattr(torch.backends, "mps") and torch.backends.mps.is_available()):
                    resolved_device = "cpu"
            elif resolved_device == "cuda":
                if not (hasattr(torch, "cuda") and torch.cuda.is_available()):
                    resolved_device = "cpu"
        except Exception:
            resolved_device = "cpu"

    if tracker_name in {"bytetrack", "botsort"}:
        params["frame_rate"] = frame_rate
    if tracker_name == "hybridsort":
        params.setdefault("dataset", "mot20")
        params["use_custom_kf"] = True
        params["with_reid"] = True
    if tracker_name == "sfsort":
        params.pop("det_thresh", None)
        params["frame_width"] = image_width
        params["frame_height"] = image_height

    resolved_weights = Path(reid_weights).expanduser().resolve() if reid_weights else default_reid_weights()
    if tracker_name in REID_REQUIRED:
        tracker_reid_weights = str(resolved_weights)
    elif tracker_name in REID_OPTIONAL:
        with_reid = bool(params.get("with_reid", OPTIONAL_REID_DEFAULTS.get(tracker_name, False)))
        params["with_reid"] = with_reid
        tracker_reid_weights = str(resolved_weights) if with_reid else None
    else:
        tracker_reid_weights = None

    if tracker_reid_weights is not None:
        Path(tracker_reid_weights).parent.mkdir(parents=True, exist_ok=True)

    return create_tracker(
        tracker_type=tracker_name,
        tracker_config=None,
        reid_weights=tracker_reid_weights,
        device=resolved_device,
        half=half,
        per_class=False,
        evolve_param_dict=params,
    )
