from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

class Project(models.Model):
    STATUS_CHOICES = [
        ('planning', _('Planning')),
        ('in_progress', _('In Progress')),
        ('on_hold', _('On Hold')),
        ('completed', _('Completed')),
        ('cancelled', _('Cancelled')),
    ]

    name = models.CharField(_('Project Name'), max_length=200)
    description = models.TextField(_('Description'), blank=True)
    location = models.CharField(_('Location'), max_length=200, blank=True, null=True, default='')
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='client_projects'
    )
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='supervised_projects'
    )
    contractor = models.CharField(_('Contractor'), max_length=200, blank=True, null=True, default='')
    start_date = models.DateField(_('Start Date'), null=True, blank=True)
    end_date = models.DateField(_('End Date'), null=True, blank=True)
    status = models.CharField(
        _('Status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='planning'
    )
    progress = models.PositiveIntegerField(_('Progress (%)'), default=0, help_text=_('Manual progress override 0-100'))
    act7_date = models.DateField(_('Act 7 Date'), null=True, blank=True)
    consultant_name = models.CharField(_('Consultant'), max_length=200, blank=True, default='')
    representative_builder = models.CharField(_('Representative Builder'), max_length=200, blank=True, default='')
    supervisor_name_text = models.CharField(_('Supervisor (Text)'), max_length=200, blank=True, default='')
    designer_name = models.CharField(_('Designer'), max_length=200, blank=True, default='')
    level_from = models.CharField(_('Level From'), max_length=50, blank=True, default='')
    level_to = models.CharField(_('Level To'), max_length=50, blank=True, default='')
    work_description = models.TextField(_('Work Description'), blank=True, default='')
    execution = models.TextField(_('Execution Next'), blank=True, default='')
    notes = models.TextField(_('Notes'), blank=True, default='', help_text=_('Internal notes for employees'))
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    
    linked_documents = models.ManyToManyField(
        'Document',
        blank=True,
        related_name='projects',
        verbose_name=_('Linked Documents')
    )

    class Meta:
        verbose_name = _('Project')
        verbose_name_plural = _('Projects')
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def is_active(self):
        return self.status == 'in_progress'

    @property
    def is_completed(self):
        return self.status == 'completed'

    @property
    def progress_percentage(self):
        try:
            if self.progress:
                return min(max(self.progress, 0), 100)
            
            # Try to get total tasks count
            try:
                total_tasks = self.tasks.count()
            except:
                total_tasks = 0
            
            if total_tasks == 0:
                return self.progress if self.progress else 0
            
            completed_tasks = self.tasks.filter(status='completed').count()
            return min(max((completed_tasks / total_tasks) * 100, 0), 100)
        except Exception:
            # If anything goes wrong, return the progress field or 0
            return self.progress if self.progress else 0

class ProjectDocument(models.Model):
    DOCUMENT_TYPES = [
        ('drawing', _('Drawing')),
        ('contract', _('Contract')),
        ('permit', _('Permit')),
        ('report', _('Report')),
        ('other', _('Other')),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    title = models.CharField(_('Title'), max_length=200)
    document_type = models.CharField(
        _('Document Type'),
        max_length=20,
        choices=DOCUMENT_TYPES
    )
    file = models.FileField(_('File'), upload_to='project_documents/%Y/%m/%d/')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_documents'
    )
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    description = models.TextField(_('Description'), blank=True)
    version = models.CharField(_('Version'), max_length=50, blank=True)

    class Meta:
        verbose_name = _('Project Document')
        verbose_name_plural = _('Project Documents')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.project.name}"