ARG RAY_BASE_IMAGE=rayproject/ray:2.54.1-py312-gpu
FROM ${RAY_BASE_IMAGE}

USER root

RUN python -m pip install --no-cache-dir \
      "mlflow==3.11.1" \
      "optuna>=4.0,<5" \
      "scikit-learn>=1.7,<1.8" \
      "xgboost>=2.0" \
      "lightgbm>=4.0" \
      "pandas>=2.2" \
      "pyarrow>=15.0" \
      "psycopg[binary]>=3.1"

USER ray
