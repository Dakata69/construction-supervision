import time
import json
from urllib.request import urlopen, Request

BASE = 'http://127.0.0.1:8000'

def wait_get(path, attempts=10, delay=0.5):
    url = BASE + path
    for i in range(attempts):
        try:
            with urlopen(url, timeout=2) as r:
                return r.read().decode()
        except Exception as e:
            print(f'attempt {i} failed: {e}')
            time.sleep(delay)
    raise RuntimeError('server not reachable')

def post_json(path, payload):
    url = BASE + path
    data = json.dumps(payload).encode()
    req = Request(url, data=data, headers={'Content-Type':'application/json'})
    with urlopen(req) as r:
        return r.read().decode()

if __name__ == '__main__':
    print('GET /api/documents/')
    try:
        print(wait_get('/api/documents/'))
    except Exception as e:
        print('GET failed:', e)

    print('\nPOST /api/documents/generate/')
    try:
        print(post_json('/api/documents/generate/', {'template_name': 'act14_template.docx', 'context': {'project_name': 'Проект X'}}))
    except Exception as e:
        print('POST failed:', e)
