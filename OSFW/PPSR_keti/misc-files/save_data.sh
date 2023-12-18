#! /bin/sh
rm dump.json
rm misc-files/dump.json
env DEV_SERVER=0 pipenv run python manage.py dumpdata > misc-files/dump.json
