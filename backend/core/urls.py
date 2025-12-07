from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    ProjectViewSet,
    TaskViewSet,
    TeamViewSet,
    ProjectDocumentViewSet,
    ActViewSet
)

router = DefaultRouter()
router.register(r'documents', views.DocumentViewSet, basename='document')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'project-documents', ProjectDocumentViewSet, basename='project-document')
router.register(r'acts', ActViewSet, basename='act')

urlpatterns = [
    path('documents/generate/', views.generate_document_view, name='documents-generate'),
    path('documents/upload/', views.upload_document_view, name='documents-upload'),
] + router.urls
