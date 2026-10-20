import sys
from importlib import import_module
from pathlib import Path

service_root = Path(__file__).resolve().parents[3]
if str(service_root) not in sys.path:
    sys.path.insert(0, str(service_root))

TritonPythonModel = import_module("modules.serving.triton").CoreInference

__all__ = ["TritonPythonModel"]
