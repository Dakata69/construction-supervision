import os
import sys
import django
from pathlib import Path

# Ensure backend package is importable (so `config` and `core` are on sys.path)
BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE / 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory
import json
import sys
import os
from pathlib import Path
from django.test import Client
from django.test.utils import setup_test_environment

# Add the backend directory to Python path
backend_path = str(Path(__file__).parent.parent / 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

# Set up the test environment
setup_test_environment()
client = Client()

factory = APIRequestFactory()

print('Testing API endpoints with Django test client')

# Test GET /api/documents/
response = client.get('/api/documents/')
print('GET /api/documents/ ->', response.content.decode())

# Test POST /api/documents/generate/
post_payload = {'template_name': 'act14_template.docx', 'context': {'project_name': 'Проект X'}}
response = client.post('/api/documents/generate/', 
                      data=json.dumps(post_payload),
                      content_type='application/json')
print('POST /api/documents/generate/ ->', response.content.decode())
