#!/bin/sh
set -e
export DEV_SERVER=1

pipenv run python manage.py reset_db
pipenv run python manage.py migrate

echo "권한 그룹 생성 중..."
pipenv run python manage.py create-auth-groups

echo "기본 사용자 생성 중..."
pipenv run python manage.py create-default-users

echo "KETI 어드민 테마 생성 중..."
pipenv run python manage.py create-keti-theme
