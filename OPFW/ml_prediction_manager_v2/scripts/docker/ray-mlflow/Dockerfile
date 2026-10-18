ARG RAY_BASE_IMAGE=rayproject/ray:2.54.1-py312
ARG XGBOOST_PACKAGE=xgboost
FROM ${RAY_BASE_IMAGE}

ARG XGBOOST_PACKAGE
ARG INSTALL_GPU_ML=true

USER root

RUN if [ "$INSTALL_GPU_ML" = "true" ]; then xgb_spec="xgboost==2.1.4"; \
    else xgb_spec="${XGBOOST_PACKAGE}>=2.0"; fi && \
    python -m pip install --no-cache-dir \
      "ray[tune]==2.54.1" \
      "mlflow==3.11.1" \
      "optuna>=4.0,<5" \
      "scikit-learn>=1.7,<1.8" \
      "$xgb_spec" \
      "lightgbm>=4.0" \
      "pandas>=2.2,<3" \
      "pyarrow>=15.0" \
      "psycopg[binary]>=3.1"

# Keep CUDA user libraries compatible with the measured 535/537 host drivers.
# A GPU-enabled Ray scheduler alone does not install TabNet or a CUDA PyTorch.
RUN if [ "$INSTALL_GPU_ML" = "true" ]; then \
      python -m pip install --no-cache-dir "torch==2.7.1+cu118" \
        --index-url https://download.pytorch.org/whl/cu118 && \
      python -m pip install --no-cache-dir "pytorch-tabnet==4.1.0" "xgboost==2.1.4"; \
    fi

USER ray
