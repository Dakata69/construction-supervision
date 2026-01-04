from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class UserProfile(models.Model):
    """Extended user profile for role-based access"""
    ROLE_CHOICES = [
        ('client', _('Client - View Own Projects Only')),
        ('privileged', _('Privileged User')),
        ('admin', _('Admin')),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    role = models.CharField(
        _('Role'),
        max_length=20,
        choices=ROLE_CHOICES,
        default='privileged'
    )
    
    # For clients - link to specific projects they can view
    accessible_projects = models.ManyToManyField(
        'Project',
        blank=True,
        related_name='client_users',
        help_text=_('Projects this client can access')
    )
    
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    
    class Meta:
        verbose_name = _('User Profile')
        verbose_name_plural = _('User Profiles')
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"
    
    def can_edit(self):
        """Check if user can edit projects (admin only)"""
        return self.role == 'admin'
    
    def is_client(self):
        """Check if user is a client"""
        return self.role == 'client'

