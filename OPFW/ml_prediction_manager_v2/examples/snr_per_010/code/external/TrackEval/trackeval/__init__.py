import numpy as np

if not hasattr(np, "int"):
    np.int = int  

from .eval import Evaluator
from . import datasets
from . import metrics
from . import plotting
from . import utils
