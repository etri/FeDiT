import runpy
import sys

import torch

torch.backends.cuda.matmul.allow_tf32 = False
torch.backends.cudnn.allow_tf32 = False
torch.set_float32_matmul_precision('highest')
torch.set_num_threads(2)
sys.argv = sys.argv[1:]
runpy.run_path(sys.argv[0], run_name='__main__')
