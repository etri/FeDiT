import itertools

import numpy as np
import vtk
from vtk.util.numpy_support import numpy_to_vtk, vtk_to_numpy


def _distance(seeds, spacing, far):
    """VTK의 제곱 거리를 유클리드 거리로 변환"""
    if not seeds.any():
        return np.full(seeds.shape, far, dtype=np.float64)
    image = vtk.vtkImageData()
    image.SetDimensions(*seeds.shape)
    image.SetSpacing(*spacing)
    image.GetPointData().SetScalars(numpy_to_vtk((~seeds).astype(np.float64).ravel(order="F"), deep=True))
    transform = vtk.vtkImageEuclideanDistance()
    transform.SetInputData(image)
    transform.SetConsiderAnisotropy(True)
    transform.SetMaximumDistance(far * far)
    transform.SetAlgorithmToSaitoCached()
    transform.Update()
    squared = vtk_to_numpy(transform.GetOutput().GetPointData().GetScalars()).reshape(seeds.shape, order="F")
    return np.sqrt(np.maximum(squared, 0.0))


class Boundary:
    """전체 격자에서 공유하며 반 셀 폭을 보정한 복셀 표면 부호 거리"""

    def __init__(self, sample, floor=None):
        self.centres = [np.asarray(axis, dtype=np.float64).copy() for axis in sample.centres]
        self.edges = [np.asarray(axis, dtype=np.float64).copy() for axis in sample.edges]
        self.valid = sample.valid.copy()
        self.floor = None if floor is None else float(floor)
        spacing = np.array(
            [
                np.diff(axis).mean() if len(axis) > 1 else edge[-1] - edge[0]
                for axis, edge in zip(self.centres, self.edges)
            ]
        )
        self.far = float(np.linalg.norm([edge[-1] - edge[0] for edge in self.edges]) + spacing.max())
        if self.valid.all() or not self.valid.any():
            sign = 1.0 if self.valid.all() else -1.0
            self.distance = np.full(self.valid.shape, sign * self.far, dtype=np.float32)
            self.gradient_bound = 0.0 if floor is None else 1.0
            return
        outside = _distance(~self.valid, spacing, self.far)
        inside = _distance(self.valid, spacing, self.far)
        signed = np.where(self.valid, outside, -inside)
        derivatives = [
            np.gradient(signed, spacing[axis], axis=axis) if size > 1 else np.zeros_like(signed)
            for axis, size in enumerate(signed.shape)
        ]
        normal = np.stack(derivatives, axis=-1)
        length = np.linalg.norm(normal, axis=-1, keepdims=True)
        np.divide(normal, length, out=normal, where=length > 0)
        half_cell = 0.5 * np.sum(np.abs(normal) * spacing, axis=-1)
        # 거리장이 평평한 대칭점은 최소 반 셀 폭으로 보정
        half_cell = np.where(length[..., 0] > 0, half_cell, 0.5 * spacing.min())
        self.distance = (np.sign(signed) * np.maximum(np.abs(signed) - half_cell, 0.0)).astype(np.float32)
        component_bounds = [
            float(np.abs(np.diff(self.distance, axis=axis)).max(initial=0.0) / spacing[axis])
            for axis in range(3)
        ]
        self.gradient_bound = max(float(np.linalg.norm(component_bounds)), 0.0 if floor is None else 1.0)

    def at(self, points):
        """삼선형 거리와 그 도함수이며 선택적 바닥은 실제 z 좌표 사용"""
        query = np.asarray(points, dtype=np.float64)
        if query.shape[-1:] != (3,) or not np.isfinite(query).all():
            raise ValueError("boundary points must contain finite [..., 3] coordinates")
        shape = query.shape[:-1]
        query = query.reshape(-1, 3)
        first, second, weights, rates = [], [], [], []
        for axis, centre in enumerate(self.centres):
            if len(centre) == 1:
                first.append(np.zeros(len(query), dtype=np.int64))
                second.append(first[-1])
                weights.append(np.zeros(len(query)))
                rates.append(np.zeros(len(query)))
                continue
            index = np.clip(np.searchsorted(centre, query[:, axis], side="right") - 1, 0, len(centre) - 2)
            step = centre[index + 1] - centre[index]
            first.append(index)
            second.append(index + 1)
            weights.append(np.clip((query[:, axis] - centre[index]) / step, 0, 1))
            rates.append(((query[:, axis] >= centre[0]) & (query[:, axis] <= centre[-1])) / step)
        distance = np.zeros(len(query))
        gradient = np.zeros_like(query)
        for corner in itertools.product((0, 1), repeat=3):
            values = self.distance[
                tuple(second[axis] if side else first[axis] for axis, side in enumerate(corner))
            ]
            shares = [weights[axis] if side else 1 - weights[axis] for axis, side in enumerate(corner)]
            distance += values * shares[0] * shares[1] * shares[2]
            for axis in range(3):
                others = [a for a in range(3) if a != axis]
                gradient[:, axis] += (
                    values * (2 * corner[axis] - 1) * rates[axis] * shares[others[0]] * shares[others[1]]
                )
        # 복셀 안의 양수 근사 거리는 0으로 제한하여 고체 내부 교란 방지
        cells = tuple(
            np.clip(np.searchsorted(edge, query[:, axis], side="right") - 1, 0, len(edge) - 2)
            for axis, edge in enumerate(self.edges)
        )
        clipped = ~self.valid[cells] & (distance > 0)
        distance[clipped], gradient[clipped] = 0.0, 0.0
        if self.floor is not None:
            floor_distance = query[:, 2] - self.floor
            below = floor_distance < distance
            distance[below] = floor_distance[below]
            gradient[below] = (0.0, 0.0, 1.0)
        return distance.reshape(shape), gradient.reshape((*shape, 3))
