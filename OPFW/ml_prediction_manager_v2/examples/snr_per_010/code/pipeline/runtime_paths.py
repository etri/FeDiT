import os
from pathlib import Path

# snr_per_010/                package root (DELIVERY_ROOT)
#   code/pipeline/            this file and every stage script (PIPELINE_ROOT)
#   code/{src,scripts,configs,external/TrackEval}   copied into each run root (CODE_ROOT)
#   config/INFERENCE_PROFILE.json                   fixed operating points (PROFILE_PATH)
#   models/{weights,reid,checkpoints}               trained models (MODELS_ROOT)
#   data/MOT20                                      input dataset (DATA_ROOT)
PIPELINE_ROOT=Path(__file__).resolve().parent
CODE_ROOT=PIPELINE_ROOT.parent
PACKAGE_ROOT=CODE_ROOT.parent
PROFILE_PATH=PACKAGE_ROOT/'config'/'INFERENCE_PROFILE.json'
WORK_ROOT=Path(os.environ.get('SNR010_WORK_ROOT',str(PACKAGE_ROOT/'workspace'))).expanduser().resolve()
RUN_ROOT=Path(os.environ.get('SNR010_RUN_ROOT',str(WORK_ROOT/'runs/inference'))).expanduser().resolve()
DELIVERY_ROOT=Path(os.environ.get('SNR010_DELIVERY_ROOT',str(PACKAGE_ROOT))).expanduser().resolve()
MODELS_ROOT=DELIVERY_ROOT/'models'

# The scripts under code/src and code/scripts address models through the run-root layout below.
# The run root links these names to the real folders under models/ (see run_inference.py).
RUN_LAYOUT=(('weights','models/weights'),('artifacts/reid','models/reid'),('outputs/models','models/checkpoints'))


def run_layout_path(package_relative):
    """Map a package-relative model path (models/reid/x.pt) to its run-root path (artifacts/reid/x.pt)."""
    for run_name,package_name in RUN_LAYOUT:
        if package_relative==package_name or package_relative.startswith(package_name+'/'):
            return run_name+package_relative[len(package_name):]
    raise ValueError('Not a model path: '+package_relative)


def resolve_data_root(workspace=None,explicit=None):
    """Directory that contains MOT20/. Order: explicit argument, SNR010_DATA_ROOT, data/ in the package,
    then the legacy <workspace>/data used before the folder reorganisation (only if it already holds MOT20)."""
    if explicit:
        return Path(explicit).expanduser().resolve()
    configured=os.environ.get('SNR010_DATA_ROOT')
    if configured:
        return Path(configured).expanduser().resolve()
    default=PACKAGE_ROOT/'data'
    legacy=(Path(workspace).expanduser().resolve() if workspace else WORK_ROOT)/'data'
    if not (default/'MOT20/train').is_dir() and (legacy/'MOT20/train').is_dir():
        return legacy
    return default


DATA_ROOT=resolve_data_root()
