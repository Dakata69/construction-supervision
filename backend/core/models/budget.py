from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class ProjectBudget(models.Model):
    """Overall budget for a project"""
    project = models.OneToOneField(
        'Project',
        on_delete=models.CASCADE,
        related_name='budget'
    )
    initial_budget = models.DecimalField(
        _('Initial Budget'),
        max_digits=12,
        decimal_places=2,
        help_text=_('Total planned budget in BGN')
    )
    currency = models.CharField(
        _('Currency'),
        max_length=3,
        default='BGN'
    )
    notes = models.TextField(_('Notes'), blank=True)
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)

    class Meta:
        verbose_name = _('Project Budget')
        verbose_name_plural = _('Project Budgets')

    def __str__(self):
        return f"{self.project.name} - {self.initial_budget} {self.currency}"

    @property
    def total_expenses(self):
        """Calculate total expenses from all budget items"""
        return self.expenses.aggregate(
            total=models.Sum('amount')
        )['total'] or 0

    @property
    def remaining_budget(self):
        """Calculate remaining budget"""
        return self.initial_budget - self.total_expenses

    @property
    def budget_usage_percentage(self):
        """Calculate percentage of budget used"""
        if self.initial_budget == 0:
            return 0
        return (self.total_expenses / self.initial_budget) * 100

    @property
    def is_over_budget(self):
        """Check if project is over budget"""
        return self.total_expenses > self.initial_budget


class BudgetExpense(models.Model):
    """Individual expense items for a project budget"""
    CATEGORY_CHOICES = [
        ('materials', _('Materials')),
        ('labor', _('Labor')),
        ('equipment', _('Equipment')),
        ('permits', _('Permits & Licenses')),
        ('subcontractors', _('Subcontractors')),
        ('transport', _('Transportation')),
        ('utilities', _('Utilities')),
        ('insurance', _('Insurance')),
        ('other', _('Other')),
    ]

    budget = models.ForeignKey(
        ProjectBudget,
        on_delete=models.CASCADE,
        related_name='expenses'
    )
    category = models.CharField(
        _('Category'),
        max_length=50,
        choices=CATEGORY_CHOICES
    )
    description = models.CharField(_('Description'), max_length=255)
    amount = models.DecimalField(
        _('Amount'),
        max_digits=10,
        decimal_places=2
    )
    date = models.DateField(_('Date'), default=timezone.now)
    invoice_number = models.CharField(
        _('Invoice Number'),
        max_length=100,
        blank=True
    )
    vendor = models.CharField(
        _('Vendor/Supplier'),
        max_length=255,
        blank=True
    )
    notes = models.TextField(_('Notes'), blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='budget_expenses'
    )
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)

    class Meta:
        verbose_name = _('Budget Expense')
        verbose_name_plural = _('Budget Expenses')
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.category} - {self.amount} BGN - {self.description}"
