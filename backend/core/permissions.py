from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class IsAdminOrSupervisorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
            
        if not request.user.is_authenticated:
            return False
            
        return request.user.is_staff or hasattr(request.user, 'supervisor')

class IsEmployeeOrAdmin(permissions.BasePermission):
    """Only employees and admins can edit"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
            
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_staff:
            return True
            
        if hasattr(request.user, 'profile'):
            return request.user.profile.can_edit()
        
        return False
