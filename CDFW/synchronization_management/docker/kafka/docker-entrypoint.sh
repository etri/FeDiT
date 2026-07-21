#!/bin/bash
set -e

echo "[SEOLZERO] Generating Kafka config..."
envsubst < /opt/kafka/config/server.properties.template > /opt/kafka/config/server.properties

echo "[SEOLZERO] Starting ZooKeeper..."
/opt/kafka/bin/zookeeper-server-start.sh -daemon /opt/kafka/config/zookeeper.properties

echo "[SEOLZERO] Waiting for ZooKeeper..."
until nc -z localhost 2181; do
  sleep 2
done

echo "[SEOLZERO] Starting Kafka..."
exec /opt/kafka/bin/kafka-server-start.sh /opt/kafka/config/server.properties