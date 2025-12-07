from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserProfile

class Command(BaseCommand):
    help = 'Creates a superuser if none exists'

    def handle(self, *args, **options):
        if not User.objects.filter(username='daniel').exists():
            user = User.objects.create_superuser(
                username='daniel',
                email='daniel@example.com',
                password='password123'
            )
            # Create admin profile
            UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': 'admin'}
            )
            self.stdout.write(self.style.SUCCESS('Superuser "daniel" created successfully with admin role'))
        else:
            # Update existing user to have admin profile
            user = User.objects.get(username='daniel')
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': 'admin'}
            )
            if not created and profile.role != 'admin':
                profile.role = 'admin'
                profile.save()
                self.stdout.write(self.style.SUCCESS('Updated "daniel" profile to admin role'))
            else:
                self.stdout.write(self.style.WARNING('Superuser "daniel" already exists with correct role'))
