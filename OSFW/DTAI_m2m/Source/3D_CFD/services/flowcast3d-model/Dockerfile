FROM ghcr.io/astral-sh/uv:0.8.22 AS uv
FROM nvcr.io/nvidia/tritonserver:24.05-py3

ARG HOST_UID=1000
ARG HOST_GID=1000

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLOWCAST_MODEL_VERSION=/opt/model/model_repository/flowcast3d/1 \
    FLOWCAST_DEVICE=cuda \
    PYTHONPATH=/opt/model \
    OMP_NUM_THREADS=1

COPY --from=uv /uv /uvx /usr/local/bin/
WORKDIR /opt/model
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv lock --check \
    && uv export --frozen --group dev --no-emit-project --format requirements.txt --output-file /tmp/flowcast3d-model-requirements.txt \
    && uv pip install --system --break-system-packages --require-hashes --torch-backend cu124 -r /tmp/flowcast3d-model-requirements.txt \
    && rm /tmp/flowcast3d-model-requirements.txt \
    && python3 -c "import sys, torch, numpy, yaml; assert sys.version_info[:2] == (3, 10); assert torch.__version__.split('+')[0] == '2.6.0'; assert torch.version.cuda == '12.4'" \
    && if ! getent group "${HOST_GID}" >/dev/null; then groupadd --gid "${HOST_GID}" flowcast; fi \
    && if ! getent passwd "${HOST_UID}" >/dev/null; then useradd --uid "${HOST_UID}" --gid "${HOST_GID}" --create-home flowcast; fi
COPY modules ./modules
COPY --chown=${HOST_UID}:${HOST_GID} model_repository ./model_repository
USER ${HOST_UID}:${HOST_GID}
RUN test -s model_repository/flowcast3d/1/model.pt \
    && test -r model_repository/flowcast3d/1/model.pt

EXPOSE 8000 8001 8002
CMD ["tritonserver", "--model-repository=/opt/model/model_repository", "--strict-model-config=true", "--disable-auto-complete-config", "--model-control-mode=explicit", "--load-model=flowcast3d_pipeline"]
