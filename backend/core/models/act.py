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
    
    representative_builder = models.CharField(_('Builder Representative'), max_length=200)
    representative_supervision = models.CharField(_('Supervision Representative'), max_length=200)
    representative_designer = models.CharField(_('Designer Representative'), max_length=200)
    
    level_from = models.CharField(_('Level From'), max_length=50, blank=True)
    level_to = models.CharField(_('Level To'), max_length=50, blank=True)
    work_description = models.TextField(_('Work Description'), blank=True)
    concrete_class = models.CharField(_('Concrete Class'), max_length=50, blank=True)
    concrete_work = models.CharField(_('Concrete Work'), max_length=200, blank=True)
    
    referenced_acts = models.TextField(_('Referenced Acts'), blank=True)
    quality_protocols = models.TextField(_('Quality Protocols'), blank=True)
    conclusion_text = models.TextField(_('Conclusion'), blank=True)
    
    all_designers = models.TextField(_('All Designers'), blank=True)
    all_supervision = models.TextField(_('All Supervision'), blank=True)
    referenced_documents = models.TextField(_('Referenced Documents'), blank=True)
    findings_permits = models.TextField(_('Findings - Permits'), blank=True)
    findings_execution = models.TextField(_('Findings - Execution'), blank=True)
    findings_site = models.TextField(_('Findings - Site'), blank=True)
    decision_text = models.TextField(_('Decision'), blank=True)
    
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
            'project_name': self.project.name,
            'project_location': self.project.location,
            'client_name': getattr(self.project.client, 'get_full_name', lambda: '')() if self.project.client else '',
            'contractor_name': self.project.contractor,
            'act_date': self.act_date.strftime('%d.%m.%Y'),
            'act_number': self.act_number,
            
            'representative_builder': self.representative_builder,
            'representative_supervision': self.representative_supervision,
            'representative_designer': self.representative_designer,
            
            'signature_builder': '........................',
            'signature_supervision': '........................',
            'signature_designer': '........................',
        }

        # Fallback/alias placeholders used in Act templates
        context.setdefault('consultant_name', getattr(self.project, 'consultant_name', '') or self.representative_supervision)
        context.setdefault('designer_name', self.representative_designer or getattr(self.project, 'designer_name', ''))
        context.setdefault('project_location', getattr(self.project, 'location', '') or context.get('project_location', ''))
        if not context.get('client_name') and getattr(self.project, 'client', None):
            client = self.project.client
            context['client_name'] = getattr(client, 'get_full_name', lambda: '')() or getattr(client, 'username', '')
        
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
                # Template placeholders fallbacks
                'tech_supervisor_name': getattr(self.project, 'supervisor_name_text', ''),
                'additional_documents': self.quality_protocols or self.referenced_acts or '',
                'defects_description': self.conclusion_text,
                'designer_signature': context.get('designer_name', ''),
                'contractor_signature': context.get('contractor_name', ''),
                'supervisor_signature': context.get('representative_supervision', ''),
                'consultant_footer': context.get('consultant_name', ''),
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
                # Act 15 template placeholders (best-effort mapping)
                'consultant_name': context.get('consultant_name', context.get('representative_supervision', '')),
                'designer_name': context.get('designer_name', ''),
                'client_representative': '',
                'designer_company': '',
                'designer_representative': '',
                'contractor_representative': context.get('representative_builder', ''),
                'contractor_part1': '',
                'contractor_part2': '',
                'permit_number': '',
                'permit_date': '',
                'permit_issuer': '',
                'municipality': '',
                'legalization_number': '',
                'legalization_date': '',
                'legalization_municipality': '',
                'approval_date': '',
                'approval_authority': '',
                'approved_projects': self.referenced_documents,
                'construction_contracts': self.referenced_documents,
                'documentation_findings': self.findings_permits,
                'execution_findings': self.findings_execution,
                'site_condition': self.findings_site,
                'surrounding_condition': self.findings_site,
                'defect_removal_start': self.act_date.strftime('%d.%m.%Y'),
                'defect_description': self.decision_text,
                'defect_removal_deadline': '',
                'temporary_removal_deadline': '',
                'temporary_removal_location': '',
                'attached_documents_a': '',
                'attached_documents_b': '',
                'authorized_representative': '',
                'handover_notes': '',
                'client_signature': context.get('client_name', ''),
                'designer_signature': context.get('designer_name', ''),
                'contractor_signature': context.get('contractor_name', ''),
                'consultant_signature': context.get('consultant_name', ''),
            })
        
        return context
