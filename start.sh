#!/usr/bin/env bash
set -euo pipefail

# Ensure we run from repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Move into backend and prepare environment
cd backend

# Collect static (safe if none)
python manage.py collectstatic --noinput || true

# Run migrations
python manage.py migrate --noinput

# Start gunicorn bound to Railway $PORT
export PORT="${PORT:-8000}"
exec gunicorn config.wsgi:application --bind 0.0.0.0:"${PORT}" --workers 3 --timeout 120
