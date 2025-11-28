from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Project, Document, Task, Act, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role']


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'role']
    
    def get_role(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.role
        return 'privileged'  # Default role


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'project', 'title', 'description', 'status', 'priority', 
                  'assigned_to', 'assigned_to_name', 'due_date', 'completed_at', 
                  'created_at', 'updated_at', 'created_by']
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'completed_at')


class ProjectSerializer(serializers.ModelSerializer):
    location = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    client = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)
    supervisor = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)
    contractor = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    # Act 7 extra fields
    act7_date = serializers.DateField(required=False, allow_null=True)
    consultant_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    representative_builder = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    supervisor_name_text = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    designer_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    level_from = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    level_to = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    work_description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    execution = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    progress = serializers.IntegerField(required=False, min_value=0, max_value=100)
    progress_percentage = serializers.FloatField(read_only=True)
    client_name = serializers.CharField(source='client.username', read_only=True)
    supervisor_name = serializers.CharField(source='supervisor.username', read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'location', 'client', 'client_name', 'supervisor', 'supervisor_name', 'contractor', 'status', 'progress', 'progress_percentage', 'start_date', 'end_date', 'act7_date', 'consultant_name', 'representative_builder', 'supervisor_name_text', 'designer_name', 'level_from', 'level_to', 'work_description', 'execution', 'notes', 'created_at', 'updated_at']
        read_only_fields = ('created_at', 'updated_at', 'progress_percentage', 'client_name', 'supervisor_name')


class DocumentSerializer(serializers.ModelSerializer):
    file_docx = serializers.SerializerMethodField()
    file_pdf = serializers.SerializerMethodField()
    zip_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file_docx', 'file_pdf', 'zip_url',
            'created_at', 'updated_at'
        ]
    
    def get_file_docx(self, obj):
        if obj.file_docx:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file_docx.url)
            return obj.file_docx.url
        return None
    
    def get_file_pdf(self, obj):
        if obj.file_pdf:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file_pdf.url)
            return obj.file_pdf.url
        return None

    def get_zip_url(self, obj):
        if obj.zip_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.zip_file.url)
            return obj.zip_file.url
        return None


class ActSerializer(serializers.ModelSerializer):
    """Serializer for Act model with all fields for generation."""
    docx_url = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()
    zip_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Act
        fields = [
            'id', 'project', 'act_type', 'act_number', 'act_date',
            'representative_builder', 'representative_supervision', 'representative_designer',
            'level_from', 'level_to', 'work_description', 'concrete_class', 'concrete_work',
            'referenced_acts', 'quality_protocols', 'conclusion_text',
            'all_designers', 'all_supervision', 'referenced_documents',
            'findings_permits', 'findings_execution', 'findings_site', 'decision_text',
            'docx_file', 'pdf_file', 'zip_file', 'docx_url', 'pdf_url', 'zip_url',
            'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ('docx_file', 'pdf_file', 'zip_file', 'created_at', 'updated_at', 'created_by', 'docx_url', 'pdf_url', 'zip_url')
    
    def get_docx_url(self, obj):
        if obj.docx_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.docx_file.url)
        return None
    
    def get_pdf_url(self, obj):
        if obj.pdf_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
        return None

    def get_zip_url(self, obj):
        if obj.zip_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.zip_file.url)
        return None
