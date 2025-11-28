from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from .serializers import DocumentSerializer, ProjectSerializer, TaskSerializer, ActSerializer
from .models import Document, Project, Task, Act


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


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
        serializer.save(created_by=self.request.user)


class TeamViewSet(viewsets.ModelViewSet):
    """Placeholder for future team management - returns empty list"""
    queryset = Project.objects.none()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def list(self, request, *args, **kwargs):
        # Return empty list instead of causing errors
        return Response([])


class ProjectDocumentViewSet(viewsets.ModelViewSet):
    """Placeholder for project-specific documents"""
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().order_by('-created_at')
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # Allow GET requests without authentication

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
        
        # Get parameters from request
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
                created_at=None  # will be auto-set
            )
            # Prepare paths
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

            # Generate DOCX
            logger.info(f'Generating document {docx_path} with context {context}')
            generate_document(template_name, context, docx_path, signatures=signatures)

            # Optional PDF conversion if utility exists
            try:
                from .utils.pdf_export import convert_to_pdf
                convert_to_pdf(docx_path, pdf_path)
            except Exception as conv_err:
                logger.warning(f'PDF conversion failed: {conv_err}')
                pdf_path = None

            # Write context.json
            context_json_path = os.path.join(doc_dir, f'{template_name}_{doc.id}_context.json')
            with open(context_json_path, 'w', encoding='utf-8') as cj:
                json.dump(context, cj, ensure_ascii=False, indent=2)

            # Build zip
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.write(docx_path, arcname=docx_filename)
                if pdf_path and os.path.exists(pdf_path):
                    zf.write(pdf_path, arcname=pdf_filename)
                zf.write(context_json_path, arcname='context.json')

            # Save files
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
    # Keep for backward compatibility
    # Minimal stub: create a Document instance and return paths
    title = request.data.get('template_name', 'generated')
    doc = Document.objects.create(title=title)
    # In a real app, you'd run document_generator and pdf export here
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
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Auto-fill representative_builder if blank using project contractor
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

        # Validate and create Act instance
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        act = serializer.save(created_by=request.user if request.user.is_authenticated else None)
        
        try:
            # Prepare context from act
            context = act.get_context()
            template_name = act.get_template_name()
            
            # Prepare paths
            docx_filename = f'{act.act_type}_{act.id}.docx'
            pdf_filename = f'{act.act_type}_{act.id}.pdf'
            doc_dir = os.path.join(settings.MEDIA_ROOT, 'acts',
                                   str(act.created_at.year),
                                   str(act.created_at.month).zfill(2),
                                   str(act.created_at.day).zfill(2))
            
            docx_path = os.path.join(doc_dir, docx_filename)
            pdf_path = os.path.join(doc_dir, pdf_filename)
            
            # Ensure directory exists
            os.makedirs(doc_dir, exist_ok=True)
            
            # Generate DOCX
            logger.info(f'Generating act {act.act_type} #{act.id} with template {template_name}')
            generate_document(template_name, context, docx_path)
            
            # Convert to PDF
            logger.info(f'Converting {docx_path} to PDF')
            convert_to_pdf(docx_path, pdf_path)
            
            # Build context.json
            import json, zipfile
            context_json_path = os.path.join(doc_dir, f'{act.act_type}_{act.id}_context.json')
            with open(context_json_path, 'w', encoding='utf-8') as cj:
                json.dump(context, cj, ensure_ascii=False, indent=2)

            # Zip archive
            zip_filename = f'{act.act_type}_{act.id}.zip'
            zip_path = os.path.join(doc_dir, zip_filename)
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.write(docx_path, arcname=docx_filename)
                zf.write(pdf_path, arcname=pdf_filename)
                zf.write(context_json_path, arcname='context.json')

            # Save files to model
            with open(docx_path, 'rb') as f:
                act.docx_file.save(docx_filename, File(f), save=False)
            with open(pdf_path, 'rb') as f:
                act.pdf_file.save(pdf_filename, File(f), save=False)
            with open(zip_path, 'rb') as f:
                act.zip_file.save(zip_filename, File(f), save=True)
            
            # Return updated serializer with URLs
            return Response(self.get_serializer(act, context={'request': request}).data,
                            status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error(f'Act generation failed: {str(e)}')
            act.delete()  # Clean up failed act
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
