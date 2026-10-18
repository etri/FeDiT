#!/usr/bin/env bash
set -Eeuo pipefail

# One visible-browser recording for the service menu and the state-changing
# lifecycle cases.  It is intentionally kept outside the product tree's
# tracked deliverable: it is evidence tooling, not an installer dependency.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${1:?usage: record_profile_browser_functional_lifecycle.sh OUTPUT_DIR}"
MODE="${FEDIT_TEST_MODE:-CPU}"
MODE_LOWER="$(tr '[:upper:]' '[:lower:]' <<<"${MODE}")"
CONTAINER_NAME="${FEDIT_RECORD_CONTAINER:?FEDIT_RECORD_CONTAINER is required}"
DISPLAY_ID="${FEDIT_VIDEO_DISPLAY:-:142}"
FIXTURE_IMAGE="${FEDIT_RECORD_FIXTURE_IMAGE:-127.0.0.1:5000/prediction-manager-app:verification}"
if [[ "$MODE_LOWER" == "cpu" && -z "${FEDIT_RECORD_FIXTURE_IMAGE:-}" ]]; then
  FIXTURE_IMAGE="127.0.0.1:5000/prediction-manager-app:verification-cpu"
fi
VIDEO_FILE="${OUTPUT_DIR}/${MODE}_browser_full_service_lifecycle.mp4"
CASE_FAILURES=0
CASE_RESULTS=()

mkdir -p "$OUTPUT_DIR"

cleanup() {
  local rc=$?
  set +e
  [[ -n "${FFMPEG_PID:-}" ]] && kill "$FFMPEG_PID" 2>/dev/null
  [[ -n "${XVFB_PID:-}" ]] && kill "$XVFB_PID" 2>/dev/null
  [[ -n "${FIXTURE_APPLIED:-}" ]] && docker exec "$CONTAINER_NAME" bash -lc \
    'sudo -u ubuntu KUBECONFIG=/home/ubuntu/.kube/config kubectl -n kubeflow-user-example-com delete -f /tmp/ui_lifecycle_fixture.yaml --ignore-not-found' \
    >/dev/null 2>&1
  wait "${FFMPEG_PID:-}" "${XVFB_PID:-}" 2>/dev/null
  exit "$rc"
}
trap cleanup EXIT INT TERM

prepare_fixture() {
  docker cp "$SCRIPT_DIR/fixtures/ui_lifecycle_fixture.yaml" "$CONTAINER_NAME:/tmp/ui_lifecycle_fixture.yaml"
  docker exec "$CONTAINER_NAME" bash -lc "
    chown ubuntu:ubuntu /tmp/ui_lifecycle_fixture.yaml
    sudo -u ubuntu KUBECONFIG=/home/ubuntu/.kube/config kubectl apply -f /tmp/ui_lifecycle_fixture.yaml
    sudo -u ubuntu KUBECONFIG=/home/ubuntu/.kube/config kubectl -n kubeflow-user-example-com set image deployment/ui-lifecycle-fixture ui-lifecycle-fixture=${FIXTURE_IMAGE}
    sudo -u ubuntu KUBECONFIG=/home/ubuntu/.kube/config kubectl -n kubeflow-user-example-com rollout status deployment/ui-lifecycle-fixture --timeout=180s
  "
  FIXTURE_APPLIED=1
}

run_case() {
  local case_name="$1"
  shift
  local rc
  # This is a defect-discovery round, not a fail-fast smoke test.  Keep
  # traversing independent services after a failed case, preserve each
  # case's own manifest/screenshots, and make the aggregate result fail only
  # after every planned UI lifecycle has been attempted.
  set +e
  "$@"
  rc=$?
  set -e
  CASE_RESULTS+=("${case_name}:${rc}")
  if ((rc == 0)); then
    printf '[PASS] browser case: %s\n' "$case_name"
  else
    CASE_FAILURES=1
    printf '[FAIL] browser case: %s (rc=%s); continuing defect collection\n' "$case_name" "$rc" >&2
  fi
  return 0
}

run_browser_case() {
  local program="$1"
  shift
  run_case "$program" env \
    DISPLAY="$DISPLAY_ID" \
    FEDIT_TEST_MODE="$MODE" \
    FEDIT_BROWSER_BASE="http://127.0.0.1:18000" \
    FEDIT_FIREFOX_BINARY="/home/user/.cache/fedit-browser/firefox-portable/firefox" \
    FEDIT_GECKODRIVER="/home/user/.cache/fedit-browser/geckodriver-0.37.1/geckodriver" \
    /home/user/.cache/fedit-browser-venv/bin/python "$SCRIPT_DIR/$program" "$OUTPUT_DIR" "$@"
}

Xvfb "$DISPLAY_ID" -screen 0 1440x900x24 -nolisten tcp >"$OUTPUT_DIR/xvfb-browser-functional.log" 2>&1 &
XVFB_PID=$!
sleep 1
DISPLAY="$DISPLAY_ID" ffmpeg -y -f x11grab -video_size 1440x900 -framerate 10 \
  -i "$DISPLAY_ID" -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p \
  -movflags +faststart "$VIDEO_FILE" >"$OUTPUT_DIR/ffmpeg-browser-functional.log" 2>&1 &
FFMPEG_PID=$!
sleep 1

prepare_fixture
run_browser_case run_fedit_main_menu_traversal.py
run_browser_case run_pm_dataset_ui_lifecycle.py
run_browser_case run_data_collection_ui_lifecycle.py
run_case run_cpu_label_studio_crud.py env \
  DISPLAY="$DISPLAY_ID" FEDIT_TEST_MODE="$MODE" FEDIT_BROWSER_BASE="http://127.0.0.1" \
  FEDIT_FIREFOX_BINARY="/home/user/.cache/fedit-browser/firefox-portable/firefox" \
  FEDIT_GECKODRIVER="/home/user/.cache/fedit-browser/geckodriver-0.37.1/geckodriver" \
  /home/user/.cache/fedit-browser-venv/bin/python "$SCRIPT_DIR/run_cpu_label_studio_crud.py" "$OUTPUT_DIR"
run_browser_case run_dataset_pipeline_ui_probe.py
run_browser_case run_automl_ui_lifecycle.py
run_browser_case run_cpu_browser_traversal.py

sleep 2
kill "$FFMPEG_PID"
wait "$FFMPEG_PID" || true
unset FFMPEG_PID
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$VIDEO_FILE"
printf '%s\n' "${CASE_RESULTS[@]}" > "${OUTPUT_DIR}/${MODE}_browser_case_results.txt"
if ((CASE_FAILURES)); then
  echo "[FAIL] Browser lifecycle collection completed with failed cases; see per-case manifests." >&2
  exit 1
fi
