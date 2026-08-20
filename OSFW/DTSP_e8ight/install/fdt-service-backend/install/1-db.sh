#!/usr/bin/env bash
# 1단계: DB — PostgreSQL / MongoDB / Redis
source "$(dirname "$0")/_common.sh"

echo "== 1. DB 기동 =="
$DC -f db/compose.yml up -d

echo "-- 준비 대기 --"
wait_healthy postgres mongodb redis
show 'postgres|mongodb|redis'

echo
echo "[완료] 다음: ./install/2-kafka.sh"
