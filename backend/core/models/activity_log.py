from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class ActivityLog(models.Model):
    """
    Tracks user activities across the system for audit and dashboard display
    """
    ACTION_TYPES = [
        ('project_created', _('Project Created')),
        ('project_updated', _('Project Updated')),
        ('project_deleted', _('Project Deleted')),
        ('document_generated', _('Document Generated')),
        ('document_uploaded', _('Document Uploaded')),
        ('document_deleted', _('Document Deleted')),
        ('act_created', _('Act Created')),
        ('act_updated', _('Act Updated')),
        ('task_created', _('Task Created')),
        ('task_updated', _('Task Updated')),
        ('task_completed', _('Task Completed')),
        ('user_created', _('User Created')),
        ('user_login', _('User Login')),
        ('user_logout', _('User Logout')),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='activity_logs',
        help_text=_('User who performed the action')
    )
    action_type = models.CharField(
        _('Action Type'),
        max_length=50,
        choices=ACTION_TYPES
    )
    description = models.CharField(
        _('Description'),
        max_length=500,
        help_text=_('Human-readable description of the action')
    )
    
    # Generic relation fields for linking to any model
    content_type = models.CharField(
        _('Related Model'),
        max_length=50,
        blank=True,
        help_text=_('Type of related object (project, document, etc.)')
    )
    object_id = models.IntegerField(
        _('Object ID'),
        null=True,
        blank=True,
        help_text=_('ID of the related object')
    )
    
    # Additional context
    metadata = models.JSONField(
        _('Metadata'),
        default=dict,
        blank=True,
        help_text=_('Additional data about the action')
    )
    
    ip_address = models.GenericIPAddressField(
        _('IP Address'),
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(
        _('Created At'),
        default=timezone.now,
        db_index=True
    )

    class Meta:
        verbose_name = _('Activity Log')
        verbose_name_plural = _('Activity Logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action_type', '-created_at']),
        ]

    def __str__(self):
        user_str = self.user.username if self.user else 'System'
        return f"{user_str} - {self.get_action_type_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    @classmethod
    def log_activity(cls, action_type, description, user=None, content_type=None, object_id=None, metadata=None, ip_address=None):
        """
        Helper method to create activity log entries
        
        Usage:
            ActivityLog.log_activity(
                action_type='project_created',
                description='Създаден нов проект "Жилищна сграда"',
                user=request.user,
                content_type='project',
                object_id=project.id,
                metadata={'project_name': project.name}
            )
        """
        return cls.objects.create(
            user=user,
            action_type=action_type,
            description=description,
            content_type=content_type or '',
            object_id=object_id,
            metadata=metadata or {},
            ip_address=ip_address
        )
