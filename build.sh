#!/bin/bash
set -e

echo "Building Django application..."
cd limunatv

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running migrations..."
python manage.py migrate --no-input

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Verifying deployment configuration..."
python manage.py check --deploy

echo "Build completed successfully!"
