from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserProfile
import secrets
import string


class Command(BaseCommand):
    help = 'Create a privileged user with auto-generated credentials'

    def add_arguments(self, parser):
        parser.add_argument('--role', type=str, default='privileged',
                          choices=['privileged', 'admin'],
                          help='User role (default: privileged)')
        parser.add_argument('--username', type=str, help='Custom username (optional)')

    def handle(self, *args, **options):
        role = options['role']
        
        if options['username']:
            username = options['username']
        else:
            prefix = 'PRIV' if role == 'privileged' else role.upper()[:4]
            random_part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
            username = f"{prefix}-{random_part}"
        
        password = ''.join(secrets.choice(string.ascii_letters + string.digits + string.punctuation) 
                          for _ in range(16))
        
        try:
            user = User.objects.create_user(
                username=username,
                password=password,
            )
            
            UserProfile.objects.create(
                user=user,
                role=role
            )
            
            self.stdout.write(self.style.SUCCESS(
                f'\n{"="*60}\n'
                f'Successfully created {role} user\n'
                f'{"="*60}\n'
                f'Username: {username}\n'
                f'Password: {password}\n'
                f'Role: {role}\n'
                f'{"="*60}\n'
                f'\nPlease save these credentials securely!\n'
                f'The password cannot be recovered.\n'
            ))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating user: {e}'))
