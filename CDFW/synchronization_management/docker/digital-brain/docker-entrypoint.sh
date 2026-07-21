#!/bin/bash
set -e

echo "[SEOLZERO] Waiting for PostgreSQL DNS..."
until getent hosts "${POSTGRES_HOST:-postgres}" >/dev/null 2>&1; do
  sleep 2
done

echo "[SEOLZERO] Waiting for PostgreSQL port..."
until nc -z "${POSTGRES_HOST:-postgres}" "${POSTGRES_PORT:-5432}"; do
  sleep 2
done

echo "[SEOLZERO] Waiting for Kafka DNS..."
until getent hosts kafka >/dev/null 2>&1; do
  sleep 2
done

echo "[SEOLZERO] Waiting for Kafka port..."
until nc -z kafka 9092; do
  sleep 2
done

echo "[SEOLZERO] Waiting for Kafka Connect DNS..."
until getent hosts kafka-connect >/dev/null 2>&1; do
  sleep 2
done

echo "[SEOLZERO] Waiting for Kafka Connect port..."
until nc -z kafka-connect 8083; do
  sleep 2
done

echo "[SEOLZERO] Waiting for Flink DNS..."
until getent hosts flink >/dev/null 2>&1; do
  sleep 2
done

echo "[SEOLZERO] Waiting for Flink port..."
until nc -z flink 8087; do
  sleep 2
done

echo "[SEOLZERO] Waiting for MQTT DNS..."
until getent hosts mqtt >/dev/null 2>&1; do
  sleep 2
done

echo "[SEOLZERO] Waiting for MQTT port..."
until nc -z mqtt 1883; do
  sleep 2
done

echo "[SEOLZERO] Starting federatedDigitalBrain..."
exec npm start