#!/opt/pm-python/bin/python
import json
import platform

import joblib
import numpy
import onnxruntime
import pandas
import sklearn


print(
    json.dumps(
        {
            "python": platform.python_version(),
            "numpy": numpy.__version__,
            "pandas": pandas.__version__,
            "scikit_learn": sklearn.__version__,
            "joblib": joblib.__version__,
            "onnxruntime": onnxruntime.__version__,
        },
        ensure_ascii=True,
        sort_keys=True,
    )
)
