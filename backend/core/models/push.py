import hashlib
from django.db import models
from django.conf import settings


class PushSubscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.URLField(max_length=2000)  # Long URLs from push services (Windows endpoints can exceed 1000 chars)
    endpoint_hash = models.CharField(max_length=64, unique=True, db_index=True, null=True, blank=True)  # SHA256 hash for unique constraint
    p256dh = models.CharField(max_length=256)
    auth = models.CharField(max_length=128)
    user_agent = models.CharField(max_length=256, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        """Generate endpoint hash before saving"""
        if not self.endpoint_hash and self.endpoint:
            self.endpoint_hash = hashlib.sha256(self.endpoint.encode()).hexdigest()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"PushSubscription(user={self.user_id})"
