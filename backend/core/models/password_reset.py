from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
import secrets


class PasswordResetToken(models.Model):
    """One-time password reset tokens for users"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    token = models.CharField(_('Token'), max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    expires_at = models.DateTimeField(_('Expires At'))
    used = models.BooleanField(_('Used'), default=False)
    used_at = models.DateTimeField(_('Used At'), null=True, blank=True)

    class Meta:
        verbose_name = _('Password Reset Token')
        verbose_name_plural = _('Password Reset Tokens')
        ordering = ['-created_at']

    def __str__(self):
        return f"Reset token for {self.user.username} - {'Used' if self.used else 'Pending'}"

    @classmethod
    def create_token(cls, user, expires_in_hours=24):
        """Create a new password reset token for a user"""
        from django.utils import timezone
        from datetime import timedelta
        
        # Invalidate any existing unused tokens
        cls.objects.filter(user=user, used=False).update(used=True)
        
        # Generate secure token
        token = secrets.token_urlsafe(48)
        expires_at = timezone.now() + timedelta(hours=expires_in_hours)
        
        reset_token = cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
        return reset_token

    def is_valid(self):
        """Check if token is valid (not expired, not used)"""
        return (
            not self.used and
            self.expires_at > timezone.now()
        )

    def mark_used(self):
        """Mark token as used"""
        self.used = True
        self.used_at = timezone.now()
        self.save()
