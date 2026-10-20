# 0인 채널의 0/0을 막는 통계 하한
EPSILON = 1e-5


def _rms(x):
    return x.double().square().mean(dim=(0, 1, 2, 3)).sqrt().float().clamp(min=EPSILON)


def state_scale(history):
    return _rms(history)


def delta_scale(history):
    """[T, X, Y, Z, C] 이력의 스텝 간 변화량 RMS [C] 반환"""
    if history.shape[0] < 2:
        raise ValueError("at least 2 frames are needed to measure the step size")
    return _rms(history[1:] - history[:-1])
