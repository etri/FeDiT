# syntax=docker/dockerfile:1.7
FROM ghcr.io/astral-sh/uv:0.8.22 AS uv
FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04

ARG DEBIAN_FRONTEND=noninteractive
ARG HOST_UID=1000
ARG HOST_GID=1000
ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_PYTHON_INSTALL_DIR=/opt/python \
    UV_LINK_MODE=copy \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VTK_DEFAULT_OPENGL_WINDOW=vtkEGLRenderWindow \
    PATH=/opt/venv/bin:${PATH}

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates curl gnupg libgl1 libegl1 libopengl0 libosmesa6 libxrender1 libxt6 libglib2.0-0 tini \
    && curl -fsSL https://dl.openfoam.com/add-debian-repo.sh -o /tmp/openfoam-repo.sh \
    && bash /tmp/openfoam-repo.sh \
    && apt-get update && apt-get install -y --no-install-recommends openfoam2606-default \
    && bash -c 'source /usr/lib/openfoam/openfoam2606/etc/bashrc && command -v simpleFoam && command -v mpirun' \
    && rm -rf /var/lib/apt/lists/* /tmp/openfoam-repo.sh

COPY --from=uv /uv /uvx /usr/local/bin/
WORKDIR /opt/trainer
COPY pyproject.toml ./
RUN --mount=type=bind,source=.,target=/build-context \
    --mount=type=cache,target=/root/.cache/uv \
    uv python install 3.12 \
    && if [ -s /build-context/uv.lock ]; then \
        cp /build-context/uv.lock ./uv.lock && uv lock --check --python 3.12; \
       else uv lock --python 3.12; fi \
    && uv sync --frozen --no-install-project --group notebooks \
    && chmod -R a+rX /opt/python /opt/venv /opt/trainer \
    && groupadd --gid ${HOST_GID} flowcast \
    && useradd --uid ${HOST_UID} --gid ${HOST_GID} --create-home --shell /bin/bash flowcast

RUN apt-get update && apt-get install -y --no-install-recommends fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

USER flowcast
WORKDIR /workspace
CMD ["sleep", "infinity"]
