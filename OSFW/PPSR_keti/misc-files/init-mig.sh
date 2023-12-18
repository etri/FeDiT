#!/bin/sh
set -e
export DEV_SERVER=1

# 마이그레이션 초기화
find . | grep migrations/ | grep -v __init__ | xargs rm -rf
pipenv run python manage.py makemigrations
