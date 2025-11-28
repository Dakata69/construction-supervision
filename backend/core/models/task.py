from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('in_progress', _('In Progress')),
        ('completed', _('Completed')),
        ('blocked', _('Blocked')),
    ]

    PRIORITY_CHOICES = [
        ('low', _('Low')),
        ('medium', _('Medium')),
        ('high', _('High')),
        ('urgent', _('Urgent')),
    ]

    project = models.ForeignKey(
        'Project',
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    title = models.CharField(_('Title'), max_length=200)
    description = models.TextField(_('Description'), blank=True)
    status = models.CharField(
        _('Status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    priority = models.CharField(
        _('Priority'),
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_tasks'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks'
    )
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    due_date = models.DateTimeField(_('Due Date'), null=True, blank=True)
    completed_at = models.DateTimeField(_('Completed At'), null=True, blank=True)
    estimated_hours = models.DecimalField(
        _('Estimated Hours'),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = _('Task')
        verbose_name_plural = _('Tasks')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.project.name}"

    def complete(self):
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()

class TaskComment(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='task_comments'
    )
    content = models.TextField(_('Content'))
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    image = models.ImageField(
        _('Image'),
        upload_to='task_comments/%Y/%m/%d/',
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = _('Task Comment')
        verbose_name_plural = _('Task Comments')
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment on {self.task.title} by {self.author}"