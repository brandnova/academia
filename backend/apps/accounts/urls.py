from django.urls import path

from .views import (
    AdminUserDetailView,
    AdminUserListView,
    GoogleLoginView,
    LogoutView,
    MeView,
    ScopedTokenRefreshView,
)

urlpatterns = [
    path("auth/google/", GoogleLoginView.as_view(), name="google-login"),
    path("auth/refresh/", ScopedTokenRefreshView.as_view(), name="token-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("users/me/", MeView.as_view(), name="user-me"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("admin/users/<uuid:user_id>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
]
