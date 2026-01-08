from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, Avg
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from core.models import (
    ProjectBudget, BudgetExpense, DocumentTemplate, TextSnippet,
    WeatherLog, Reminder, Project, Task, Act
)
from core.serializers import (
    ProjectBudgetSerializer, BudgetExpenseSerializer,
    DocumentTemplateSerializer, TextSnippetSerializer,
    WeatherLogSerializer, ReminderSerializer
)


class ProjectBudgetViewSet(viewsets.ModelViewSet):
    """Project budget management"""
    queryset = ProjectBudget.objects.all()
    serializer_class = ProjectBudgetSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = ProjectBudget.objects.all()
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get budget summary with category breakdown"""
        budget = self.get_object()
        
        # Category breakdown with currency conversion into budget currency
        rate = Decimal('1.96')  # 1 EUR = 1.96 BGN
        cat_totals = {}
        for exp in budget.expenses.all():
            amt = Decimal(exp.amount)
            # convert to budget currency
            if exp.expense_currency == budget.currency:
                conv = amt
            else:
                if budget.currency == 'BGN' and exp.expense_currency == 'EUR':
                    conv = amt * rate
                elif budget.currency == 'EUR' and exp.expense_currency == 'BGN':
                    conv = amt / rate
                else:
                    conv = amt
            entry = cat_totals.get(exp.category, {'category': exp.category, 'total': Decimal('0'), 'count': 0})
            entry['total'] += conv
            entry['count'] += 1
            cat_totals[exp.category] = entry
        category_breakdown = sorted([
            {
                'category': k,
                'total': float(v['total']),
                'count': v['count']
            } for k, v in cat_totals.items()
        ], key=lambda x: x['total'], reverse=True)
        
        return Response({
            'initial_budget': budget.initial_budget,
            'total_expenses': budget.total_expenses,
            'remaining_budget': budget.remaining_budget,
            'usage_percentage': budget.budget_usage_percentage,
            'is_over_budget': budget.is_over_budget,
            'category_breakdown': category_breakdown,
            'currency': budget.currency
        })


class BudgetExpenseViewSet(viewsets.ModelViewSet):
    """Budget expense management"""
    queryset = BudgetExpense.objects.all()
    serializer_class = BudgetExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = BudgetExpense.objects.all()
        budget_id = self.request.query_params.get('budget')
        project_id = self.request.query_params.get('project')
        category = self.request.query_params.get('category')
        
        if budget_id:
            queryset = queryset.filter(budget_id=budget_id)
        if project_id:
            queryset = queryset.filter(budget__project_id=project_id)
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset.order_by('-date', '-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DocumentTemplateViewSet(viewsets.ModelViewSet):
    """Document template management"""
    queryset = DocumentTemplate.objects.filter(is_active=True)
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = DocumentTemplate.objects.filter(is_active=True)
        template_type = self.request.query_params.get('type')
        if template_type:
            queryset = queryset.filter(template_type=template_type)
        return queryset.order_by('template_type', 'name')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TextSnippetViewSet(viewsets.ModelViewSet):
    """Text snippet management"""
    queryset = TextSnippet.objects.filter(is_active=True)
    serializer_class = TextSnippetSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = TextSnippet.objects.filter(is_active=True)
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        
        if category:
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search) |
                Q(tags__icontains=search)
            )
        
        return queryset.order_by('-usage_count', 'title')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def use(self, request, pk=None):
        """Increment usage counter"""
        snippet = self.get_object()
        snippet.increment_usage()
        return Response({'usage_count': snippet.usage_count})


class WeatherLogViewSet(viewsets.ModelViewSet):
    """Weather log management"""
    queryset = WeatherLog.objects.all()
    serializer_class = WeatherLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = WeatherLog.objects.all()
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset.order_by('-date')
    
    def create(self, request, *args, **kwargs):
        """Override create to use update_or_create instead of create"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Extract project and date as unique key
        project_id = serializer.validated_data.get('project').id
        date = serializer.validated_data.get('date')
        
        # Use update_or_create to avoid unique constraint errors
        weather_log, created = WeatherLog.objects.update_or_create(
            project_id=project_id,
            date=date,
            defaults=serializer.validated_data
        )
        
        response_serializer = self.get_serializer(weather_log)
        headers = self.get_success_headers(response_serializer.data)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            headers=headers
        )


class ReminderViewSet(viewsets.ModelViewSet):
    """Reminder management"""
    queryset = Reminder.objects.all()
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Users can only see their own reminders"""
        queryset = Reminder.objects.filter(recipient=self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('trigger_date')
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending reminders for current user"""
        reminders = Reminder.objects.filter(
            recipient=request.user,
            status='pending',
            trigger_date__lte=timezone.now()
        ).order_by('trigger_date')[:10]
        serializer = self.get_serializer(reminders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss a reminder"""
        reminder = self.get_object()
        reminder.dismiss()
        return Response({'status': 'dismissed'})


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def analytics_dashboard_view(request):
    """Get analytics data for dashboard"""
    
    # Project stats
    total_projects = Project.objects.count()
    active_projects = Project.objects.filter(
        Q(end_date__isnull=True) | Q(end_date__gte=timezone.now().date())
    ).count()
    
    # Task stats
    total_tasks = Task.objects.count()
    completed_tasks = Task.objects.filter(status='completed').count()
    overdue_tasks = Task.objects.filter(
        status__in=['pending', 'in_progress'],
        due_date__lt=timezone.now().date()
    ).count()
    
    # Budget stats
    budgets = ProjectBudget.objects.all()
    rate = Decimal('1.96')
    # Normalize analytics to BGN
    total_budget = Decimal('0')
    for b in budgets:
        ib = Decimal(b.initial_budget)
        if b.currency == 'EUR':
            total_budget += (ib * rate)
        else:
            total_budget += ib
    # Sum all expenses converted to BGN based on their own currency
    total_spent = Decimal('0')
    for e in BudgetExpense.objects.all():
        amt = Decimal(e.amount)
        if e.expense_currency == 'EUR':
            total_spent += (amt * rate)
        else:
            total_spent += amt
    over_budget_count = sum(1 for b in budgets if b.is_over_budget)
    
    # Recent activity
    recent_projects = Project.objects.order_by('-created_at')[:5].values(
        'id', 'name', 'created_at', 'end_date'
    )
    
    # Top expense categories
    # Compute top categories with conversion to BGN
    cat_total_map = {}
    for e in BudgetExpense.objects.all():
        amt = Decimal(e.amount)
        amt_bgn = (amt * rate) if e.expense_currency == 'EUR' else amt
        cat_total_map[e.category] = cat_total_map.get(e.category, Decimal('0')) + amt_bgn
    top_categories = sorted(
        (
            {'category': k, 'total': float(v)}
            for k, v in cat_total_map.items()
        ),
        key=lambda x: x['total'],
        reverse=True
    )[:5]
    
    return Response({
        'projects': {
            'total': total_projects,
            'active': active_projects,
            'recent': list(recent_projects)
        },
        'tasks': {
            'total': total_tasks,
            'completed': completed_tasks,
            'overdue': overdue_tasks,
            'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        },
        'budget': {
            'total_budget': float(total_budget),
            'total_spent': float(total_spent),
            'remaining': float(total_budget - total_spent),
            'over_budget_projects': over_budget_count,
            # normalized to BGN
            'currency': 'BGN'
        },
        'top_expense_categories': list(top_categories)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fetch_weather_view(request):
    """Fetch weather data for a project and date"""
    project_id = request.data.get('project_id')
    date = request.data.get('date', timezone.now().date())
    
    if not project_id:
        return Response({'error': 'project_id required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if weather log already exists
    weather_log, created = WeatherLog.objects.get_or_create(
        project=project,
        date=date,
        defaults={
            'condition': 'Manual Entry',
            'api_source': 'manual'
        }
    )
    
    serializer = WeatherLogSerializer(weather_log)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def validate_bulgarian_id_view(request):
    """Validate Bulgarian identification numbers"""
    try:
        from core.utils.bulgarian_validators import (
            validate_bulstat, validate_vat_number, validate_personal_id
        )
        
        id_type = request.data.get('type')  # 'bulstat', 'vat', 'egn'
        value = request.data.get('value')
        
        if not id_type or not value:
            return Response(
                {'error': 'type and value required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validators = {
            'bulstat': validate_bulstat,
            'vat': validate_vat_number,
            'egn': validate_personal_id
        }
        
        validator = validators.get(id_type)
        if not validator:
            return Response(
                {'error': f'Invalid type. Use: {", ".join(validators.keys())}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        is_valid, message = validator(value)
        
        return Response({
            'valid': is_valid,
            'message': message,
            'type': id_type,
            'value': value
        })
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f"Error in validate_bulgarian_id_view: {error_msg}")
        print(error_trace)
        return Response(
            {
                'error': 'Error validating ID',
                'details': error_msg
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
