#!/bin/sh

DEV_SERVER=1 pipenv run python manage.py graph_models -a -g -o misc-files/ERD.png

