from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta


class WeatherLog(models.Model):
    """Daily weather conditions logged for projects"""
    project = models.ForeignKey(
        'Project',
        on_delete=models.CASCADE,
        related_name='weather_logs'
    )
    date = models.DateField(_('Date'), default=timezone.now)
    
    # Weather conditions
    temperature_min = models.DecimalField(
        _('Min Temperature (°C)'),
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True
    )
    temperature_max = models.DecimalField(
        _('Max Temperature (°C)'),
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True
    )
    condition = models.CharField(
        _('Weather Condition'),
        max_length=100,
        blank=True,
        help_text=_('e.g., Sunny, Rainy, Cloudy, Snowy')
    )
    precipitation = models.DecimalField(
        _('Precipitation (mm)'),
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True
    )
    wind_speed = models.DecimalField(
        _('Wind Speed (km/h)'),
        max_digits=5,
        decimal_places=1,
        null=True,
        blank=True
    )
    humidity = models.IntegerField(
        _('Humidity (%)'),
        null=True,
        blank=True
    )
    
    # Work impact
    work_stopped = models.BooleanField(
        _('Work Stopped'),
        default=False,
        help_text=_('Whether work was stopped due to weather')
    )
    impact_notes = models.TextField(
        _('Impact Notes'),
        blank=True,
        help_text=_('Description of weather impact on work')
    )
    
    # Auto-fetched data
    api_source = models.CharField(
        _('Data Source'),
        max_length=100,
        blank=True,
        help_text=_('API source if automatically fetched')
    )
    raw_data = models.JSONField(
        _('Raw API Data'),
        default=dict,
        blank=True
    )
    
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)

    class Meta:
        verbose_name = _('Weather Log')
        verbose_name_plural = _('Weather Logs')
        ordering = ['-date']
        unique_together = ['project', 'date']
        indexes = [
            models.Index(fields=['project', '-date']),
        ]

    def __str__(self):
        return f"{self.project.name} - {self.date} - {self.condition}"

    @property
    def is_unfavorable(self):
        """Check if weather was unfavorable for construction"""
        if self.work_stopped:
            return True
        if self.precipitation and self.precipitation > 5:  # >5mm rain
            return True
        if self.wind_speed and self.wind_speed > 50:  # >50km/h wind
            return True
        if self.temperature_max and self.temperature_max < 0:  # Freezing
            return True
        return False
