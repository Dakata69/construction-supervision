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
        
        # Add custom claims
        if hasattr(user, 'profile'):
            token['role'] = user.profile.role
        else:
            token['role'] = 'privileged'
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user data to response
        data['user'] = UserSerializer(self.user).data
        
        return data


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
    
    # Validate role
    if role not in ['client', 'privileged', 'employee', 'admin']:
        return Response(
            {'error': 'Invalid role. Must be one of: client, privileged, employee, admin'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate username if not provided
    if custom_username:
        username = custom_username
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': f'Username "{username}" already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        # Generate unique username like PRIV-ABC123
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
    
    # Generate strong password
    password = ''.join(secrets.choice(string.ascii_letters + string.digits + string.punctuation) 
                      for _ in range(16))
    
    try:
        # Create user
        user = User.objects.create_user(
            username=username,
            password=password,
        )
        
        # Create profile with role
        UserProfile.objects.create(
            user=user,
            role=role
        )
        
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
