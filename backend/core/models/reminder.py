from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta


class Reminder(models.Model):
    """Automated reminders for tasks and deadlines"""
    REMINDER_TYPE_CHOICES = [
        ('task_due', _('Task Due Soon')),
        ('act_pending', _('Act Pending Approval')),
        ('project_deadline', _('Project Deadline')),
        ('document_expiry', _('Document Expiring')),
        ('budget_alert', _('Budget Alert')),
        ('custom', _('Custom Reminder')),
    ]

    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('sent', _('Sent')),
        ('dismissed', _('Dismissed')),
    ]

    reminder_type = models.CharField(
        _('Reminder Type'),
        max_length=50,
        choices=REMINDER_TYPE_CHOICES
    )
    title = models.CharField(_('Title'), max_length=255)
    message = models.TextField(_('Message'))
    
    # Related objects
    project = models.ForeignKey(
        'Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reminders'
    )
    task = models.ForeignKey(
        'Task',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reminders'
    )
    
    # Timing
    trigger_date = models.DateTimeField(_('Trigger Date'))
    sent_at = models.DateTimeField(_('Sent At'), null=True, blank=True)
    
    # Recipients
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reminders'
    )
    
    status = models.CharField(
        _('Status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Push notification sent
    push_sent = models.BooleanField(_('Push Sent'), default=False)
    
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)

    class Meta:
        verbose_name = _('Reminder')
        verbose_name_plural = _('Reminders')
        ordering = ['trigger_date']
        indexes = [
            models.Index(fields=['status', 'trigger_date']),
            models.Index(fields=['recipient', '-trigger_date']),
        ]

    def __str__(self):
        return f"{self.title} - {self.recipient.username} - {self.trigger_date}"

    @classmethod
    def create_task_reminder(cls, task, days_before=1):
        """Create reminder for task due date"""
        if not task.due_date:
            return None
        
        trigger = task.due_date - timedelta(days=days_before)
        if trigger < timezone.now():
            return None
        
        recipient = task.assigned_to or task.created_by
        if not recipient:
            return None
        
        return cls.objects.create(
            reminder_type='task_due',
            title=f'Задача близо до срока: {task.title}',
            message=f'Задачата "{task.title}" трябва да бъде завършена до {task.due_date.strftime("%d.%m.%Y")}',
            project=task.project,
            task=task,
            trigger_date=trigger,
            recipient=recipient
        )

    @classmethod
    def create_project_deadline_reminder(cls, project, days_before=7):
        """Create reminder for project end date"""
        if not project.end_date:
            return None
        
        trigger = timezone.make_aware(
            timezone.datetime.combine(project.end_date, timezone.datetime.min.time())
        ) - timedelta(days=days_before)
        
        if trigger < timezone.now():
            return None
        
        # Send to project supervisor or creator
        recipient = project.supervisor or project.created_by
        if not recipient:
            return None
        
        return cls.objects.create(
            reminder_type='project_deadline',
            title=f'Проект близо до завършване: {project.name}',
            message=f'Проектът "{project.name}" трябва да приключи до {project.end_date.strftime("%d.%m.%Y")}',
            project=project,
            trigger_date=trigger,
            recipient=recipient
        )

    def mark_as_sent(self):
        """Mark reminder as sent"""
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at'])

    def dismiss(self):
        """Dismiss/ignore reminder"""
        self.status = 'dismissed'
        self.save(update_fields=['status'])
