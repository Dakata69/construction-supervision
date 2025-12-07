from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Creates a superuser if none exists'

    def handle(self, *args, **options):
        if not User.objects.filter(username='daniel').exists():
            User.objects.create_superuser(
                username='daniel',
                email='daniel@example.com',
                password='password123'
            )
            self.stdout.write(self.style.SUCCESS('Superuser "daniel" created successfully'))
        else:
            self.stdout.write(self.style.WARNING('Superuser "daniel" already exists'))
