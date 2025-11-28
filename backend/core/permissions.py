from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class IsAdminOrSupervisorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow GET, HEAD, OPTIONS requests (read-only)
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
            
        # Allow if user is admin or supervisor
        return request.user.is_staff or hasattr(request.user, 'supervisor')

class IsEmployeeOrAdmin(permissions.BasePermission):
    """Only employees and admins can edit"""
    def has_permission(self, request, view):
        # Allow GET, HEAD, OPTIONS requests (read-only)
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
            
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Check if user is admin (staff)
        if request.user.is_staff:
            return True
            
        # Check if user has profile and can edit
        if hasattr(request.user, 'profile'):
            return request.user.profile.can_edit()
        
        return False
