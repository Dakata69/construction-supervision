from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .serializers import UserSerializer
from .models import UserProfile
import secrets
import string


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that includes user role"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Ensure user has a profile
        if not hasattr(user, 'profile'):
            from .models import UserProfile
            UserProfile.objects.get_or_create(user=user)
        
        token['role'] = user.profile.role if hasattr(user, 'profile') else 'privileged'
        
        return token
    
    def validate(self, attrs):
        from .utils.activity_logger import log_user_login
        
        try:
            data = super().validate(attrs)
            
            # Ensure user has a profile before serialization
            if not hasattr(self.user, 'profile'):
                from .models import UserProfile
                UserProfile.objects.get_or_create(user=self.user)
            
            data['user'] = UserSerializer(self.user).data
            
            # Log the login
            if hasattr(self, 'context') and 'request' in self.context:
                log_user_login(self.user, self.context['request'])
            
            return data
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Login error for user {attrs.get('username', 'unknown')}: {str(e)}")
            raise


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """Get current user information including role"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_privileged_user_view(request):
    """Create a privileged user with auto-generated credentials (Admin only)"""
    role = request.data.get('role', 'privileged')
    custom_username = request.data.get('username', None)
    
    if role not in ['client', 'privileged', 'employee', 'admin']:
        return Response(
            {'error': 'Invalid role. Must be one of: client, privileged, employee, admin'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if custom_username:
        username = custom_username
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': f'Username "{username}" already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        prefix = 'PRIV' if role == 'privileged' else role.upper()[:4]
        max_attempts = 10
        for _ in range(max_attempts):
            random_part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
            username = f"{prefix}-{random_part}"
            if not User.objects.filter(username=username).exists():
                break
        else:
            return Response(
                {'error': 'Failed to generate unique username'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    password = ''.join(secrets.choice(string.ascii_letters + string.digits + string.punctuation) 
                      for _ in range(16))
    
    try:
        from .utils.activity_logger import log_user_created
        
        user = User.objects.create_user(
            username=username,
            password=password,
        )
        
        UserProfile.objects.create(
            user=user,
            role=role
        )
        
        # Log activity
        log_user_created(username, request.user, request)
        
        return Response({
            'success': True,
            'username': username,
            'password': password,
            'role': role,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to create user: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
