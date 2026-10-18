# Prediction Manager verification installer corrections

## A40 server installation and lifecycle scripts (2026-10-17)

- Added [server-a40/README.md](server-a40/README.md) with the unchanged,
  SHA-256-verified installer used for the successful target A40 deployment.
- Added a single install/resume entry point for the known Keycloak HTTPS
  rejection, local forwarding with Pod replacement recovery and bounded shutdown,
  and standalone service start/stop scripts.
- Recorded target-server installation/GPU smoke evidence separately from local
  checks of the subsequent orchestration and shutdown corrections.

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

- Fixed the real-host `01` failure with exit 141: the Kubernetes package
  version lookup now consumes the complete `apt-cache madison` stream and no
  longer trips strict `pipefail` through SIGPIPE.
- Added the CPU single-node resource profile. It never rejects a host because
  of detected memory and keeps monitoring, Label Studio, default-tenant
  services, and the feature menus enabled with compact requests and
  profile-specific limits.
- Fixed shell-safe serialization of a CPU host's `Unknown GPU` model value.
- Fixed containerd 1.x/2.x registry host configuration so Kubernetes pulls
  project images from the local HTTP Registry instead of attempting HTTPS.
- Changed generated project/Kubeflow image policies to reuse successful image
  downloads and added bounded retries for Registry pulls, builds, and pushes.
- The post-install entry checker now selects `/etc/kubernetes/admin.conf`
  explicitly when the entry script is run with `sudo`.

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
- Bare-metal Ubuntu no longer skips access setup: MLflow, NiFi, Ray, Label
  Studio, Prometheus and FeDiT use only TCP 15000-15003, 18000 and 19090.
  Prediction Manager and Kubeflow web-app upstreams bind only to loopback and
  the Docker bridge behind the FeDiT reverse proxy.
- FeDiT is the sole public entry on TCP 18000. Prediction Manager is available
  at `/prediction-manager/`; Kubeflow feature pages are reverse-proxied below
  the same origin. The former public TCP 18080 entry is not used.
- The local image Registry is bound to `127.0.0.1:5000`, and kube-proxy limits
  bootstrap-only NodePorts 30080/30081 to `127.0.0.0/8`. Neither is exposed
  through the host network interface.
- Bare-metal port forwards run as the enabled
  `prediction-manager-access.service` systemd unit and survive reboots.
- Active UFW or firewalld installations receive the documented verification
  TCP ports automatically; container mode leaves the outer host firewall to
  the Docker host administrator.
- The installer waits for every enabled access port before it reports success,
  and `02-start-prediction-manager.sh` prints localhost and detected-host URLs.

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
- Keeps loopback Registry image references for node-level containerd pulls;
  all dynamic workload image pulls are performed by that same single-node
  kubelet and therefore require no external Registry port.
- Replaces the dashboard's RTX 3090 fallback with live DCGM/Prometheus facts,
  reporting the installed RTX A6000 model, driver, VRAM and physical count
  without installing NVIDIA utilities or a driver in the target image.
- Auto-detects GPU count/model/VRAM/driver from `nvidia-smi`, derives per-GPU
  time-slicing from the smallest VRAM and a configurable target, and sets the
  default Ray GPU worker ceiling from the physical GPU count. No GPU model or
  device count is hard-coded.

The original input archive is preserved beside the corrected archive as
`script.original.zip`.
