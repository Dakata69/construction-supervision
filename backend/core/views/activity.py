from rest_framework import viewsets
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from core.models import ActivityLog, Task
from core.serializers import ActivityLogSerializer, TaskSerializer


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Activity log for dashboard - read only"""
    queryset = ActivityLog.objects.all().order_by('-created_at')
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = ActivityLog.objects.all()
        # Optional: filter by user
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        # Optional: limit results for dashboard
        limit = self.request.query_params.get('limit')
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except (ValueError, TypeError):
                pass
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent activities (last 10 by default)"""
        limit = int(request.query_params.get('limit', 10))
        logs = self.get_queryset()[:limit]
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def upcoming_tasks_view(request):
    """Get upcoming tasks (pending/in-progress with due dates)"""
    from django.utils import timezone
    from datetime import timedelta
    
    limit = int(request.query_params.get('limit', 10))
    days_ahead = int(request.query_params.get('days', 30))
    
    now = timezone.now()
    future_date = now + timedelta(days=days_ahead)
    
    tasks = Task.objects.filter(
        status__in=['pending', 'in_progress'],
        due_date__isnull=False,
        due_date__lte=future_date,
        due_date__gte=now
    ).order_by('due_date')[:limit]
    
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)
