#!/bin/bash
source loadenv.sh
loadEnv .env

mkdir -p ./docker-bind/generated-data/jw
mkdir -p ./docker-bind/generated-data/logs/${TW_SERVICE_MANAGER__APP_NAME}

chmod 775 -R ./docker-bind