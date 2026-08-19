#!/usr/bin/env bash
set -Eeuo pipefail

# This script is deliberately executed inside a visible host terminal by
# record_cpu_clean_install.sh.  Its complete stdout/stderr is both on-screen
# and captured as a timestamped transcript; no credential is printed or used.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
INSTALL_PROFILE="${FEDIT_RECORD_PROFILE:-cpu}"
case "${INSTALL_PROFILE}" in
  cpu)
    PREREQUISITE_INSTALLER="01-install-required-modules-cpu.sh"
    SERVICE_INSTALLER="02-start-prediction-manager-cpu.sh"
    RECORDING_COMPOSE="docker-compose.cpu-recording.yml"
    RECORDING_VOLUME_PREFIX="cpu"
    ;;
  gpu)
    PREREQUISITE_INSTALLER="01-install-required-modules.sh"
    SERVICE_INSTALLER="02-start-prediction-manager.sh"
    RECORDING_COMPOSE="docker-compose.gpu-recording.yml"
    RECORDING_VOLUME_PREFIX="gpu"
    ;;
  *)
    echo "FEDIT_RECORD_PROFILE must be cpu or gpu (received: ${INSTALL_PROFILE})" >&2
    exit 2
    ;;
esac
INSTALL_MODE="${INSTALL_PROFILE^^}"
LAB_DIR="${FEDIT_LAB_DIR:-/home/user/fedit_clean_ubuntu22_v8}"
OUTPUT_DIR="${1:?usage: run_cpu_clean_install_recording.sh OUTPUT_DIR}"
CONTAINER_NAME="${FEDIT_RECORD_CONTAINER:-fedit-clean-ubuntu22-recording-${INSTALL_PROFILE}}"
PROJECT_NAME="${FEDIT_RECORD_PROJECT:-fedit_recording_${INSTALL_PROFILE}}"
BACKEND_DIR="${FEDIT_RECORD_BACKEND_DIR:-${PROJECT_ROOT}}"
FRONTEND_DIR="${FEDIT_RECORD_FRONTEND_DIR:-${PROJECT_ROOT}_frontend}"

[[ -d "${LAB_DIR}" ]] || { echo "Lab directory not found: ${LAB_DIR}" >&2; exit 1; }
[[ -d "${BACKEND_DIR}" && -d "${FRONTEND_DIR}" ]] \
  || { echo "FeDiT backend/frontend source directory not found" >&2; exit 1; }
[[ ! -e /var/run/docker.sock ]] || docker info >/dev/null

mkdir -p "${OUTPUT_DIR}/runtime" "${OUTPUT_DIR}/functional"

# kubeadm prints a short-lived join token and CA discovery hash during a clean
# control-plane initialization.  They are not needed to verify this one-node
# installation and must never enter the deliverable terminal video or its
# companion transcript.  Preserve command exit status through pipefail.
redact_stream() {
  sed -E \
    -e 's/(--token[ =])[[:alnum:]._-]+/\1[REDACTED]/g' \
    -e 's/(token:[[:space:]]*)[[:alnum:]._-]+/\1[REDACTED]/g' \
    -e 's/(sha256:)[[:xdigit:]]+/\1[REDACTED]/g'
}

run_redacted() {
  "$@" 2>&1 | redact_stream
}

section() {
  printf '\n\n================================================================\n'
  printf ' %s\n' "$1"
  printf '================================================================\n'
}

wait_outer_health() {
  local state
  for _ in $(seq 1 90); do
    state="$(docker inspect -f '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' "${CONTAINER_NAME}" 2>/dev/null || true)"
    printf '[outer-health] %s\n' "${state}"
    [[ "${state}" == 'running healthy' ]] && return 0
    sleep 5
  done
  echo "outer container did not become healthy" >&2
  return 1
}

wait_recovery() {
  local pm fedit bad unready
  for _ in $(seq 1 120); do
    pm="$(docker exec "${CONTAINER_NAME}" curl -fsS --max-time 3 http://127.0.0.1:18100/healthz 2>/dev/null || true)"
    fedit="$(docker exec "${CONTAINER_NAME}" curl -sS -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:18000/fedit/predictor-creator-tool 2>/dev/null || true)"
    # `kubectl get pods` renders a successfully finished Job Pod as
    # "Completed" (whereas the API phase is "Succeeded").  Tenant
    # provisioning deliberately leaves such a completed Job behind, so it
    # must be accepted during restart recovery rather than waiting until the
    # recovery timeout expires.
    bad="$(docker exec "${CONTAINER_NAME}" bash -lc 'kubectl get pods -A --no-headers 2>/dev/null | awk '\''$4!="Running" && $4!="Succeeded" && $4!="Completed"{n++} END{print n+0}'\''' 2>/dev/null || true)"
    unready="$(docker exec "${CONTAINER_NAME}" bash -lc 'kubectl get pods -A --no-headers 2>/dev/null | awk '\''$4=="Running" && ($3=="0/1" || $3=="1/2" || $3=="0/2" || $3=="1/3" || $3=="2/3" || $3=="0/3"){n++} END{print n+0}'\''' 2>/dev/null || true)"
    printf '[recovery] pm=%s fedit=%s bad=%s unready=%s\n' "${pm}" "${fedit}" "${bad}" "${unready}"
    [[ -n "${pm}" && "${fedit}" == '200' && "${bad}" == '0' && "${unready}" == '0' ]] && return 0
    sleep 5
  done
  echo "post-restart services did not recover" >&2
  return 1
}

section "00. Start a new clean ${INSTALL_MODE} Docker/containerd volume"
if docker inspect fedit-clean-ubuntu22 >/dev/null 2>&1; then
  echo 'Stopping the preserved prior CPU validation container to free approved public ports.'
  docker stop -t 30 fedit-clean-ubuntu22
fi
if docker inspect "${CONTAINER_NAME}" >/dev/null 2>&1; then
  echo "Recording container already exists: ${CONTAINER_NAME}" >&2
  echo 'Refusing to reuse an existing container because this run requires a clean volume.' >&2
  exit 1
fi
if docker volume inspect "${PROJECT_NAME}_recording-${RECORDING_VOLUME_PREFIX}-docker-data" >/dev/null 2>&1 \
  || docker volume inspect "${PROJECT_NAME}_recording-${RECORDING_VOLUME_PREFIX}-containerd-data" >/dev/null 2>&1; then
  echo 'A recording volume already exists; refusing to reuse it for a clean install.' >&2
  exit 1
fi
compose_files=(
  -f "${LAB_DIR}/docker-compose.yml"
  -f "${LAB_DIR}/${RECORDING_COMPOSE}"
)
if [[ "${INSTALL_PROFILE}" == "gpu" ]]; then
  compose_files+=( -f "${LAB_DIR}/docker-compose.gpu.yml" )
fi
INSTALL_PROFILE="${INSTALL_PROFILE}" FEDIT_RECORD_CONTAINER="${CONTAINER_NAME}" \
  docker compose -p "${PROJECT_NAME}" "${compose_files[@]}" up -d --build
wait_outer_health

section "01. Inject the tested ${INSTALL_MODE} source for the regular ubuntu user"
git -C "${BACKEND_DIR}" rev-parse --is-inside-work-tree >/dev/null
git -C "${BACKEND_DIR}" diff --quiet
[[ -z "$(git -C "${BACKEND_DIR}" status --porcelain)" ]] \
  || { echo 'The recorded source clone is not clean.' >&2; exit 1; }
printf '[source-commit] %s\n' "$(git -C "${BACKEND_DIR}" rev-parse HEAD)"
docker exec "${CONTAINER_NAME}" bash -lc 'install -d -m 0755 /home/ubuntu/FeDiT/OPFW'
docker cp "${BACKEND_DIR}" "${CONTAINER_NAME}:/home/ubuntu/FeDiT/OPFW/ml_prediction_manager_v2"
docker cp "${FRONTEND_DIR}" "${CONTAINER_NAME}:/home/ubuntu/FeDiT/OPFW/ml_prediction_manager_v2_frontend"
docker exec "${CONTAINER_NAME}" chown -R ubuntu:ubuntu /home/ubuntu/FeDiT
run_redacted docker exec "${CONTAINER_NAME}" runuser -u ubuntu -- env \
  PREREQUISITE_INSTALLER="${PREREQUISITE_INSTALLER}" \
  SERVICE_INSTALLER="${SERVICE_INSTALLER}" bash -lc '
  cd /home/ubuntu/FeDiT/OPFW/ml_prediction_manager_v2
  find scripts -type f -name "*.sh" -exec chmod +x {} +
  test -x "scripts/${PREREQUISITE_INSTALLER}"
  test -x "scripts/${SERVICE_INSTALLER}"
  echo "[PASS] regular-user source ownership and executable installer scripts"
'

section "02. Clean ${INSTALL_MODE} prerequisite installation as ubuntu using sudo"
run_redacted docker exec "${CONTAINER_NAME}" runuser -u ubuntu -- env \
  PREREQUISITE_INSTALLER="${PREREQUISITE_INSTALLER}" bash -lc '
  cd /home/ubuntu/FeDiT/OPFW/ml_prediction_manager_v2/scripts
  sudo -n "./${PREREQUISITE_INSTALLER}"
'

section "03. Clean ${INSTALL_MODE} service installation/start as ubuntu using sudo"
run_redacted docker exec "${CONTAINER_NAME}" runuser -u ubuntu -- env \
  SERVICE_INSTALLER="${SERVICE_INSTALLER}" bash -lc '
  cd /home/ubuntu/FeDiT/OPFW/ml_prediction_manager_v2/scripts
  sudo -n "./${SERVICE_INSTALLER}"
'

section "04. Full ${INSTALL_MODE} functional traversal: 14 real operations"
run_redacted docker exec "${CONTAINER_NAME}" runuser -u ubuntu -- env \
  FEDIT_VERIFY_PROFILE="${INSTALL_PROFILE}" bash -lc '
  cd /home/ubuntu/FeDiT/OPFW/ml_prediction_manager_v2
  sudo -n env VERIFY_PROFILE="${FEDIT_VERIFY_PROFILE}" TEST_ACTION_TIMEOUT_SECONDS=240 \
    "./scripts/scripts/verify-2.2.9-${FEDIT_VERIFY_PROFILE}.sh"
'

section "05. Restart recovery and full ${INSTALL_MODE} functional regression"
docker restart -t 30 "${CONTAINER_NAME}"
wait_outer_health
wait_recovery
run_redacted docker exec "${CONTAINER_NAME}" runuser -u ubuntu -- env \
  FEDIT_VERIFY_PROFILE="${INSTALL_PROFILE}" bash -lc '
  cd /home/ubuntu/FeDiT/OPFW/ml_prediction_manager_v2
  sudo -n env VERIFY_PROFILE="${FEDIT_VERIFY_PROFILE}" TEST_ACTION_TIMEOUT_SECONDS=240 \
    "./scripts/scripts/verify-2.2.9-${FEDIT_VERIFY_PROFILE}.sh"
'

section '06. Preserve reports and final service/port state'
docker exec "${CONTAINER_NAME}" bash -lc '
  echo "[health] $(curl -fsS --max-time 5 http://127.0.0.1:18100/healthz)"
  curl -sS -o /dev/null -w "[fedit] HTTP %{http_code}\\n" --max-time 5 http://127.0.0.1:18000/fedit/predictor-creator-tool
  kubectl get pods -A
  ss -ltn
'
docker port "${CONTAINER_NAME}"
# Do not copy raw installer logs: kubeadm can include one-time bootstrap
# credentials in those logs.  The redacted terminal transcript is the
# installation log evidence; only final, credential-free reports are kept.
while IFS= read -r report; do
  report_id="$(basename "$(dirname "${report}")")"
  mkdir -p "${OUTPUT_DIR}/runtime/${report_id}"
  docker cp "${CONTAINER_NAME}:${report}" "${OUTPUT_DIR}/runtime/${report_id}/verification-report.md"
done < <(docker exec "${CONTAINER_NAME}" bash -lc \
  "find /home/ubuntu/prediction-manager-work/.prediction-manager/${INSTALL_PROFILE}/results -name verification-report.md -type f -print")
while IFS= read -r report; do
  report_id="$(basename "$(dirname "${report}")")"
  mkdir -p "${OUTPUT_DIR}/functional/${report_id}"
  docker cp "${CONTAINER_NAME}:${report}" "${OUTPUT_DIR}/functional/${report_id}/$(basename "${report}")"
done < <(docker exec "${CONTAINER_NAME}" bash -lc \
  "find /home/ubuntu/prediction-manager-work/.prediction-manager/${INSTALL_PROFILE}/functional-2.2.9 -name \"verification-report-2.2.9-${INSTALL_PROFILE}.md\" -type f -print")
printf '\n[PASS] Clean %s reinstall + functional regression recording session finished.\n' "${INSTALL_MODE}"
