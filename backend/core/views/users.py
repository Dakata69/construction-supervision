from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.utils import timezone

from core.models import UserProfile, PasswordResetToken
from core.serializers import (
    UserSerializer, CreateUserSerializer, 
    PasswordResetSerializer, PasswordResetRequestSerializer,
    SetCredentialsSerializer,
)
from core.utils.email_sender import send_credentials_email, send_password_reset_email


class IsPrivilegedUser(IsAuthenticated):
    """Permission to check if user has canEdit (privileged) access"""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        try:
            # Ensure user has a profile
            if not hasattr(request.user, 'profile'):
                UserProfile.objects.get_or_create(user=request.user)
            return request.user.profile.role in ['privileged', 'admin']
        except Exception as e:
            return False


@api_view(['POST'])
@permission_classes([IsPrivilegedUser])
def create_user_view(request):
    """Create a new user and send credentials email with username and temporary password"""
    serializer = CreateUserSerializer(data=request.data)
    if serializer.is_valid():
        result = serializer.save()
        user = result['user']
        temp_password = result['temporary_password']
        reset_token = result.get('reset_token')
        
        try:
            # Send consolidated email with username, temporary password and setup link
            send_credentials_email(user, temp_password, reset_token=reset_token)
            
            return Response({
                'message': 'User created successfully. Credentials have been sent to their email.',
                'user': UserSerializer(user).data,
                'email_sent': True
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            # User created but email failed
            return Response({
                'message': f'User created but email delivery failed: {str(e)}',
                'user': UserSerializer(user).data,
                'email_sent': False
            }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    """Reset user password using reset token"""
    serializer = PasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            return Response({
                'message': 'Password has been reset successfully. You can now login with your new password.',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset_view(request):
    """Request a password reset email"""
    import logging
    logger = logging.getLogger('core')
    
    serializer = PasswordResetRequestSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        logger.info(f"Password reset requested for email: {email}")
        try:
            user = User.objects.get(email=email)
            logger.info(f"User found for email {email}: {user.username}")
            reset_token = PasswordResetToken.create_token(user)
            logger.info(f"Reset token created: {reset_token.token[:20]}...")
            
            try:
                send_password_reset_email(user, reset_token)
                logger.info(f"Password reset email sent successfully to {email}")
                return Response({
                    'message': 'If an account with that email exists, a password reset link has been sent.'
                }, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Failed to send password reset email: {str(e)}", exc_info=True)
                return Response({
                    'message': 'Password reset requested but email delivery failed. Please contact support.',
                    'error': str(e)
                }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            logger.info(f"No user found with email {email} (security: not revealing to client)")
            # Don't reveal if email exists or not
            return Response({
                'message': 'If an account with that email exists, a password reset link has been sent.'
            }, status=status.HTTP_200_OK)
    
    logger.error(f"Invalid request data: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def validate_reset_token_view(request):
    """Validate if a password reset token is still valid"""
    token = request.query_params.get('token')
    
    if not token:
        return Response({
            'valid': False,
            'message': 'Token parameter is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        reset_token = PasswordResetToken.objects.get(token=token)
        is_valid = reset_token.is_valid()
        
        return Response({
            'valid': is_valid,
            'message': 'Token is valid' if is_valid else 'Token is invalid or expired'
        }, status=status.HTTP_200_OK)
    except PasswordResetToken.DoesNotExist:
        return Response({
            'valid': False,
            'message': 'Token not found'
        }, status=status.HTTP_200_OK)


class UserManagementViewSet(viewsets.ModelViewSet):
    """List and manage users (privileged users only)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsPrivilegedUser]
    
    def get_queryset(self):
        """Return all users"""
        return User.objects.all().order_by('username')
    
    @action(detail=True, methods=['post'])
    def resend_credentials(self, request, pk=None):
        """Resend credentials email to a user"""
        user = self.get_object()
        try:
            # Generate temporary password and send consolidated credentials email
            import secrets
            temp_password = secrets.token_urlsafe(12)

            # Set the new temporary password
            user.set_password(temp_password)
            user.save()
            
            # Create a fresh token for setup link
            reset_token = PasswordResetToken.create_token(user)

            send_credentials_email(user, temp_password, reset_token=reset_token)
            
            return Response({
                'message': 'Credentials email has been resent successfully.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': f'Failed to send email: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def reset_user_password(self, request, pk=None):
        """Force password reset for a user (requires them to reset via email)"""
        user = self.get_object()
        try:
            reset_token = PasswordResetToken.create_token(user)
            send_password_reset_email(user, reset_token)
            
            return Response({
                'message': 'Password reset link has been sent to user email.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': f'Failed to send email: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def set_credentials_view(request):
    """Set both username and password using a one-time token"""
    serializer = SetCredentialsSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            return Response({
                'message': 'Credentials updated successfully. You can now sign in with your new username and password.',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a user completely (cannot undo)"""
        user = self.get_object()
        username = user.username
        
        # Prevent deleting the current user
        if user == request.user:
            return Response({
                'error': 'Cannot delete your own account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete the user (this will also delete the profile due to OneToOneField)
        user.delete()
        
        return Response({
            'message': f'User {username} has been permanently deleted.'
        }, status=status.HTTP_200_OK)
