from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Task, Project, Reminder


class Command(BaseCommand):
    help = 'Generate automatic reminders for tasks and projects'

    def handle(self, *args, **options):
        created_count = 0
        
        # Task reminders (1 day before due date)
        upcoming_tasks = Task.objects.filter(
            status__in=['pending', 'in_progress'],
            due_date__isnull=False,
            due_date__gte=timezone.now(),
            due_date__lte=timezone.now() + timedelta(days=2)
        )
        
        for task in upcoming_tasks:
            # Check if reminder already exists
            existing = Reminder.objects.filter(
                task=task,
                reminder_type='task_due',
                status='pending'
            ).exists()
            
            if not existing:
                reminder = Reminder.create_task_reminder(task, days_before=1)
                if reminder:
                    created_count += 1
                    self.stdout.write(f'Created reminder for task: {task.title}')
        
        # Project deadline reminders (7 days before)
        upcoming_projects = Project.objects.filter(
            end_date__isnull=False,
            end_date__gte=timezone.now().date(),
            end_date__lte=(timezone.now() + timedelta(days=8)).date()
        )
        
        for project in upcoming_projects:
            existing = Reminder.objects.filter(
                project=project,
                reminder_type='project_deadline',
                status='pending'
            ).exists()
            
            if not existing:
                reminder = Reminder.create_project_deadline_reminder(project, days_before=7)
                if reminder:
                    created_count += 1
                    self.stdout.write(f'Created reminder for project: {project.name}')
        
        self.stdout.write(self.style.SUCCESS(f'Created {created_count} reminders'))
