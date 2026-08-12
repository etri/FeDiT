#!/usr/bin/env bash
set -Eeuo pipefail

NODE_IP="${NODE_IP:-$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}')}"
NODE_IP="${NODE_IP:-127.0.0.1}"
FAILED=0

pass() { printf '[PASS] %s\n' "$*"; }
fail() { printf '[FAIL] %s\n' "$*" >&2; FAILED=1; }

check_http() {
  local name="$1" url="$2" code
  code="$(curl -kLsS -o /dev/null -w '%{http_code}' --max-time 20 "$url" || true)"
  case "$code" in
    2??|3??|401|403) pass "${name} 진입 (${url}, HTTP ${code})" ;;
    *) fail "${name} 진입 실패 (${url}, HTTP ${code:-000})" ;;
  esac
}

kubectl get nodes >/dev/null 2>&1 \
  && pass "Kubernetes API 진입" \
  || fail "Kubernetes API 진입 실패"

kubectl -n prediction-manager rollout status deployment/prediction-manager \
  --timeout=120s >/dev/null 2>&1 \
  && pass "Prediction Manager deployment Ready" \
  || fail "Prediction Manager deployment Ready 확인 실패"

check_http "Prediction Manager" "http://${NODE_IP}:18000/docs"
check_http "Kubeflow" "http://${NODE_IP}:30080/"

if command -v nvidia-smi >/dev/null 2>&1; then
  GPU_SUMMARY="$(nvidia-smi --query-gpu=name,memory.total,driver_version \
    --format=csv,noheader,nounits | sort | uniq -c | sed 's/^ *//' | paste -sd ';' -)"
  pass "기존 GPU/driver 사용 (${GPU_SUMMARY})"
else
  fail "nvidia-smi 진입 실패; 이 스크립트는 driver를 설치하지 않음"
fi

((FAILED == 0)) || exit 1
pass "서비스 진입 점검 완료"
