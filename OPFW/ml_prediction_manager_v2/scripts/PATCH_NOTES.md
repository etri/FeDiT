# Prediction Manager verification installer corrections

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

The original input archive is preserved beside the corrected archive as
`script.original.zip`.
