import math

import torch

PERIODIC = 2


def hat_integral(u):
    # 단위 삼각 함수의 누적 적분
    u = u.clamp(-1, 1)
    return torch.where(u <= 0, (u + 1) ** 2 / 2, 1 - (1 - u) ** 2 / 2)


def taps(n_in, n_out, periodic):
    """입력 셀 번호(int64)와 가중치(float32)를 각각 [n_out, K]로 반환"""
    ratio = n_in / n_out
    # 셀 중심이 정수인 입력 좌표로 출력 구간 변환
    lower = torch.arange(n_out, dtype=torch.float64) * ratio - 0.5
    upper = lower + ratio
    index = torch.floor(lower).to(torch.int64)[:, None] + torch.arange(math.ceil(ratio) + 2)[None, :]
    position = index.to(torch.float64)
    weight = (hat_integral(upper[:, None] - position) - hat_integral(lower[:, None] - position)) / ratio
    index = index % n_in if periodic else index.clamp(0, n_in - 1)
    return index, weight.to(torch.float32)


def resample_axis(x, dim, n_out, periodic):
    n_in = x.shape[dim]
    if n_in == n_out:
        return x
    index, weight = taps(n_in, n_out, periodic)
    index, weight = index.to(x.device), weight.to(x.device, x.dtype)
    shape = [1] * x.dim()
    shape[dim] = n_out
    out = None
    for k in range(index.shape[1]):
        term = x.index_select(dim, index[:, k]) * weight[:, k].reshape(shape)
        out = term if out is None else out.add_(term)
    return out


def resample(x, size, bcs, dims=(-3, -2, -1)):
    for dim, n_out, bc in zip(dims, size, bcs):
        x = resample_axis(x, dim, n_out, periodic=bc[0] == PERIODIC and bc[1] == PERIODIC)
    return x
