from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from core.auth_views import CustomTokenObtainPairView, current_user_view, create_privileged_user_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/me/', current_user_view, name='current_user'),
    path('api/users/create-privileged/', create_privileged_user_view, name='create_privileged_user'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
