FROM apache/nifi:1.28.1

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        libgomp1 \
        python3 \
        python3-venv \
    && python3 -m venv /opt/pm-python \
    && /opt/pm-python/bin/pip install --no-cache-dir --upgrade pip setuptools wheel \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /tmp/pm-nifi-python-requirements.txt
RUN /opt/pm-python/bin/pip install --no-cache-dir \
        -r /tmp/pm-nifi-python-requirements.txt \
    && rm -f /tmp/pm-nifi-python-requirements.txt

COPY --chown=nifi:nifi scripts/ /opt/pm/scripts/

RUN install -d -o nifi -g nifi -m 0775 /opt/pm/models \
    && chmod 0755 /opt/pm/scripts/*.py

ENV PATH="/opt/pm-python/bin:${PATH}" \
    PM_NIFI_PYTHON="/opt/pm-python/bin/python" \
    PM_NIFI_SCRIPT_ROOT="/opt/pm/scripts" \
    PM_NIFI_MODEL_ROOT="/opt/pm/models"

USER nifi
