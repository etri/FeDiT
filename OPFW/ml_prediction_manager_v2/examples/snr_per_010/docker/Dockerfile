FROM python:3.11-slim-bookworm
ENV PYTHONUNBUFFERED=1 OMP_NUM_THREADS=2 MKL_NUM_THREADS=2
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/snr-per-010
COPY requirements.txt .
RUN python -m pip install --no-cache-dir numpy==2.4.4 Cython==3.2.4 setuptools wheel && python -m pip install --no-cache-dir -r requirements.txt && python -m pip install --no-cache-dir --force-reinstall --no-deps --no-build-isolation --no-binary=cython_bbox cython_bbox==0.1.5 && python -m pip install --no-cache-dir --force-reinstall --no-deps lap==0.5.13
COPY . .
RUN python -m ipykernel install --prefix=/usr/local --name snr-per-010-image --display-name "SNR-PER-010 (CUDA)"
EXPOSE 8888
CMD ["jupyter", "lab", "--ip=0.0.0.0", "--port=8888", "--no-browser", "--allow-root"]
