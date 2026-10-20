"""유동장 격자의 위치와 해상도 비교"""

import numpy as np


def same_grid(a, b):
    return (
        a.shape == b.shape
        and np.allclose(a.spacing, b.spacing, rtol=1e-9, atol=0.0)
        and np.allclose(a.origin, b.origin, rtol=0.0, atol=1e-6 * min(a.spacing))
    )
