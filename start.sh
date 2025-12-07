#!/usr/bin/env sh
set -eu

# Ensure we run from the repo root
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR"

# Dependencies are installed at build time by Nixpacks; no pip install here.

# Django management commands
python backend/manage.py collectstatic --noinput
python backend/manage.py migrate --noinput

# Start Gunicorn bound to provided $PORT (Railway sets this)
exec gunicorn config.wsgi:application --bind 0.0.0.0:"${PORT:-8000}" --workers 3
