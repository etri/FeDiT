import numpy as np
import torch

from modules.domain.schemas import FlowMetadata
from modules.workers.execution.preprocessing.resample import PERIODIC, resample, taps


def regrid_mask(source, target, thickness=None):
    for region, fraction, _ in _slabs(source, target, thickness):
        target.building_mask[region] = (fraction < 0.5).numpy().astype(np.uint8)


def regrid_frame(source, source_frame, target, target_frame, thickness=None):
    def frame(planes):
        return _read_flow(source, source_frame, planes)

    for region, _, value in _slabs(source, target, thickness, frame):
        solid = torch.from_numpy(target.building_mask[region] == 1)
        target.write_region(target_frame, value.masked_fill_(solid[..., None], 0.0).numpy(), region)


def add_regridded_delta(coarse, frame_a, frame_b, fine, base_frame, out_frame, thickness=None):
    """저해상도 변화량만 원본 해상도로 변환해 기준 프레임에 합산"""

    def delta(planes):
        return _read_flow(coarse, frame_b, planes).sub_(_read_flow(coarse, frame_a, planes))

    for region, _, value in _slabs(coarse, fine, thickness, delta):
        solid = torch.from_numpy(fine.building_mask[region] == 1)
        value += torch.from_numpy(fine.read_region(base_frame, region)[0])
        fine.write_region(out_frame, value.masked_fill_(solid[..., None], 0.0).numpy(), region)


def _slabs(source, target, thickness=None, read=None):
    """(영역, 유체 비율 [s, Y, Z], 변환값 [s, Y, Z, C]) 생성"""
    metadata, target_grid = FlowMetadata.parse(source.metadata), FlowMetadata.parse(target.metadata).grid
    tolerance = 1e-6 * min(target_grid.spacing)
    if not (
        np.allclose(metadata.grid.origin, target_grid.origin, rtol=0, atol=tolerance)
        and np.allclose(metadata.grid.extent, target_grid.extent, rtol=0, atol=tolerance)
    ):
        raise ValueError("the two stores do not cover the same physical box")
    codes = metadata.boundary_codes()
    n_in, n_out = source.shape[0], target.shape[0]
    if n_in == n_out:  # 같은 크기는 보간 없이 원본 유지
        index, weight = torch.arange(n_out)[:, None], torch.ones(n_out, 1)
    else:
        index, weight = taps(n_in, n_out, periodic=codes[0] == [PERIODIC, PERIODIC])
    # 원본 읽기를 청크 두께로 제한하도록 축소 비율로 슬랩 조절
    thickness = thickness or max(1, int(target.flow.chunks[1] * min(1.0, n_out / n_in)))

    for region in target.slabs(thickness):
        planes = torch.unique(index[region[0]])
        operator = (
            torch.searchsorted(planes, index[region[0]]),
            weight[region[0]],
            target.shape[1:],
            codes[1:],
        )
        solid = torch.from_numpy(_read_planes(lambda span: source.building_mask[span], planes.numpy()) == 1)
        fraction = _to_slab((~solid).float(), *operator)
        value = None
        if read is not None:
            value = _to_slab(read(planes.numpy()).masked_fill_(solid[..., None], 0.0), *operator)
            value /= fraction.clamp(min=1e-6)[..., None]
            value.masked_fill_((fraction < 0.5)[..., None], 0.0)
        yield region, fraction, value


def _to_slab(x, rows, weight, size, codes):
    """[P, Y, Z, ...] 원본 면을 [s, Y', Z', ...] 슬랩으로 변환"""
    shape = (-1,) + (1,) * (x.dim() - 1)
    out = None
    for k in range(rows.shape[1]):
        term = x[rows[:, k]].mul_(weight[:, k].reshape(shape))
        out = term if out is None else out.add_(term)
    return resample(out, size, codes, dims=(1, 2))


def _read_flow(store, frame, planes):
    whole = slice(None)
    return torch.from_numpy(
        _read_planes(lambda span: store.read_region(frame, (span, whole, whole))[0], planes)
    )


def _read_planes(read, planes):
    runs = np.split(planes, np.flatnonzero(np.diff(planes) > 1) + 1)
    return np.concatenate([read(slice(int(run[0]), int(run[-1]) + 1)) for run in runs])
