from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Project, Document, Task, Act, UserProfile, PushSubscription, ActivityLog,
    ProjectBudget, BudgetExpense, DocumentTemplate, TextSnippet, WeatherLog, Reminder
)


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
        try:
            if hasattr(obj, 'profile'):
                return obj.profile.role
            # Create profile if it doesn't exist
            profile, created = UserProfile.objects.get_or_create(user=obj)
            return profile.role
        except Exception:
            return 'privileged'


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Task
        fields = ['id', 'project', 'title', 'description', 'status', 'priority', 
                  'assigned_to', 'assigned_to_name', 'due_date', 'completed_at', 
                  'created_at', 'updated_at', 'created_by']
        read_only_fields = ('created_at', 'updated_at', 'created_by', 'completed_at', 'assigned_to')
    
    def to_representation(self, instance):
        """Customize the output to ensure assigned_to_name is always returned"""
        representation = super().to_representation(instance)
        # If assigned_to_name is empty but assigned_to exists, use username
        if not representation.get('assigned_to_name') and instance.assigned_to:
            representation['assigned_to_name'] = instance.assigned_to.username
        return representation


class ProjectSerializer(serializers.ModelSerializer):
    location = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    client = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)
    supervisor = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)
    contractor = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
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


class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ['id', 'endpoint', 'p256dh', 'auth', 'created_at']
        read_only_fields = ['id', 'created_at']
    
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


class ActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_type_display', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'username', 'action_type', 'action_display', 
                  'description', 'content_type', 'object_id', 'metadata', 
                  'created_at']
        read_only_fields = ['id', 'created_at']


class BudgetExpenseSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = BudgetExpense
        fields = ['id', 'budget', 'category', 'category_display', 'description', 
                  'amount', 'date', 'invoice_number', 'vendor', 'expense_currency', 'notes',
                  'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class ProjectBudgetSerializer(serializers.ModelSerializer):
    expenses = BudgetExpenseSerializer(many=True, read_only=True)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_budget = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    budget_usage_percentage = serializers.FloatField(read_only=True)
    is_over_budget = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ProjectBudget
        fields = ['id', 'project', 'initial_budget', 'currency', 'notes',
                  'total_expenses', 'remaining_budget', 'budget_usage_percentage',
                  'is_over_budget', 'expenses', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        # Prevent creating a second budget for the same project
        project = attrs.get('project')
        if project and self.instance is None:
            from .models import ProjectBudget as PB
            if PB.objects.filter(project=project).exists():
                raise serializers.ValidationError({
                    'project': 'Бюджет за този проект вече съществува'
                })
        return attrs


class DocumentTemplateSerializer(serializers.ModelSerializer):
    template_type_display = serializers.CharField(source='get_template_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = DocumentTemplate
        fields = ['id', 'name', 'template_type', 'template_type_display', 
                  'description', 'default_content', 'template_file', 'is_active',
                  'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class TextSnippetSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = TextSnippet
        fields = ['id', 'title', 'category', 'category_display', 'content', 
                  'tags', 'usage_count', 'is_active', 'created_by', 
                  'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at', 'created_by']


class WeatherLogSerializer(serializers.ModelSerializer):
    is_unfavorable = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = WeatherLog
        fields = ['id', 'project', 'date', 'temperature_min', 'temperature_max',
                  'condition', 'precipitation', 'wind_speed', 'humidity',
                  'work_stopped', 'impact_notes', 'is_unfavorable',
                  'api_source', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ReminderSerializer(serializers.ModelSerializer):
    reminder_type_display = serializers.CharField(source='get_reminder_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    recipient_name = serializers.CharField(source='recipient.username', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True)
    task_title = serializers.CharField(source='task.title', read_only=True, allow_null=True)
    
    class Meta:
        model = Reminder
        fields = ['id', 'reminder_type', 'reminder_type_display', 'title', 
                  'message', 'project', 'project_name', 'task', 'task_title',
                  'trigger_date', 'sent_at', 'recipient', 'recipient_name',
                  'status', 'status_display', 'push_sent', 'created_at', 'updated_at']
        read_only_fields = ['id', 'sent_at', 'created_at', 'updated_at']


class CreateUserSerializer(serializers.Serializer):
    """Serializer for creating new users by admin users"""
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    role = serializers.ChoiceField(
        choices=['privileged', 'admin'],
        default='privileged'
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered')
        return value

    def create(self, validated_data):
        import secrets
        from .models import UserProfile, PasswordResetToken
        
        # Generate random password
        temp_password = secrets.token_urlsafe(12)
        
        # Create user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=temp_password
        )
        
        # Create user profile with role
        UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': validated_data.get('role', 'viewer')}
        )
        
        # Create password reset token for user to set their own password
        reset_token = PasswordResetToken.create_token(user)
        
        return {
            'user': user,
            'temporary_password': temp_password,
            'reset_token': reset_token
        }


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for resetting password with token"""
    token = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, min_length=8, required=True)
    password_confirm = serializers.CharField(write_only=True, min_length=8, required=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return attrs

    def save(self, **kwargs):
        from .models import PasswordResetToken
        
        token_str = self.validated_data['token']
        try:
            reset_token = PasswordResetToken.objects.get(token=token_str)
            if not reset_token.is_valid():
                raise serializers.ValidationError('Password reset token is invalid or expired')
            
            user = reset_token.user
            user.set_password(self.validated_data['password'])
            user.save()
            
            reset_token.mark_used()
            
            return user
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError('Invalid password reset token')


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting password reset"""
    email = serializers.EmailField(required=True)
