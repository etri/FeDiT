#!/usr/bin/env bash
set -Eeuo pipefail

# Records only the final functional-verification segment after a test-name
# correction.  Clean-install recordings remain intact; this produces the
# authoritative replacement for the affected service-operation evidence.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

section() {
  printf '\n\n================================================================\n'
  printf ' %s\n' "$1"
  printf '================================================================\n'
}

run_session() {
  local profile="${FEDIT_RETEST_PROFILE:?FEDIT_RETEST_PROFILE is required}"
  local container="${FEDIT_RETEST_CONTAINER:?FEDIT_RETEST_CONTAINER is required}"
  local output_dir="${FEDIT_RETEST_OUTPUT:?FEDIT_RETEST_OUTPUT is required}"
  local source_dir='/home/ubuntu/FeDiT/OPFW/ml_prediction_manager_v2'
  local report_path

  section "00. Apply final functional-verification source (${profile^^})"
  docker cp "${PROJECT_ROOT}/scripts/scripts/verify-2.2.9-gpu.sh" \
    "${container}:${source_dir}/scripts/scripts/verify-2.2.9-gpu.sh"
  docker cp "${PROJECT_ROOT}/scripts/scripts/verify-2.2.9-cpu.sh" \
    "${container}:${source_dir}/scripts/scripts/verify-2.2.9-cpu.sh"
  docker exec "${container}" bash -lc \
    "chown ubuntu:ubuntu '${source_dir}/scripts/scripts/verify-2.2.9-gpu.sh' '${source_dir}/scripts/scripts/verify-2.2.9-cpu.sh' && chmod 0755 '${source_dir}/scripts/scripts/verify-2.2.9-gpu.sh' '${source_dir}/scripts/scripts/verify-2.2.9-cpu.sh'"
  echo '[PASS] Final verifier copied into the running clean-install environment.'

  section "01. ${profile^^} full functional traversal: 14 real operations"
  docker exec "${container}" runuser -u ubuntu -- env \
    FEDIT_VERIFY_PROFILE="${profile}" bash -lc '
      cd /home/ubuntu/FeDiT/OPFW/ml_prediction_manager_v2
      sudo -n env VERIFY_PROFILE="${FEDIT_VERIFY_PROFILE}" TEST_ACTION_TIMEOUT_SECONDS=240 \
        "./scripts/scripts/verify-2.2.9-${FEDIT_VERIFY_PROFILE}.sh"
    '

  section '02. Save the final functional report'
  report_path="$(docker exec "${container}" bash -lc \
    "find /home/ubuntu/prediction-manager-work/.prediction-manager/${profile}/functional-2.2.9 -name 'verification-report-2.2.9-${profile}.md' -type f -printf '%T@ %p\\n' | sort -nr | head -n 1 | cut -d' ' -f2-")"
  [[ -n "${report_path}" ]] || { echo 'Functional report was not produced.' >&2; return 1; }
  docker cp "${container}:${report_path}" "${output_dir}/verification-report-2.2.9-${profile}.md"
  sed -n '1,220p' "${output_dir}/verification-report-2.2.9-${profile}.md"

  section '03. Final service and port state'
  docker exec "${container}" bash -lc '
    printf "[prediction-manager] "; curl -fsS --max-time 5 http://127.0.0.1:18100/healthz
    curl -sS -o /dev/null -w "[fedit] HTTP %{http_code}\\n" --max-time 5 http://127.0.0.1:18000/fedit/predictor-creator-tool
    for attempt in $(seq 1 24); do
      unexpected=$(kubectl get pods -A --no-headers | awk '\''$4 != "Running" && $4 != "Succeeded" && $4 != "Completed" { bad++ } END { print bad + 0 }'\'')
      printf "[unexpected-pod-state] %s\\n" "${unexpected}"
      [[ "${unexpected}" == 0 ]] && break
      sleep 5
    done
    [[ "${unexpected}" == 0 ]] || { echo "test cleanup did not finish" >&2; exit 1; }
    ss -ltn
  '
  docker port "${container}"
  echo '[PASS] Functional revalidation recording session finished.'
}

if [[ "${1:-}" == '--session' ]]; then
  run_session
  exit 0
fi

profile="${1:?usage: record_profile_functional_retest.sh cpu|gpu OUTPUT_DIR}"
output_dir="${2:?usage: record_profile_functional_retest.sh cpu|gpu OUTPUT_DIR}"
case "${profile}" in
  cpu|gpu) ;;
  *) echo "profile must be cpu or gpu" >&2; exit 2 ;;
esac
container="fedit-clean-ubuntu22-recording-${profile}-final"
display_id="${FEDIT_RETEST_DISPLAY:-:107}"
mode="${profile^^}"
timestamp="$(date +%Y%m%d-%H%M%S)"
video_file="${output_dir}/${mode}_functional_retest_${timestamp}.mp4"
transcript_file="${output_dir}/${mode}_functional_retest_${timestamp}.typescript"

mkdir -p "${output_dir}"
docker inspect -f '{{.State.Running}}' "${container}" | grep -qx true \
  || { echo "Container is not running: ${container}" >&2; exit 1; }

cleanup() {
  local rc=$?
  set +e
  [[ -n "${ffmpeg_pid:-}" ]] && kill "${ffmpeg_pid}" 2>/dev/null
  [[ -n "${xvfb_pid:-}" ]] && kill "${xvfb_pid}" 2>/dev/null
  wait "${ffmpeg_pid:-}" "${xvfb_pid:-}" 2>/dev/null
  exit "${rc}"
}
trap cleanup EXIT INT TERM

Xvfb "${display_id}" -screen 0 1440x900x24 -nolisten tcp >"${output_dir}/xvfb.log" 2>&1 &
xvfb_pid=$!
sleep 1
DISPLAY="${display_id}" ffmpeg -y -f x11grab -video_size 1440x900 -framerate 10 \
  -i "${display_id}" -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p \
  -movflags +faststart "${video_file}" >"${output_dir}/ffmpeg.log" 2>&1 &
ffmpeg_pid=$!
sleep 1

export FEDIT_RETEST_PROFILE="${profile}"
export FEDIT_RETEST_CONTAINER="${container}"
export FEDIT_RETEST_OUTPUT="${output_dir}"
export FEDIT_RETEST_TRANSCRIPT="${transcript_file}"
DISPLAY="${display_id}" dbus-run-session -- gnome-terminal --wait --geometry=160x48+0+0 \
  --title="FeDiT ${mode} functional revalidation" -- bash -lc '
    set -o pipefail
    script -q -f "$FEDIT_RETEST_TRANSCRIPT" -c "\"$0\" --session"
    rc=$?
    printf "\\n[recording session exit=%s]\\n" "$rc"
    sleep 5
    exit "$rc"
  ' "$0"

sleep 1
kill "${ffmpeg_pid}"
wait "${ffmpeg_pid}" || true
unset ffmpeg_pid
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "${video_file}"
