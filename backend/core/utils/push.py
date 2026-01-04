import os
from typing import Optional
from pywebpush import webpush, WebPushException

VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY')
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY')
VAPID_EMAIL = os.environ.get('VAPID_EMAIL', 'mailto:admin@example.com')


def send_web_push(subscription_info: dict, title: str, body: str, url: Optional[str] = None, tag: Optional[str] = None):
    if not VAPID_PUBLIC_KEY or not VAPID_PRIVATE_KEY:
        raise RuntimeError('VAPID keys not configured')
    payload = {
        'title': title,
        'body': body,
    }
    if url:
        payload['url'] = url
    if tag:
        payload['tag'] = tag

    try:
        webpush(
            subscription_info=subscription_info,
            data=json_dumps(payload),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={
                'sub': VAPID_EMAIL,
            },
        )
    except WebPushException as e:
        # Could log and/or remove invalid subscriptions if 410 Gone, etc.
        raise


def json_dumps(obj) -> str:
    try:
        import json
        return json.dumps(obj)
    except Exception:
        # extremely defensive fallback
        return str(obj)
