FROM pman-gpu-validation:20261015

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /home/jovyan

# Kubeflow Notebook compatibility
RUN useradd -m -s /bin/bash -N -u 1000 -g 100 jovyan || true

RUN pip install --no-cache-dir "transformers==4.51.3" "huggingface-hub==0.30.2" "safetensors==0.5.3" "psutil>=5.9" "websocket-client>=1.8"

RUN pip install --no-cache-dir jupyterlab>=4.0 notebook ipykernel

RUN python -m pip install --no-cache-dir torchvision==0.22.1+cu118 --index-url https://download.pytorch.org/whl/cu118

RUN chown -R 1000:100 /home/jovyan
USER 1000
EXPOSE 8888
CMD ["/bin/sh", "-c", "jupyter lab --ip=0.0.0.0 --no-browser --port=8888 --ServerApp.token='' --ServerApp.password='' --ServerApp.allow_origin='*' --ServerApp.base_url=${NB_PREFIX:-/}"]
