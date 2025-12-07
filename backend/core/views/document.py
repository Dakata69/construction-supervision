import os
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from ..models import Document
from ..serializers import DocumentSerializer
from ..utils.document_generator import generate_document, ensure_templates_dir, get_template_path
from ..utils.pdf_overlay import fill_pdf_template
import json
from ..utils.pdf_export import convert_to_pdf
from ..permissions import IsEmployeeOrAdmin

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_document_view(request):
    template_name = request.data.get('template_name')
    context = request.data.get('context', {})
    grid_override = request.data.get('grid', None)
    debug_names_override = request.data.get('debug_names', None)

    if not template_name:
        return Response({'error': 'template_name is required'}, status=status.HTTP_400_BAD_REQUEST)

    doc_name, ext = os.path.splitext(template_name)
    generated_dir = os.path.join(settings.MEDIA_ROOT, 'generated')
    os.makedirs(generated_dir, exist_ok=True)

    request_host = request.get_host()
    scheme = 'https' if request.is_secure() else 'http'
    base_url = f'{scheme}://{request_host}'

    docx_filename = f'{doc_name}.docx'
    docx_path = os.path.join(generated_dir, docx_filename)

    try:
        generate_document(template_name, context, docx_path)
    except Exception as e:
        return Response({'error': f'DOCX generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    doc_title = context.get('project_name', doc_name)
    document = Document.objects.create(
        title=f"{doc_title} - {doc_name}",
        file_docx=f'generated/{docx_filename}'
    )

    abs_docx = f'{base_url}{settings.MEDIA_URL}{document.file_docx}'

    return Response({
        'id': document.id,
        'title': document.title,
        'file_docx': abs_docx,
        'docx': abs_docx,
    })

@api_view(['POST'])
@permission_classes([IsEmployeeOrAdmin])
def upload_document_view(request):
    """Upload a document file (DOCX, PDF, or both)"""
    title = request.data.get('title')
    file_docx = request.FILES.get('file_docx')
    file_pdf = request.FILES.get('file_pdf')
    
    if not title:
        return Response({'error': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not file_docx and not file_pdf:
        return Response({'error': 'At least one file (DOCX or PDF) is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    document = Document.objects.create(
        title=title,
        file_docx=file_docx if file_docx else None,
        file_pdf=file_pdf if file_pdf else None
    )
    
    serializer = DocumentSerializer(document, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)
