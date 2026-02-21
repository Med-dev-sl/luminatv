#!/bin/bash
# Start script with proper Python path setup
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
cd limunatv
exec gunicorn --workers 2 --bind 0.0.0.0:$PORT limunatv.wsgi:application
