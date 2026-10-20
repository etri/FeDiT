FROM ghcr.io/astral-sh/uv:0.8.22 AS uv
FROM python:3.12-slim-trixie

ARG HOST_UID=1000
ARG HOST_GID=1000
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 OMP_NUM_THREADS=1
ENV PYTHONPATH=/opt/api
ENV PYVISTA_OFF_SCREEN=true \
    LIBGL_ALWAYS_SOFTWARE=1 \
    VTK_DEFAULT_OPENGL_WINDOW=vtkOSOpenGLRenderWindow \
    LP_NUM_THREADS=2
ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    PATH=/opt/venv/bin:${PATH}
WORKDIR /opt/api
RUN apt-get update \
    && apt-get install -y --no-install-recommends libosmesa6 libegl1 libgl1 libgles2 libopengl0 libxrender1 libxext6 libsm6 fonts-nanum \
    && rm -rf /var/lib/apt/lists/*
COPY --from=uv /uv /uvx /usr/local/bin/
COPY services/flowcast3d-api/pyproject.toml services/flowcast3d-api/uv.lock /opt/api/
RUN uv lock --check --python /usr/local/bin/python3 \
    && uv sync --frozen --no-install-project --no-dev --python /usr/local/bin/python3 \
    && /opt/venv/bin/python -c "import torch; assert torch.__version__.split('+')[0] == '2.6.0'; assert torch.version.cuda is None" \
    && groupadd -g "$HOST_GID" flowcast && useradd -u "$HOST_UID" -g flowcast -m flowcast \
    && mkdir -p /var/lib/flowcast3d-api/workspace \
    && chown -R flowcast:flowcast /var/lib/flowcast3d-api

# Viewer 캐시 볼륨의 초기 소유권 설정
RUN mkdir -p /tmp/flowcast-viewer-assets \
    && chown flowcast:flowcast /tmp/flowcast-viewer-assets

COPY services/flowcast3d-api/main.py /opt/api/main.py
COPY services/flowcast3d-api/modules /opt/api/modules
COPY LICENSE NOTICE /opt/api/
USER flowcast
EXPOSE 8080 8082
CMD ["python", "main.py"]
