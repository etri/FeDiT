#!/usr/bin/env bash
set -Eeuo pipefail

detect_host_ip() {
  local detected
  detected="$(ip -4 route get 1.1.1.1 2>/dev/null \
    | awk '{for (i=1; i<=NF; i++) if ($i=="src") {print $(i+1); exit}}')"
  if [[ -z "$detected" ]]; then
    detected="$(hostname -I 2>/dev/null \
      | tr ' ' '\n' \
      | awk '$0 !~ /^127\./ && $0 !~ /^169\.254\./ {print; exit}')"
  fi
  printf '%s\n' "${detected:-127.0.0.1}"
}

print_urls() {
  local host="$1" label="$2"
  printf '\n%s\n' "$label"
  printf 'FeDiT:              http://%s:18080/fedit/predictor-creator-tool\n' "$host"
  printf 'Prediction Manager: http://%s:18000/docs\n' "$host"
  printf 'Kubeflow:           http://%s:30080\n' "$host"
  printf 'Keycloak:           http://%s:30081/auth\n' "$host"
  printf 'MLflow:             http://%s:15000\n' "$host"
  printf 'NiFi:               http://%s:15001/nifi/\n' "$host"
  printf 'Ray Dashboard:      http://%s:15002\n' "$host"
  printf 'Label Studio:       http://%s:15003\n' "$host"
  printf 'Prometheus:         http://%s:19090\n' "$host"
}

requested_host="${PM_ACCESS_HOST:-${1:-}}"
detected_host="$(detect_host_ip)"

if [[ -n "$requested_host" ]]; then
  print_urls "$requested_host" "지정한 접속 주소"
else
  print_urls localhost "설치 호스트에서 여는 주소"
  if [[ "$detected_host" != 127.0.0.1 ]]; then
    print_urls "$detected_host" "다른 PC에서 여는 주소(호스트 방화벽 허용 필요)"
  fi
fi
