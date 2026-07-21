#!/bin/bash
set -e

echo "[SEOLZERO] Starting Flink cluster..."
bin/start-cluster.sh

echo "[SEOLZERO] Starting Flink SQL Gateway..."
bin/sql-gateway.sh

echo "[SEOLZERO] Flink cluster and SQL Gateway started."

tail -f /dev/null