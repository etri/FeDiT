from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
import triton_python_backend_utils as pb_utils

from ..common.schemas import SpecError
from ..pipeline.codec import pack_context, unpack_context
from ..pipeline.service import prepare_request, restore_response
from ..runtime.inference import infer_prepared
from ..runtime.weights import DEFAULT_MODEL_VERSION_ROOT


def _input(request, name):
    tensor = pb_utils.get_input_tensor_by_name(request, name)
    if tensor is None:
        raise ValueError(f"Required input is missing: {name}.")
    return tensor.as_numpy()


def _bytes(request, name):
    values = _input(request, name)
    if values.shape != (1,):
        raise ValueError(f"{name} input must have shape [1].")
    value = values[0]
    if isinstance(value, str):
        return value.encode("utf-8")
    if not isinstance(value, bytes):
        raise TypeError(f"{name} input must be BYTES.")
    return value


def _text_tensor(name, value):
    return pb_utils.Tensor(name, np.asarray([value], dtype=object))


def _json(value):
    return json.dumps(value, ensure_ascii=False, allow_nan=False).encode("utf-8")


def _prepared_response(prepared):
    return [pb_utils.Tensor("SPATIAL", prepared["spatial"]),
            pb_utils.Tensor("CONDITIONS", prepared["conditions"]),
            _text_tensor("MODEL_SPEC", _json(prepared["model_spec"])),
            _text_tensor("CONTEXT", pack_context(prepared["context"]))]


class _Stage:
    def initialize(self, args):
        """공통 초기화"""

    def execute(self, requests):
        responses = []
        for request in requests:
            try:
                responses.append(pb_utils.InferenceResponse(output_tensors=self.process(request)))
            except (ValueError, TypeError, KeyError, UnicodeError, FileNotFoundError, SpecError) as error:
                responses.append(self._error(str(error), "INVALID_ARG"))
            except MemoryError:
                responses.append(self._error("Inference memory is insufficient.", "UNAVAILABLE"))
            except Exception as error:
                responses.append(self._error(str(error), "INTERNAL"))
        return responses

    @staticmethod
    def _error(message, kind):
        code = getattr(pb_utils.TritonError, kind, None)
        error = pb_utils.TritonError(message, code) if code is not None else pb_utils.TritonError(message)
        return pb_utils.InferenceResponse(error=error)


class Preprocess(_Stage):
    def initialize(self, args):
        self.model_version_root = Path(os.getenv("FLOWCAST_MODEL_VERSION", str(DEFAULT_MODEL_VERSION_ROOT)))

    def process(self, request):
        prepared = prepare_request(_bytes(request, "REQUEST"), _bytes(request, "PAYLOAD"), self.model_version_root)
        return _prepared_response(prepared)


class CoreInference(_Stage):
    def initialize(self, args):
        configured = os.getenv("FLOWCAST_DEVICE", "auto")
        if configured in {"auto", "cuda"} and args.get("model_instance_kind") == "GPU":
            self.device = f"cuda:{args['model_instance_device_id']}"
        else:
            self.device = configured

    def process(self, request):
        import torch

        try:
            output, details = infer_prepared(_input(request, "SPATIAL"), _input(request, "CONDITIONS"),
                                            json.loads(_bytes(request, "MODEL_SPEC")), requested_device=self.device)
        except torch.OutOfMemoryError as error:
            raise MemoryError("Core inference memory is insufficient.") from error
        return [pb_utils.Tensor("NORMALIZED", output), _text_tensor("MODEL_DETAILS", _json(details))]


class Postprocess(_Stage):
    def process(self, request):
        data, metadata = restore_response(_input(request, "NORMALIZED"), json.loads(_bytes(request, "MODEL_DETAILS")),
                                         unpack_context(_bytes(request, "CONTEXT")))
        return [_text_tensor("RESULT", data), _text_tensor("METADATA", metadata)]
