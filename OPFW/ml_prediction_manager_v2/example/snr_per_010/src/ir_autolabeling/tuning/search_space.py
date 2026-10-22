from __future__ import annotations

from typing import Any

import yaml
from boxmot import get_tracker_config


COMMON_BASE_TRACKER_SEARCH: dict[str, dict[str, Any]] = {
    "det_thresh": {"type": "uniform", "range": [0.05, 0.40]},
    "max_age": {"type": "qrandint", "range": [15, 80, 5]},
    "max_obs": {"type": "qrandint", "range": [30, 120, 5]},
    "min_hits": {"type": "randint", "range": [1, 5]},
    "iou_threshold": {"type": "uniform", "range": [0.10, 0.70]},
    "asso_func": {"type": "choice", "options": ["iou", "hmiou"]},
}


def sample_detector_params(
    trial,
    detector_search_cfg: dict[str, Any],
    *,
    has_sam_boxes: bool = True,
) -> dict[str, Any]:
    top_k_options = detector_search_cfg.get("top_k", [100, 150, 200])
    box_source_options = detector_search_cfg.get("box_source", ["sam", "grounding", "union"])
    if not has_sam_boxes:
        box_source_options = ["grounding"]
    min_area_cfg = detector_search_cfg["min_box_area"]
    min_area_low = float(min_area_cfg["low"])
    min_area_high = float(min_area_cfg["high"])
    min_area_log = bool(min_area_cfg.get("log", False))
    if min_area_log and min_area_low <= 0:
        
        min_area_log = False
    params = {
        "box_source": trial.suggest_categorical("detector.box_source", box_source_options),
        "score_threshold": trial.suggest_float(
            "detector.score_threshold",
            float(detector_search_cfg["score_threshold"]["low"]),
            float(detector_search_cfg["score_threshold"]["high"]),
        ),
        "nms_iou_threshold": trial.suggest_float(
            "detector.nms_iou_threshold",
            float(detector_search_cfg["nms_iou_threshold"]["low"]),
            float(detector_search_cfg["nms_iou_threshold"]["high"]),
        ),
        "min_box_area": trial.suggest_float(
            "detector.min_box_area",
            min_area_low,
            min_area_high,
            log=min_area_log,
        ),
        "min_height": trial.suggest_float(
            "detector.min_height",
            float(detector_search_cfg["min_height"]["low"]),
            float(detector_search_cfg["min_height"]["high"]),
        ),
        "min_width": trial.suggest_float(
            "detector.min_width",
            float(detector_search_cfg["min_width"]["low"]),
            float(detector_search_cfg["min_width"]["high"]),
        ),
        "min_height_width_ratio": trial.suggest_float(
            "detector.min_height_width_ratio",
            float(detector_search_cfg["min_height_width_ratio"]["low"]),
            float(detector_search_cfg["min_height_width_ratio"]["high"]),
        ),
        "max_height_width_ratio": trial.suggest_float(
            "detector.max_height_width_ratio",
            float(detector_search_cfg["max_height_width_ratio"]["low"]),
            float(detector_search_cfg["max_height_width_ratio"]["high"]),
        ),
        "top_k": trial.suggest_categorical("detector.top_k", top_k_options),
    }
    rescue_cfg = detector_search_cfg.get("small_box_rescue")
    if rescue_cfg:
        enable_rescue_options = list(detector_search_cfg.get("enable_rescue", [False, True]))
        if len(enable_rescue_options) == 1:
            enable_rescue = bool(enable_rescue_options[0])
        else:
            enable_rescue = bool(trial.suggest_categorical("detector.enable_rescue", enable_rescue_options))
        if enable_rescue:
            rescue_max_area_cfg = rescue_cfg["max_area"]
            rescue_max_area_low = float(rescue_max_area_cfg["low"])
            rescue_max_area_high = float(rescue_max_area_cfg["high"])
            rescue_max_area_log = bool(rescue_max_area_cfg.get("log", False))
            if rescue_max_area_log and rescue_max_area_low <= 0:
                rescue_max_area_log = False
            params.update(
                {
                    "rescue_score_threshold": trial.suggest_float(
                        "detector.rescue_score_threshold",
                        float(rescue_cfg["score_threshold"]["low"]),
                        float(rescue_cfg["score_threshold"]["high"]),
                    ),
                    "rescue_max_area": trial.suggest_float(
                        "detector.rescue_max_area",
                        rescue_max_area_low,
                        rescue_max_area_high,
                        log=rescue_max_area_log,
                    ),
                    "rescue_min_height": trial.suggest_float(
                        "detector.rescue_min_height",
                        float(rescue_cfg["min_height"]["low"]),
                        float(rescue_cfg["min_height"]["high"]),
                    ),
                    "rescue_min_width": trial.suggest_float(
                        "detector.rescue_min_width",
                        float(rescue_cfg["min_width"]["low"]),
                        float(rescue_cfg["min_width"]["high"]),
                    ),
                    "rescue_min_height_width_ratio": trial.suggest_float(
                        "detector.rescue_min_height_width_ratio",
                        float(rescue_cfg["min_height_width_ratio"]["low"]),
                        float(rescue_cfg["min_height_width_ratio"]["high"]),
                    ),
                }
            )
    upper_cfg = detector_search_cfg.get("upper_zone")
    if upper_cfg:
        enable_upper_zone_options = list(detector_search_cfg.get("enable_upper_zone", [False, True]))
        if len(enable_upper_zone_options) == 1:
            enable_upper_zone = bool(enable_upper_zone_options[0])
        else:
            enable_upper_zone = bool(trial.suggest_categorical("detector.enable_upper_zone", enable_upper_zone_options))
        if enable_upper_zone:
            upper_area_cfg = upper_cfg["min_box_area"]
            upper_area_low = float(upper_area_cfg["low"])
            upper_area_high = float(upper_area_cfg["high"])
            upper_area_log = bool(upper_area_cfg.get("log", False))
            if upper_area_log and upper_area_low <= 0:
                upper_area_log = False
            params.update(
                {
                    "upper_zone_y_limit": trial.suggest_float(
                        "detector.upper_zone_y_limit",
                        float(upper_cfg["y_limit"]["low"]),
                        float(upper_cfg["y_limit"]["high"]),
                    ),
                    "upper_zone_score_threshold": trial.suggest_float(
                        "detector.upper_zone_score_threshold",
                        float(upper_cfg["score_threshold"]["low"]),
                        float(upper_cfg["score_threshold"]["high"]),
                    ),
                    "upper_zone_min_box_area": trial.suggest_float(
                        "detector.upper_zone_min_box_area",
                        upper_area_low,
                        upper_area_high,
                        log=upper_area_log,
                    ),
                    "upper_zone_min_height": trial.suggest_float(
                        "detector.upper_zone_min_height",
                        float(upper_cfg["min_height"]["low"]),
                        float(upper_cfg["min_height"]["high"]),
                    ),
                    "upper_zone_min_width": trial.suggest_float(
                        "detector.upper_zone_min_width",
                        float(upper_cfg["min_width"]["low"]),
                        float(upper_cfg["min_width"]["high"]),
                    ),
                    "upper_zone_min_height_width_ratio": trial.suggest_float(
                        "detector.upper_zone_min_height_width_ratio",
                        float(upper_cfg["min_height_width_ratio"]["low"]),
                        float(upper_cfg["min_height_width_ratio"]["high"]),
                    ),
                }
            )
    score_calibration_cfg = detector_search_cfg.get("score_calibration")
    if score_calibration_cfg:
        enable_score_calibration_options = list(detector_search_cfg.get("enable_score_calibration", [False, True]))
        if len(enable_score_calibration_options) == 1:
            enable_score_calibration = bool(enable_score_calibration_options[0])
        else:
            enable_score_calibration = bool(
                trial.suggest_categorical("detector.enable_score_calibration", enable_score_calibration_options)
            )
        if enable_score_calibration:
            if "min_prompt_votes" in score_calibration_cfg:
                params["min_prompt_votes"] = trial.suggest_categorical(
                    "detector.min_prompt_votes",
                    list(score_calibration_cfg["min_prompt_votes"]),
                )
            if "prompt_support_weight" in score_calibration_cfg:
                params["prompt_support_weight"] = trial.suggest_float(
                    "detector.prompt_support_weight",
                    float(score_calibration_cfg["prompt_support_weight"]["low"]),
                    float(score_calibration_cfg["prompt_support_weight"]["high"]),
                )
            if "aspect_ratio_target" in score_calibration_cfg:
                params["aspect_ratio_target"] = trial.suggest_float(
                    "detector.aspect_ratio_target",
                    float(score_calibration_cfg["aspect_ratio_target"]["low"]),
                    float(score_calibration_cfg["aspect_ratio_target"]["high"]),
                )
            if "aspect_ratio_tolerance" in score_calibration_cfg:
                params["aspect_ratio_tolerance"] = trial.suggest_float(
                    "detector.aspect_ratio_tolerance",
                    float(score_calibration_cfg["aspect_ratio_tolerance"]["low"]),
                    float(score_calibration_cfg["aspect_ratio_tolerance"]["high"]),
                )
            if "aspect_ratio_score_bonus" in score_calibration_cfg:
                params["aspect_ratio_score_bonus"] = trial.suggest_float(
                    "detector.aspect_ratio_score_bonus",
                    float(score_calibration_cfg["aspect_ratio_score_bonus"]["low"]),
                    float(score_calibration_cfg["aspect_ratio_score_bonus"]["high"]),
                )
            if "aspect_ratio_score_penalty" in score_calibration_cfg:
                params["aspect_ratio_score_penalty"] = trial.suggest_float(
                    "detector.aspect_ratio_score_penalty",
                    float(score_calibration_cfg["aspect_ratio_score_penalty"]["low"]),
                    float(score_calibration_cfg["aspect_ratio_score_penalty"]["high"]),
                )
            if "mask_fill_target" in score_calibration_cfg:
                params["mask_fill_target"] = trial.suggest_float(
                    "detector.mask_fill_target",
                    float(score_calibration_cfg["mask_fill_target"]["low"]),
                    float(score_calibration_cfg["mask_fill_target"]["high"]),
                )
            if "mask_fill_tolerance" in score_calibration_cfg:
                params["mask_fill_tolerance"] = trial.suggest_float(
                    "detector.mask_fill_tolerance",
                    float(score_calibration_cfg["mask_fill_tolerance"]["low"]),
                    float(score_calibration_cfg["mask_fill_tolerance"]["high"]),
                )
            if "mask_fill_score_bonus" in score_calibration_cfg:
                params["mask_fill_score_bonus"] = trial.suggest_float(
                    "detector.mask_fill_score_bonus",
                    float(score_calibration_cfg["mask_fill_score_bonus"]["low"]),
                    float(score_calibration_cfg["mask_fill_score_bonus"]["high"]),
                )
            if "mask_fill_score_penalty" in score_calibration_cfg:
                params["mask_fill_score_penalty"] = trial.suggest_float(
                    "detector.mask_fill_score_penalty",
                    float(score_calibration_cfg["mask_fill_score_penalty"]["low"]),
                    float(score_calibration_cfg["mask_fill_score_penalty"]["high"]),
                )
            if "small_box_area_threshold" in score_calibration_cfg:
                sb_area_cfg = score_calibration_cfg["small_box_area_threshold"]
                sb_area_low = float(sb_area_cfg["low"])
                sb_area_high = float(sb_area_cfg["high"])
                sb_area_log = bool(sb_area_cfg.get("log", False))
                if sb_area_log and sb_area_low <= 0:
                    sb_area_log = False
                params["small_box_area_threshold"] = trial.suggest_float(
                    "detector.small_box_area_threshold",
                    sb_area_low,
                    sb_area_high,
                    log=sb_area_log,
                )
            if "small_box_score_bonus" in score_calibration_cfg:
                params["small_box_score_bonus"] = trial.suggest_float(
                    "detector.small_box_score_bonus",
                    float(score_calibration_cfg["small_box_score_bonus"]["low"]),
                    float(score_calibration_cfg["small_box_score_bonus"]["high"]),
                )
            if "upper_zone_small_box_bonus" in score_calibration_cfg:
                params["upper_zone_small_box_bonus"] = trial.suggest_float(
                    "detector.upper_zone_small_box_bonus",
                    float(score_calibration_cfg["upper_zone_small_box_bonus"]["low"]),
                    float(score_calibration_cfg["upper_zone_small_box_bonus"]["high"]),
                )
            if "gs_iou_min" in score_calibration_cfg:
                params["gs_iou_min"] = trial.suggest_float(
                    "detector.gs_iou_min",
                    float(score_calibration_cfg["gs_iou_min"]["low"]),
                    float(score_calibration_cfg["gs_iou_min"]["high"]),
                )
            if "gs_iou_weight" in score_calibration_cfg:
                params["gs_iou_weight"] = trial.suggest_float(
                    "detector.gs_iou_weight",
                    float(score_calibration_cfg["gs_iou_weight"]["low"]),
                    float(score_calibration_cfg["gs_iou_weight"]["high"]),
                )
            if "score_power" in score_calibration_cfg:
                params["score_power"] = trial.suggest_float(
                    "detector.score_power",
                    float(score_calibration_cfg["score_power"]["low"]),
                    float(score_calibration_cfg["score_power"]["high"]),
                )
            if "score_bias" in score_calibration_cfg:
                params["score_bias"] = trial.suggest_float(
                    "detector.score_bias",
                    float(score_calibration_cfg["score_bias"]["low"]),
                    float(score_calibration_cfg["score_bias"]["high"]),
                )
    return params


def _sample_from_boxmot_spec(trial, key: str, spec: dict[str, Any], *, param_name: str | None = None) -> Any:
    kind = spec["type"]
    name = param_name or f"tracker.{key}"
    if kind == "uniform":
        return trial.suggest_float(name, float(spec["range"][0]), float(spec["range"][1]))
    if kind == "loguniform":
        low = float(spec["range"][0])
        high = float(spec["range"][1])
        if low <= 0 or high <= 0:
            return trial.suggest_float(name, low, high)
        return trial.suggest_float(name, low, high, log=True)
    if kind == "choice":
        return trial.suggest_categorical(name, list(spec["options"]))
    if kind == "grid_search":
        return trial.suggest_categorical(name, list(spec["values"]))
    if kind == "randint":
        return int(trial.suggest_int(name, int(spec["range"][0]), int(spec["range"][1])))
    if kind == "qrandint":
        low, high, step = [int(v) for v in spec["range"]]
        return int(trial.suggest_int(name, low, high, step=step))
    raise ValueError(f"Unsupported BoxMOT search type: {kind}")


def sample_tracker_params(
    trial,
    tracker_name: str,
    tracker_search_cfg: dict[str, Any] | None = None,
) -> dict[str, Any]:
    def _maybe_build_override_spec(key: str, value: Any) -> dict[str, Any] | None:
        if value is None:
            return None
        if isinstance(value, dict) and "type" in value:
            return value
        if isinstance(value, list):
            if len(value) == 0:
                return None
            return {"type": "choice", "options": list(value)}
        if isinstance(value, dict) and "low" in value and "high" in value:
            low = value["low"]
            high = value["high"]
            use_log = bool(value.get("log", False))
            int_keys = {
                "max_age",
                "max_obs",
                "min_hits",
                "track_buffer",
                "max_time_lost",
            }
            if key in int_keys and not use_log:
                return {"type": "randint", "range": [int(low), int(high)]}
            return {
                "type": "loguniform" if use_log else "uniform",
                "range": [float(low), float(high)],
            }
        return None

    override_block: dict[str, Any] = {}
    if isinstance(tracker_search_cfg, dict) and tracker_search_cfg:
        if tracker_name in tracker_search_cfg and isinstance(tracker_search_cfg.get(tracker_name), dict):
            override_block = dict(tracker_search_cfg.get(tracker_name) or {})
        else:
            
            
            
            override_block = dict(tracker_search_cfg)

    override_specs: dict[str, dict[str, Any]] = {}
    for key, value in override_block.items():
        if key in {"allow_default_config", "allow_boxmot_config"}:
            continue
        spec = _maybe_build_override_spec(str(key), value)
        if spec is not None:
            override_specs[str(key)] = spec

    config_path = get_tracker_config(tracker_name)
    with open(config_path, "r", encoding="utf-8") as handle:
        config = yaml.safe_load(handle)

    params: dict[str, Any] = {}
    for key, spec in config.items():
        if key == "frame_rate":
            continue
        sampled_spec = spec
        if key in override_specs:
            sampled_spec = override_specs[key]
        params[key] = _sample_from_boxmot_spec(
            trial,
            key,
            sampled_spec,
            param_name=f"tracker.{tracker_name}.{key}",
        )

    if tracker_name == "hybridsort":
        params["use_custom_kf"] = True
        params["with_reid"] = True

    for key, spec in COMMON_BASE_TRACKER_SEARCH.items():
        if key in params:
            continue
        sampled_spec = spec
        if key in override_specs:
            sampled_spec = override_specs[key]
        params[key] = _sample_from_boxmot_spec(
            trial,
            key,
            sampled_spec,
            param_name=f"tracker.{tracker_name}.{key}",
        )

    
    
    
    
    try:
        if "max_age" in params and "max_obs" in params:
            params["max_obs"] = max(int(params["max_obs"]), int(params["max_age"]))
    except Exception:
        pass

    if tracker_name == "sfsort":
        
        
        
        params.pop("det_thresh", None)
    return params
