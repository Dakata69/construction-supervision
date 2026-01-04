from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Task, PushSubscription
from core.utils.push import send_web_push


class Command(BaseCommand):
    help = 'Send web push notifications for upcoming task deadlines'

    def handle(self, *args, **options):
        now = timezone.now()
        today = now.date()

        # Consider tasks with due_date set and not completed
        tasks = Task.objects.filter(due_date__isnull=False).exclude(status='completed')

        milestones = [7, 3, 1, 0]
        sent = 0
        for t in tasks:
            if not t.due_date:
                continue
            due_date = t.due_date.date()
            delta_days = (due_date - today).days

            to_notify = None
            if delta_days in milestones:
                to_notify = f'Предстоящ срок след {delta_days} дни' if delta_days > 0 else 'Срокът е днес'
            elif delta_days < 0:
                to_notify = f'Просрочена задача с {abs(delta_days)} дни'

            if not to_notify:
                continue

            if not t.assigned_to_id:
                continue

            subs = PushSubscription.objects.filter(user_id=t.assigned_to_id)
            for s in subs:
                sub_info = {
                    'endpoint': s.endpoint,
                    'keys': {'p256dh': s.p256dh, 'auth': s.auth},
                }
                try:
                    send_web_push(
                        sub_info,
                        title='Срок за задача',
                        body=f'{t.title}: {to_notify}',
                        url=f'/projects/{t.project_id}',
                        tag=f'task-{t.id}',
                    )
                    sent += 1
                except Exception:
                    # Best-effort; continue with others
                    continue

        self.stdout.write(self.style.SUCCESS(f'Sent {sent} notifications'))
