#!/usr/bin/env sh
set -eu

# Ensure we run from the repo root
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR"

# Install backend dependencies if requirements exist
if [ -f "backend/requirements.txt" ]; then
  pip install --no-cache-dir -r backend/requirements.txt
fi

# Django management commands
python backend/manage.py collectstatic --noinput
python backend/manage.py migrate --noinput

# Start Gunicorn bound to provided $PORT (Railway sets this)
exec gunicorn config.wsgi:application --bind 0.0.0.0:"${PORT:-8000}" --workers 3

# Move into backend and prepare environment
cd backend

# Collect static (safe if none)
python manage.py collectstatic --noinput || true

# Run migrations
python manage.py migrate --noinput

# Start gunicorn bound to Railway $PORT
export PORT="${PORT:-8000}"
exec gunicorn config.wsgi:application --bind 0.0.0.0:"${PORT}" --workers 3 --timeout 120
