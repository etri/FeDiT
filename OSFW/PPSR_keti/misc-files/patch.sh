#!/bin/bash
set -e
mv fanta/media .
rm -rf fanta/*
mv fanta.zip fanta
cd fanta
unzip fanta.zip
rm fanta.zip
chmod +x misc-files/*.sh
dos2unix misc-files/*.sh
rm misc-files/load_data.sh
rm -rf media
mv ../media .
pipenv sync
pipenv run python manage.py migrate
cd ..
