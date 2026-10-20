import math

TRAINED_SIZES = {3: (16, 32, 64, 128), 2: (16, 32, 64, 128)}


def n_spatial_dims(shape):
    return sum(size != 1 for size in shape)


def plan_size(shape, max_voxels, sizes=None):
    """셀 수 예산 안에서 원본과 가장 가까운 모델 격자 선택"""
    dims = n_spatial_dims(shape)
    if dims not in (2, 3):
        raise ValueError("At least two spatial axes are required.")
    sizes = tuple(sizes) if sizes else TRAINED_SIZES[dims]
    if not sizes or any(size < 16 or size > 128 for size in sizes):
        raise ValueError("Model size candidates must be between 16 and 128.")
    sizes = tuple(sorted(set(sizes)))
    levels = [
        None if size == 1 else min(range(len(sizes)), key=lambda i: abs(math.log(sizes[i] / size)))
        for size in shape
    ]
    while math.prod(1 if index is None else sizes[index] for index in levels) > max_voxels:
        candidates = [axis for axis, index in enumerate(levels) if index is not None and index > 0]
        if not candidates:
            break
        axis = max(candidates, key=lambda axis: sizes[levels[axis] - 1] / shape[axis])
        levels[axis] -= 1
    return tuple(1 if index is None else sizes[index] for index in levels)
