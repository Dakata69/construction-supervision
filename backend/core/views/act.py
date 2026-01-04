from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from ..serializers import ActSerializer
from ..models import Act


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
        from ..utils.document_generator import generate_document
        from ..utils.pdf_export import convert_to_pdf
        from ..utils.activity_logger import log_act_created
        import logging
        
        logger = logging.getLogger(__name__)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        act = serializer.save(created_by=request.user if self.request.user.is_authenticated else None)
        
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
            
            with open(docx_path, 'rb') as f:
                act.docx_file.save(docx_filename, File(f), save=False)
            with open(pdf_path, 'rb') as f:
                act.pdf_file.save(pdf_filename, File(f), save=True)
            
            # Log activity
            if request.user.is_authenticated:
                log_act_created(act, request.user, request)
            
            return Response(self.get_serializer(act, context={'request': request}).data,
                            status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error(f'Act generation failed: {str(e)}')
            act.delete()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
