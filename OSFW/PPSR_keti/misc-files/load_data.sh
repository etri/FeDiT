#! /bin/sh
export DEV_SERVER=true
pipenv run python manage.py reset_db
pipenv run python manage.py migrate
mysql -D fanta -e "delete from auth_permission"
mysql -D fanta -e "delete from django_content_type"
pipenv run python manage.py loaddata misc-files/dump.json
