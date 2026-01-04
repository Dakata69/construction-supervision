"""
Utility functions for logging user activities throughout the application
"""
from core.models import ActivityLog


def get_client_ip(request):
    """Extract client IP from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_project_created(project, user, request=None):
    """Log when a new project is created"""
    ActivityLog.log_activity(
        action_type='project_created',
        description=f'Създаден нов проект "{project.name}"',
        user=user,
        content_type='project',
        object_id=project.id,
        metadata={
            'project_name': project.name,
            'project_id': project.id,
        },
        ip_address=get_client_ip(request) if request else None
    )


def log_project_updated(project, user, request=None):
    """Log when a project is updated"""
    ActivityLog.log_activity(
        action_type='project_updated',
        description=f'Актуализиран проект "{project.name}"',
        user=user,
        content_type='project',
        object_id=project.id,
        metadata={
            'project_name': project.name,
            'project_id': project.id,
        },
        ip_address=get_client_ip(request) if request else None
    )


def log_document_generated(document_type, project_name, user, request=None):
    """Log when a document is generated"""
    ActivityLog.log_activity(
        action_type='document_generated',
        description=f'Генериран {document_type} за "{project_name}"',
        user=user,
        content_type='document',
        metadata={
            'document_type': document_type,
            'project_name': project_name,
        },
        ip_address=get_client_ip(request) if request else None
    )


def log_act_created(act, user, request=None):
    """Log when an act is created"""
    act_type = f"Акт {act.act_number}" if hasattr(act, 'act_number') else "Акт"
    ActivityLog.log_activity(
        action_type='act_created',
        description=f'Създаден {act_type} за проект "{act.project.name}"',
        user=user,
        content_type='act',
        object_id=act.id,
        metadata={
            'act_id': act.id,
            'project_name': act.project.name,
        },
        ip_address=get_client_ip(request) if request else None
    )


def log_task_created(task, user, request=None):
    """Log when a task is created"""
    ActivityLog.log_activity(
        action_type='task_created',
        description=f'Създадена задача "{task.title}"',
        user=user,
        content_type='task',
        object_id=task.id,
        metadata={
            'task_title': task.title,
            'project_name': task.project.name if hasattr(task, 'project') else None,
        },
        ip_address=get_client_ip(request) if request else None
    )


def log_task_completed(task, user, request=None):
    """Log when a task is completed"""
    ActivityLog.log_activity(
        action_type='task_completed',
        description=f'Завършена задача "{task.title}"',
        user=user,
        content_type='task',
        object_id=task.id,
        metadata={
            'task_title': task.title,
            'project_name': task.project.name if hasattr(task, 'project') else None,
        },
        ip_address=get_client_ip(request) if request else None
    )


def log_user_created(username, user, request=None):
    """Log when a new user is created"""
    ActivityLog.log_activity(
        action_type='user_created',
        description=f'Добавен нов потребител "{username}"',
        user=user,
        content_type='user',
        metadata={
            'username': username,
        },
        ip_address=get_client_ip(request) if request else None
    )


def log_user_login(user, request=None):
    """Log when a user logs in"""
    ActivityLog.log_activity(
        action_type='user_login',
        description=f'Вход в системата',
        user=user,
        metadata={
            'username': user.username,
        },
        ip_address=get_client_ip(request) if request else None
    )
