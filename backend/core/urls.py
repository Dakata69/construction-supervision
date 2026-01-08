from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    ProjectViewSet,
    TaskViewSet,
    TeamViewSet,
    ProjectDocumentViewSet,
    ActViewSet,
    ActivityLogViewSet,
    UserViewSet,
    upcoming_tasks_view,
    ProjectBudgetViewSet,
    BudgetExpenseViewSet,
    DocumentTemplateViewSet,
    TextSnippetViewSet,
    WeatherLogViewSet,
    ReminderViewSet,
    analytics_dashboard_view,
    fetch_weather_view,
    validate_bulgarian_id_view
)
from .views.users import (
    create_user_view,
    reset_password_view,
    request_password_reset_view,
    validate_reset_token_view,
    UserManagementViewSet
)
from .views.push import PushSubscribeView, PushUnsubscribeView

router = DefaultRouter()
router.register(r'documents', views.DocumentViewSet, basename='document')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'project-documents', ProjectDocumentViewSet, basename='project-document')
router.register(r'acts', ActViewSet, basename='act')
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-log')
router.register(r'budgets', ProjectBudgetViewSet, basename='budget')
router.register(r'expenses', BudgetExpenseViewSet, basename='expense')
router.register(r'templates', DocumentTemplateViewSet, basename='template')
router.register(r'snippets', TextSnippetViewSet, basename='snippet')
router.register(r'weather', WeatherLogViewSet, basename='weather')
router.register(r'reminders', ReminderViewSet, basename='reminder')
router.register(r'users', UserViewSet, basename='user')
router.register(r'user-management', UserManagementViewSet, basename='user-management')

urlpatterns = [
    path('documents/generate/', views.generate_document_view, name='documents-generate'),
    path('documents/upload/', views.upload_document_view, name='documents-upload'),
    path('push/subscribe/', PushSubscribeView.as_view(), name='push-subscribe'),
    path('push/unsubscribe/', PushUnsubscribeView.as_view(), name='push-unsubscribe'),
    path('tasks/upcoming/', upcoming_tasks_view, name='tasks-upcoming'),
    path('analytics/dashboard/', analytics_dashboard_view, name='analytics-dashboard'),
    path('weather/fetch/', fetch_weather_view, name='weather-fetch'),
    path('validate/bulgarian-id/', validate_bulgarian_id_view, name='validate-bulgarian-id'),
    path('auth/create-user/', create_user_view, name='auth-create-user'),
    path('auth/reset-password/', reset_password_view, name='auth-reset-password'),
    path('auth/request-password-reset/', request_password_reset_view, name='auth-request-password-reset'),
    path('auth/validate-reset-token/', validate_reset_token_view, name='auth-validate-reset-token'),
] + router.urls
