#!/bin/bash
set -e

echo "[SEOLZERO] Waiting for Kafka broker..."
until nc -z kafka 9092; do
  sleep 2
done

echo "[SEOLZERO] Starting Kafka Connect..."
exec /opt/kafka/bin/connect-distributed.sh /etc/kafka/connect-distributed.properties