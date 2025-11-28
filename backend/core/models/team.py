from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Team(models.Model):
    name = models.CharField(_('Team Name'), max_length=200)
    description = models.TextField(_('Description'), blank=True)
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    leader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='led_teams'
    )

    class Meta:
        verbose_name = _('Team')
        verbose_name_plural = _('Teams')
        ordering = ['name']

    def __str__(self):
        return self.name

class TeamMember(models.Model):
    ROLE_CHOICES = [
        ('supervisor', _('Supervisor')),
        ('inspector', _('Inspector')),
        ('engineer', _('Engineer')),
        ('architect', _('Architect')),
        ('safety_officer', _('Safety Officer')),
        ('admin', _('Administrator')),
    ]

    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='team_memberships'
    )
    role = models.CharField(
        _('Role'),
        max_length=20,
        choices=ROLE_CHOICES
    )
    joined_at = models.DateTimeField(_('Joined At'), auto_now_add=True)
    is_active = models.BooleanField(_('Is Active'), default=True)

    class Meta:
        verbose_name = _('Team Member')
        verbose_name_plural = _('Team Members')
        unique_together = ('team', 'user')
        ordering = ['team', 'user']

    def __str__(self):
        return f"{self.user} - {self.role} in {self.team}"

class ProjectTeam(models.Model):
    project = models.ForeignKey(
        'Project',
        on_delete=models.CASCADE,
        related_name='project_teams'
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='assigned_projects'
    )
    assigned_at = models.DateTimeField(_('Assigned At'), auto_now_add=True)
    is_active = models.BooleanField(_('Is Active'), default=True)

    class Meta:
        verbose_name = _('Project Team')
        verbose_name_plural = _('Project Teams')
        unique_together = ('project', 'team')
        ordering = ['-assigned_at']

    def __str__(self):
        return f"{self.team} on {self.project}"