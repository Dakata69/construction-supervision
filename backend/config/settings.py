import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0').split(',')

if os.environ.get('VERCEL_URL'):
    ALLOWED_HOSTS.append(os.environ.get('VERCEL_URL'))

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://construction-supervision-rosy.vercel.app",
    "https://construction-supervision-htsbz5u7d-dakata69s-projects.vercel.app",
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]

if os.environ.get('FRONTEND_URL'):
    CORS_ALLOWED_ORIGINS.append(os.environ.get('FRONTEND_URL'))

if os.environ.get('DATABASE_URL'):
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(default=os.environ.get('DATABASE_URL'))
    }
else:
    DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'construction_supervision',
        'USER': 'construction_user',
        'PASSWORD': '!msqlDakata044769', 
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        }
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

INSTALLED_APPS = [
	'django.contrib.admin',
	'django.contrib.auth',
	'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.messages',
	'django.contrib.staticfiles',
	'rest_framework',
	'corsheaders',
	'core',
]

MIDDLEWARE = [
	'corsheaders.middleware.CorsMiddleware',
	'django.middleware.security.SecurityMiddleware',
	'whitenoise.middleware.WhiteNoiseMiddleware',
	'django.contrib.sessions.middleware.SessionMiddleware',
	'django.middleware.common.CommonMiddleware',
	'django.middleware.csrf.CsrfViewMiddleware',
	'django.contrib.auth.middleware.AuthenticationMiddleware',
	'django.contrib.messages.middleware.MessageMiddleware',
	'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
	{
		'BACKEND': 'django.template.backends.django.DjangoTemplates',
		'DIRS': [],
		'APP_DIRS': True,
		'OPTIONS': {
			'context_processors': [
				'django.template.context_processors.debug',
				'django.template.context_processors.request',
				'django.contrib.auth.context_processors.auth',
				'django.contrib.messages.context_processors.messages',
			],
		},
	},
]

WSGI_APPLICATION = 'config.wsgi.application'

# DATABASES configuration is above (lines 30-48)
# Using MySQL if DATABASE_URL is not set

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

CORS_ALLOW_CREDENTIALS = True

# Email configuration
# EMAIL_BACKEND determines how emails are sent:
#   - 'django.core.mail.backends.console.EmailBackend' (default in development)
#     Emails are printed to console instead of being sent. Check console/terminal output.
#   - 'django.core.mail.backends.smtp.EmailBackend' (production)
#     Sends emails via SMTP server. Configure EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD.
#
# To receive actual emails in development, set in .env:
#   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
#   EMAIL_HOST=smtp.gmail.com (or your SMTP server)
#   EMAIL_PORT=587
#   EMAIL_USE_TLS=True
#   EMAIL_HOST_USER=your-email@gmail.com
#   EMAIL_HOST_PASSWORD=your-app-password (for Gmail, use 16-char app password)
#
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@construction-supervision.bg')
SERVER_EMAIL = os.environ.get('SERVER_EMAIL', 'server@construction-supervision.bg')

# Frontend URL for password reset links
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'debug.log'),
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'core': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

TEMPLATES[0]['DIRS'] = [
    os.path.join(BASE_DIR, 'templates'),
]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

os.makedirs(os.path.join(MEDIA_ROOT, 'templates'), exist_ok=True)
os.makedirs(os.path.join(MEDIA_ROOT, 'documents'), exist_ok=True)
