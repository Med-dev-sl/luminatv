#!/bin/bash
set -e
pip install --only-binary :all: -r requirements.txt
python manage.py migrate --no-input
python manage.py collectstatic --no-input
