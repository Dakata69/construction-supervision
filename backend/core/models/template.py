from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class DocumentTemplate(models.Model):
    """Reusable templates for document generation"""
    TEMPLATE_TYPE_CHOICES = [
        ('act7', _('Act 7')),
        ('act14', _('Act 14')),
        ('act15', _('Act 15')),
        ('contract', _('Contract')),
        ('invoice', _('Invoice')),
        ('report', _('Report')),
        ('other', _('Other')),
    ]

    name = models.CharField(_('Template Name'), max_length=200)
    template_type = models.CharField(
        _('Template Type'),
        max_length=50,
        choices=TEMPLATE_TYPE_CHOICES
    )
    description = models.TextField(_('Description'), blank=True)
    
    # Pre-filled content blocks
    default_content = models.JSONField(
        _('Default Content'),
        default=dict,
        help_text=_('JSON object with default field values')
    )
    
    # File template if using DOCX template
    template_file = models.FileField(
        _('Template File'),
        upload_to='templates/',
        blank=True,
        null=True
    )
    
    is_active = models.BooleanField(_('Active'), default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_templates'
    )
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)

    class Meta:
        verbose_name = _('Document Template')
        verbose_name_plural = _('Document Templates')
        ordering = ['template_type', 'name']

    def __str__(self):
        return f"{self.get_template_type_display()} - {self.name}"


class TextSnippet(models.Model):
    """Reusable text snippets for quick insertion"""
    CATEGORY_CHOICES = [
        ('location', _('Location Descriptions')),
        ('work_type', _('Work Types')),
        ('materials', _('Materials')),
        ('legal', _('Legal Clauses')),
        ('safety', _('Safety Notes')),
        ('quality', _('Quality Standards')),
        ('other', _('Other')),
    ]

    title = models.CharField(_('Title'), max_length=200)
    category = models.CharField(
        _('Category'),
        max_length=50,
        choices=CATEGORY_CHOICES
    )
    content = models.TextField(_('Content'))
    tags = models.CharField(
        _('Tags'),
        max_length=255,
        blank=True,
        help_text=_('Comma-separated tags for searching')
    )
    usage_count = models.IntegerField(_('Usage Count'), default=0)
    is_active = models.BooleanField(_('Active'), default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='text_snippets'
    )
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)

    class Meta:
        verbose_name = _('Text Snippet')
        verbose_name_plural = _('Text Snippets')
        ordering = ['-usage_count', 'category', 'title']

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"

    def increment_usage(self):
        """Increment usage counter"""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])
