# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2022-2026 E8IGHT Co., Ltd.
#
# FeDiT 해석엔진 이미지: Python Main API + 실행 파일 2개(NFLOW_LBM, NFLOW_LBM_DEM).
# 실행 파일은 release/linux/ 의 압축 묶음을 그대로 풀어 넣는다(이미지 안에서 빌드하지 않음).
#
# 빌드 (modeling_simulation_engines 폴더에서):
#   docker build -f integration/Dockerfile -t fedit-engine .
# 실행: integration/docker-compose.yml 참고 (GPU, 공유 폴더 /jobs, JIT 캐시 /nvcache)
FROM nvidia/cuda:12.1.1-runtime-ubuntu22.04

# libgomp1: 해석기가 OpenMP를 쓴다. python3: Python Main API (Ubuntu 22.04는 3.10)
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 python3 python3-pip \
 && rm -rf /var/lib/apt/lists/*

COPY integration/api/requirements.txt /opt/engine/api/requirements.txt
RUN pip3 install --no-cache-dir -r /opt/engine/api/requirements.txt

# ADD는 로컬 .tar.xz를 풀어서 넣는다 → /opt/engine/lbm, /opt/engine/lbm_dem
ADD release/linux/NFLOW_LBM_linux_x64.tar.xz /opt/engine/
ADD release/linux/NFLOW_LBM_DEM_linux_x64.tar.xz /opt/engine/
COPY release/linux/BUILD_INFO.txt /opt/engine/BUILD_INFO.txt
COPY integration/api/engine_api /opt/engine/api/engine_api

# 실행 파일은 같은 묶음의 lib/를 RUNPATH($ORIGIN)로 찾으므로 LD_LIBRARY_PATH를 따로 두지 않는다.
# 묶음 안의 LICENSE.md, THIRD_PARTY_NOTICES.md, BUILD_INFO.txt도 /opt/engine/lbm, /opt/engine/lbm_dem에 함께 풀린다.
ENV PATH=/opt/engine/lbm/bin:/opt/engine/lbm_dem/bin:${PATH}
# JIT 캐시: 빌드 대상 밖 GPU에서 드라이버가 컴파일한 코드를 둔다. 컨테이너 밖 폴더를 /nvcache에 붙여야 실행마다 다시 컴파일하지 않는다.
ENV JOBS_ROOT=/jobs CUDA_CACHE_PATH=/nvcache CUDA_CACHE_MAXSIZE=4294967296

WORKDIR /opt/engine/api
EXPOSE 8000
# GET /health가 200이 아니면(GPU가 안 보이는 등) unhealthy로 표시된다
HEALTHCHECK --interval=60s --timeout=15s --start-period=20s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=10)"
CMD ["python3", "-m", "uvicorn", "engine_api.app:app", "--host", "0.0.0.0", "--port", "8000"]
