# Prediction Manager verification installer corrections

## Simplified entry scripts

- `01-install-required-modules.sh` installs the Ubuntu packages,
  Docker/containerd, Kubernetes tools, Helm/Kustomize, and NVIDIA Container
  Toolkit needed before service startup. It does not install or update a
  driver.
- `02-start-prediction-manager.sh` resumes the remaining platform deployment
  and ends with the lightweight `scripts/check-service-entry.sh` HTTP/readiness
  check.
- `scripts/verify-2.2.9-gpu.sh` is kept for the deferred full functional test.

## Portable installation correction

- `01-install-required-modules.sh` creates and normalizes the default
  `.verification-install.env` before installation.
- `NODE_IP`, container DNS, Label Studio public URL, backend source path, and
  frontend source path default to `auto`; values copied from another machine
  are removed in portable mode.
- `scripts/diagnose-install-entry.sh` prints the resolved configuration,
  source paths, current state-file decisions, and GPU detection before `sudo`.
- Initialization errors now include their line and exit code. A missing source
  path can no longer terminate silently in an early `readlink -f` call.
- A previous completed dependency stage is explicitly reported as `SKIP`,
  followed by the success report and log paths.
- The frontend Nginx upstream uses `host.docker.internal`, and browser-facing
  service URLs use the browser's current hostname rather than an installed
  machine's address.

This archive was corrected against `guide.txt` before installation.

- Accepts external Prediction Manager backend and frontend source roots.
- Builds the frontend with Node.js 18 and Docker Buildx.
- Pins the Kubeflow MinIO image to `RELEASE.2023-03-20T20-16-18Z`.
- Supports the documented low-resource Kubeflow state.
- Never installs an NVIDIA driver. The GPU profile reuses the driver already
  installed on the Docker host and installs only NVIDIA Container Toolkit,
  the Kubernetes device plugin, and DCGM Exporter.
- Uses the GPU Ray base image, validates nested Docker CUDA execution, exposes
  four time-sliced resources per physical GPU, and avoids unsupported DCGM
  profiling counters.
- Adds a Docker-in-Docker compatibility mode for the
  `fedit_clean_ubuntu22_v8` image, including containerd and kubelet process
  supervision without systemd.
- Uses the external FeDiT source tree for image builds and Kubernetes source
  manifests, while retaining the installer archive's verification overlays.
- Accepts oauth2-proxy's identifiable unauthenticated Kubeflow Sign In page
  when it is returned with HTTP 403, while rejecting arbitrary Istio 403s.
- Adds `--validate-only` to repeat final health checks without rebuilding and
  pushing every project image again.
- Normalizes FeDiT frontend build artifact permissions in its Docker image so
  the non-root Nginx worker can read files even when the installer uses umask
  `077` for generated credentials and reports.
- Keeps loopback Registry image references for node-level containerd pulls but
  gives Prediction Manager pods the reachable outer-container node address for
  Registry catalog and dashboard API calls.
- Replaces the dashboard's RTX 3090 fallback with live DCGM/Prometheus facts,
  reporting the installed RTX A6000 model, driver, VRAM and physical count
  without installing NVIDIA utilities or a driver in the target image.
- Auto-detects GPU count/model/VRAM/driver from `nvidia-smi`, derives per-GPU
  time-slicing from the smallest VRAM and a configurable target, and sets the
  default Ray GPU worker ceiling from the physical GPU count. No GPU model or
  device count is hard-coded.

The original input archive is preserved beside the corrected archive as
`script.original.zip`.
