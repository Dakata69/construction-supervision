# Импорти за REST API функционалност
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Project, Task, Document
from ..serializers import ProjectSerializer, TaskSerializer, DocumentSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet за управление на проекти.
    Предоставя CRUD операции и допълнителни действия за свързване на документи.
    """
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Връща всички проекти, сортирани по дата на създаване (най-новите първи)"""
        queryset = Project.objects.all().order_by('-created_at')
        return queryset

    def perform_create(self, serializer):
        """
        Създава нов проект и логва действието.
        Извиква се автоматично при POST заявка.
        """
        from ..utils.activity_logger import log_project_created
        if self.request.user.is_authenticated:
            project = serializer.save()
            log_project_created(project, self.request.user, self.request)
    
    def perform_update(self, serializer):
        """
        Обновява съществуващ проект и логва промените.
        Извиква се автоматично при PUT/PATCH заявка.
        """
        from ..utils.activity_logger import log_project_updated
        project = serializer.save()
        if self.request.user.is_authenticated:
            log_project_updated(project, self.request.user, self.request)
    
    @action(detail=True, methods=['get'])
    def linked_documents(self, request, pk=None):
        """
        Връща всички документи, свързани с този проект.
        GET /api/projects/{id}/linked_documents/
        """
        project = self.get_object()
        documents = project.linked_documents.all()
        serializer = DocumentSerializer(documents, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def link_document(self, request, pk=None):
        """
        Свързва съществуващ документ с този проект.
        POST /api/projects/{id}/link_document/
        Body: {"document_id": 123}
        """
        project = self.get_object()
        document_id = request.data.get('document_id')
        
        if not document_id:
            return Response(
                {'error': 'document_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            document = Document.objects.get(id=document_id)
            # Добавя документа към many-to-many връзката
            project.linked_documents.add(document)
            return Response({'success': True, 'message': 'Document linked to project'})
        except Document.DoesNotExist:
            return Response(
                {'error': 'Document not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def unlink_document(self, request, pk=None):
        """
        Премахва връзката между документ и проект.
        POST /api/projects/{id}/unlink_document/
        Body: {"document_id": 123}
        """
        project = self.get_object()
        document_id = request.data.get('document_id')
        
        if not document_id:
            return Response(
                {'error': 'document_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
       
    ViewSet за управление на задачи.
    Поддържа филтриране по проект чрез query параметър.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """
        Връща задачи, опционално филтрирани по проект.
        Query параметър: ?project=123
        """
        queryset = Task.objects.all()
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Записва създателя на задачата автоматично"""
        serializer.save(created_by=self.request.user)


class TeamViewSet(viewsets.ModelViewSet):
    """
    Заместител за бъдещо управление на екипи.
    Засега връща празен списък - функционалността не е имплементирана.
    """
    queryset = Project.objects.none()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def list(self, request, *args, **kwargs):
        """Връща празен списък докато функционалността не бъде добавена"""
        return Response([])


class ProjectDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet за документи, свързани с проекти.
    Поддържа филтриране по проект.
    """
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """
        Връща документи, опционално филтрирани по проект.
        Query параметър: ?project=123
        """ectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def list(self, request, *args, **kwargs):
        return Response([])


class ProjectDocumentViewSet(viewsets.ModelViewSet):
    """Documents related to projects"""
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Document.objects.all()
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset.order_by('-created_at')
