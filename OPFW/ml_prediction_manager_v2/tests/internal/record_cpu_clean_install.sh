#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_PROFILE="${FEDIT_RECORD_PROFILE:-cpu}"
INSTALL_MODE="${FEDIT_RECORD_MODE:-${INSTALL_PROFILE^^}}"
OUTPUT_DIR="${1:-${SCRIPT_DIR}/evidence/${INSTALL_MODE}_$(date +%Y%m%d)/reinstall_recording_$(date +%Y%m%d-%H%M%S)}"
DISPLAY_ID="${FEDIT_INSTALL_VIDEO_DISPLAY:-:106}"
VIDEO_FILE="${OUTPUT_DIR}/${INSTALL_MODE}_clean_install_and_functional_recording.mp4"
TRANSCRIPT_FILE="${OUTPUT_DIR}/${INSTALL_MODE}_clean_install_and_functional_recording.typescript"

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

Xvfb "${DISPLAY_ID}" -screen 0 1440x900x24 -nolisten tcp >"${OUTPUT_DIR}/xvfb-install.log" 2>&1 &
XVFB_PID=$!
sleep 1
DISPLAY="${DISPLAY_ID}" ffmpeg -y -f x11grab -video_size 1440x900 -framerate 10 \
  -i "${DISPLAY_ID}" -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p \
  -movflags +faststart "${VIDEO_FILE}" >"${OUTPUT_DIR}/ffmpeg-install.log" 2>&1 &
FFMPEG_PID=$!
sleep 1

export FEDIT_RECORD_SESSION="${SCRIPT_DIR}/run_cpu_clean_install_recording.sh"
export FEDIT_RECORD_OUTPUT="${OUTPUT_DIR}"
export FEDIT_TERMINAL_TRANSCRIPT="${TRANSCRIPT_FILE}"
DISPLAY="${DISPLAY_ID}" dbus-run-session -- gnome-terminal --wait --geometry=160x48+0+0 \
  --title="FeDiT ${INSTALL_MODE} clean install and functional validation" -- bash -lc '
    set -o pipefail
    script -q -f "$FEDIT_TERMINAL_TRANSCRIPT" -c "$FEDIT_RECORD_SESSION \"$FEDIT_RECORD_OUTPUT\""
    rc=$?
    printf "\\n[recording session exit=%s]\\n" "$rc"
    sleep 5
    exit "$rc"
  '
sleep 1
kill "${FFMPEG_PID}"
wait "${FFMPEG_PID}" || true
unset FFMPEG_PID
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "${VIDEO_FILE}"
