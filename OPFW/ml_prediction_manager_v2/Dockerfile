FROM python:3.12-slim

ARG INSTALL_PROFILE=gpu

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl libgomp1 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements-cpu.txt ./
RUN if [ "$INSTALL_PROFILE" = "cpu" ]; then \
      pip install --no-cache-dir -r requirements-cpu.txt; \
    else \
      pip install --no-cache-dir -r requirements.txt; \
    fi

COPY app/ app/
COPY static/ static/
COPY examples/ examples/
# A previous cached COPY layer can still contain macOS AppleDouble sidecars
# from an earlier overlay copy.  Remove them inside the image as a second
# line of defence; `.dockerignore` prevents newly supplied sidecars as well.
RUN find app static examples -type f -name '._*' -delete

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--root-path", "/prediction-manager"]
