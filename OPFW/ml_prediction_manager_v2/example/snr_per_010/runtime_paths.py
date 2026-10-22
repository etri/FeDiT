import os
from pathlib import Path

PACKAGE_ROOT=Path(__file__).resolve().parent
WORK_ROOT=Path(os.environ.get('SNR010_WORK_ROOT',str(PACKAGE_ROOT/'workspace'))).expanduser().resolve()
RUN_ROOT=Path(os.environ.get('SNR010_RUN_ROOT',str(WORK_ROOT/'runs/inference'))).expanduser().resolve()
DELIVERY_ROOT=Path(os.environ.get('SNR010_DELIVERY_ROOT',str(PACKAGE_ROOT))).expanduser().resolve()
