web: cd backend && python manage.py migrate --noinput && python manage.py create_superuser && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3
