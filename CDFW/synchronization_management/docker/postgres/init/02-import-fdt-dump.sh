#!/bin/bash
set -e

echo "[SEOLZERO] Importing federated_digital_twin dump..."

export PGPASSWORD="${POSTGRES_PASSWORD}"

psql -U "${POSTGRES_USER}" -d federated_digital_twin -f /init/federated_digital_twin-dump.sql || true

if [ -f /init/IdentificationScheme.sql ]; then
  psql -U "${POSTGRES_USER}" -d federated_digital_twin -f /init/IdentificationScheme.sql || true
fi

echo "[SEOLZERO] PostgreSQL init done."