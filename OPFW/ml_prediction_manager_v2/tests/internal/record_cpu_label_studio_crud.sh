#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${1:-${SCRIPT_DIR}/evidence/CPU_20260814/video}"
DISPLAY_ID="${FEDIT_VIDEO_DISPLAY:-:100}"
MODE="${FEDIT_TEST_MODE:-CPU}"
VIDEO_FILE="${OUTPUT_DIR}/${MODE}_label_studio_crud_$(date +%Y%m%d-%H%M%S).mp4"

mkdir -p "${OUTPUT_DIR}"
cleanup() {
  local rc=$?
  set +e
  [[ -n "${FFMPEG_PID:-}" ]] && kill "${FFMPEG_PID}" 2>/dev/null
  [[ -n "${XVFB_PID:-}" ]] && kill "${XVFB_PID}" 2>/dev/null
  wait "${FFMPEG_PID:-}" "${XVFB_PID:-}" 2>/dev/null
  exit "${rc}"
}
trap cleanup EXIT INT TERM

Xvfb "${DISPLAY_ID}" -screen 0 1440x900x24 -nolisten tcp >"${OUTPUT_DIR}/xvfb-label.log" 2>&1 &
XVFB_PID=$!
sleep 1
DISPLAY="${DISPLAY_ID}" ffmpeg -y -f x11grab -video_size 1440x900 -framerate 10 \
  -i "${DISPLAY_ID}" -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p \
  -movflags +faststart "${VIDEO_FILE}" >"${OUTPUT_DIR}/ffmpeg-label.log" 2>&1 &
FFMPEG_PID=$!
sleep 1
DISPLAY="${DISPLAY_ID}" FEDIT_TEST_MODE="${MODE}" /home/user/.cache/fedit-browser-venv/bin/python \
  "${SCRIPT_DIR}/run_cpu_label_studio_crud.py" "${OUTPUT_DIR}"
sleep 1
kill "${FFMPEG_PID}"
wait "${FFMPEG_PID}" || true
unset FFMPEG_PID
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 \
  "${VIDEO_FILE}"
