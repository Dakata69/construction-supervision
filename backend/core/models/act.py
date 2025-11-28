from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from .project import Project

class Act(models.Model):
    """
    Construction Act (Акт) model for generating official construction documents.
    Supports Act 7 (level approval), Act 14 (structure acceptance), and Act 15 (final acceptance).
    """
    ACT_TYPE_CHOICES = [
        ('act7', _('Act 7 - Level Approval')),
        ('act14', _('Act 14 - Structure Acceptance')),
        ('act15', _('Act 15 - Final Acceptance')),
    ]
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='acts',
        verbose_name=_('Project')
    )
    act_type = models.CharField(
        _('Act Type'),
        max_length=10,
        choices=ACT_TYPE_CHOICES
    )
    act_number = models.CharField(_('Act Number'), max_length=50, blank=True)
    act_date = models.DateField(_('Act Date'))
    
    # Common fields
    representative_builder = models.CharField(_('Builder Representative'), max_length=200)
    representative_supervision = models.CharField(_('Supervision Representative'), max_length=200)
    representative_designer = models.CharField(_('Designer Representative'), max_length=200)
    
    # Act 7 specific
    level_from = models.CharField(_('Level From'), max_length=50, blank=True)
    level_to = models.CharField(_('Level To'), max_length=50, blank=True)
    work_description = models.TextField(_('Work Description'), blank=True)
    concrete_class = models.CharField(_('Concrete Class'), max_length=50, blank=True)
    concrete_work = models.CharField(_('Concrete Work'), max_length=200, blank=True)
    
    # Act 14 & 15 specific
    referenced_acts = models.TextField(_('Referenced Acts'), blank=True)
    quality_protocols = models.TextField(_('Quality Protocols'), blank=True)
    conclusion_text = models.TextField(_('Conclusion'), blank=True)
    
    # Act 15 specific
    all_designers = models.TextField(_('All Designers'), blank=True)
    all_supervision = models.TextField(_('All Supervision'), blank=True)
    referenced_documents = models.TextField(_('Referenced Documents'), blank=True)
    findings_permits = models.TextField(_('Findings - Permits'), blank=True)
    findings_execution = models.TextField(_('Findings - Execution'), blank=True)
    findings_site = models.TextField(_('Findings - Site'), blank=True)
    decision_text = models.TextField(_('Decision'), blank=True)
    
    # Generated files
    docx_file = models.FileField(upload_to='acts/%Y/%m/%d/', blank=True, null=True)
    pdf_file = models.FileField(upload_to='acts/%Y/%m/%d/', blank=True, null=True)
    zip_file = models.FileField(upload_to='acts/%Y/%m/%d/', blank=True, null=True)
    
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_acts'
    )
    
    class Meta:
        verbose_name = _('Act')
        verbose_name_plural = _('Acts')
        ordering = ['-act_date', '-created_at']
    
    def __str__(self):
        return f"{self.get_act_type_display()} - {self.project.name} - {self.act_date}"
    
    def get_template_name(self):
        """Return the appropriate template filename based on act_type."""
        return f"{self.act_type}_bg.docx"
    
    def get_context(self):
        """Build context dictionary for template generation."""
        context = {
            # Common fields from project
            'project_name': self.project.name,
            'project_location': self.project.location,
            'client_name': getattr(self.project.client, 'get_full_name', lambda: '')() if self.project.client else '',
            'contractor_name': self.project.contractor,
            'act_date': self.act_date.strftime('%d.%m.%Y'),
            'act_number': self.act_number,
            
            # Representatives
            'representative_builder': self.representative_builder,
            'representative_supervision': self.representative_supervision,
            'representative_designer': self.representative_designer,
            
            # Signatures (placeholders for now)
            'signature_builder': '........................',
            'signature_supervision': '........................',
            'signature_designer': '........................',
        }
        
        # Add act-specific fields
        if self.act_type == 'act7':
            context.update({
                'level_from': self.level_from,
                'level_to': self.level_to,
                'work_description': self.work_description,
                'concrete_class': self.concrete_class,
                'concrete_work': self.concrete_work,
            })
        elif self.act_type == 'act14':
            context.update({
                'referenced_acts': self.referenced_acts,
                'quality_protocols': self.quality_protocols,
                'conclusion_text': self.conclusion_text,
            })
        elif self.act_type == 'act15':
            context.update({
                'all_designers': self.all_designers,
                'all_supervision': self.all_supervision,
                'referenced_documents': self.referenced_documents,
                'findings_permits': self.findings_permits,
                'findings_execution': self.findings_execution,
                'findings_site': self.findings_site,
                'decision_text': self.decision_text,
            })
        
        return context
