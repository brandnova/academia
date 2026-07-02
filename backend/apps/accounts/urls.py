from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import GoogleLoginView, LogoutView, MeView

urlpatterns = [
    path("auth/google/", GoogleLoginView.as_view(), name="google-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("users/me/", MeView.as_view(), name="user-me"),
]
