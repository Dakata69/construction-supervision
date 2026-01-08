from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from .serializers import DocumentSerializer, ProjectSerializer, TaskSerializer, ActSerializer, ActivityLogSerializer, UserSerializer
from .models import Document, Project, Task, Act, ActivityLog
from django.contrib.auth.models import User


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        from .utils.activity_logger import log_project_created
        project = serializer.save(created_by=self.request.user)
        log_project_created(project, self.request.user, self.request)
    
    def perform_update(self, serializer):
        from .utils.activity_logger import log_project_updated
        project = serializer.save()
        log_project_updated(project, self.request.user, self.request)


class TaskViewSet(viewsets.ModelViewSet):
    """Task management"""
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Task.objects.all()
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        from .utils.activity_logger import log_task_created
        task = serializer.save(created_by=self.request.user)
        log_task_created(task, self.request.user, self.request)
    
    def perform_update(self, serializer):
        from .utils.activity_logger import log_task_completed
        old_status = serializer.instance.status
        task = serializer.save()
        # Log when task status changes to completed
        if old_status != 'completed' and task.status == 'completed':
            log_task_completed(task, self.request.user, self.request)


class TeamViewSet(viewsets.ModelViewSet):
    """Placeholder for future team management - returns empty list"""
    queryset = Project.objects.none()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def list(self, request, *args, **kwargs):
        return Response([])


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




class ProjectDocumentViewSet(viewsets.ModelViewSet):
    """Placeholder for project-specific documents"""
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().order_by('-created_at')
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        from django.core.files import File
        from django.conf import settings
        import os, json, zipfile
        from .utils.document_generator import generate_document
        import logging
        
        logger = logging.getLogger(__name__)
        
        template_name = request.data.get('template_name')
        context = request.data.get('context', {})
        signatures = request.data.get('signatures', {})
        
        if not template_name:
            return Response(
                {'error': 'template_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            doc = Document.objects.create(
                title=template_name,
                created_at=None
            )
            docx_filename = f'{template_name}_{doc.id}.docx'
            pdf_filename = f'{template_name}_{doc.id}.pdf'
            zip_filename = f'{template_name}_{doc.id}.zip'
            doc_dir = os.path.join(
                settings.MEDIA_ROOT,
                'documents',
                str(doc.created_at.year),
                str(doc.created_at.month).zfill(2),
                str(doc.created_at.day).zfill(2)
            )
            os.makedirs(doc_dir, exist_ok=True)
            docx_path = os.path.join(doc_dir, docx_filename)
            pdf_path = os.path.join(doc_dir, pdf_filename)
            zip_path = os.path.join(doc_dir, zip_filename)

            logger.info(f'Generating document {docx_path} with context {context}')
            generate_document(template_name, context, docx_path, signatures=signatures)

            try:
                from .utils.pdf_export import convert_to_pdf
                convert_to_pdf(docx_path, pdf_path)
            except Exception as conv_err:
                logger.warning(f'PDF conversion failed: {conv_err}')
                pdf_path = None

            context_json_path = os.path.join(doc_dir, f'{template_name}_{doc.id}_context.json')
            with open(context_json_path, 'w', encoding='utf-8') as cj:
                json.dump(context, cj, ensure_ascii=False, indent=2)

            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.write(docx_path, arcname=docx_filename)
                if pdf_path and os.path.exists(pdf_path):
                    zf.write(pdf_path, arcname=pdf_filename)
                zf.write(context_json_path, arcname='context.json')

            with open(docx_path, 'rb') as f:
                doc.file_docx.save(docx_filename, File(f), save=False)
            if pdf_path and os.path.exists(pdf_path):
                with open(pdf_path, 'rb') as f:
                    doc.file_pdf.save(pdf_filename, File(f), save=False)
            with open(zip_path, 'rb') as f:
                doc.zip_file.save(zip_filename, File(f), save=True)

            return Response(DocumentSerializer(doc, context={'request': request}).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f'Document generation failed: {e}')
            if doc:
                doc.delete()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def generate_document_view(request):
    title = request.data.get('template_name', 'generated')
    doc = Document.objects.create(title=title)
    data = {
        'id': doc.id,
        'docx': f'/media/{doc.id}.docx',
        'pdf': f'/media/{doc.id}.pdf',
    }
    return Response(data, status=status.HTTP_201_CREATED)


class ActViewSet(viewsets.ModelViewSet):
    """Act generation and management for Acts 7, 14, 15."""
    queryset = Act.objects.all().order_by('-act_date', '-created_at')
    serializer_class = ActSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Act.objects.all()
        project_id = self.request.query_params.get('project')
        act_type = self.request.query_params.get('act_type')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if act_type:
            queryset = queryset.filter(act_type=act_type)
        return queryset.order_by('-act_date', '-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate act with DOCX and PDF outputs.
        Expects: project, act_type, act_date, and all relevant fields.
        """
        from django.core.files import File
        from django.conf import settings
        import os
        from .utils.document_generator import generate_document
        from .utils.pdf_export import convert_to_pdf
        from .utils.activity_logger import log_act_created
        import logging
        
        logger = logging.getLogger(__name__)
        
        data = request.data.copy()
        project_id = data.get('project')
        if project_id and not data.get('representative_builder'):
            try:
                from .models import Project
                proj = Project.objects.get(id=project_id)
                if proj.contractor:
                    data['representative_builder'] = proj.contractor
            except Exception:
                pass

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        act = serializer.save(created_by=request.user if request.user.is_authenticated else None)
        
        try:
            context = act.get_context()
            template_name = act.get_template_name()
            
            docx_filename = f'{act.act_type}_{act.id}.docx'
            pdf_filename = f'{act.act_type}_{act.id}.pdf'
            doc_dir = os.path.join(settings.MEDIA_ROOT, 'acts',
                                   str(act.created_at.year),
                                   str(act.created_at.month).zfill(2),
                                   str(act.created_at.day).zfill(2))
            
            docx_path = os.path.join(doc_dir, docx_filename)
            pdf_path = os.path.join(doc_dir, pdf_filename)
            
            os.makedirs(doc_dir, exist_ok=True)
            
            logger.info(f'Generating act {act.act_type} #{act.id} with template {template_name}')
            generate_document(template_name, context, docx_path)
            
            logger.info(f'Converting {docx_path} to PDF')
            convert_to_pdf(docx_path, pdf_path)
            
            import json, zipfile
            context_json_path = os.path.join(doc_dir, f'{act.act_type}_{act.id}_context.json')
            with open(context_json_path, 'w', encoding='utf-8') as cj:
                json.dump(context, cj, ensure_ascii=False, indent=2)

            zip_filename = f'{act.act_type}_{act.id}.zip'
            zip_path = os.path.join(doc_dir, zip_filename)
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.write(docx_path, arcname=docx_filename)
                zf.write(pdf_path, arcname=pdf_filename)
                zf.write(context_json_path, arcname='context.json')

            with open(docx_path, 'rb') as f:
                act.docx_file.save(docx_filename, File(f), save=False)
            with open(pdf_path, 'rb') as f:
                act.pdf_file.save(pdf_filename, File(f), save=False)
            with open(zip_path, 'rb') as f:
                act.zip_file.save(zip_filename, File(f), save=True)
            
            # Log activity
            log_act_created(act, request.user, request)
            
            return Response(self.get_serializer(act, context={'request': request}).data,
                            status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error(f'Act generation failed: {str(e)}')
            act.delete()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
