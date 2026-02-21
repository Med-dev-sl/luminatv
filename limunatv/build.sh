#!/bin/bash
set -e

echo "Installing dependencies..."
pip install --only-binary :all: -r requirements.txt

echo "Running migrations..."
python manage.py migrate --no-input

echo "Collecting static files..."
mkdir -p ./staticfiles
python manage.py collectstatic --noinput --clear --verbosity 2

echo "Build complete!"
