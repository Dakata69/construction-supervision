from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserProfile


class Command(BaseCommand):
    help = 'Create UserProfile for all users that don\'t have one'

    def handle(self, *args, **options):
        users_without_profile = []
        
        for user in User.objects.all():
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': 'admin' if user.is_superuser else 'privileged'}
            )
            if created:
                users_without_profile.append(user.username)
                self.stdout.write(
                    self.style.SUCCESS(f'Created profile for user: {user.username} (role: {profile.role})')
                )
        
        if not users_without_profile:
            self.stdout.write(self.style.SUCCESS('All users already have profiles'))
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\nCreated profiles for {len(users_without_profile)} users')
            )
