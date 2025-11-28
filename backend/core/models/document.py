from django.db import models
from django.utils import timezone

class Document(models.Model):
    title = models.CharField(max_length=200)
    file_docx = models.FileField(upload_to='documents/docx/', null=True, blank=True)
    file_pdf = models.FileField(upload_to='documents/pdf/', null=True, blank=True)
    zip_file = models.FileField(upload_to='documents/zip/', null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return self.title