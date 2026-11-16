from rest_framework.permissions import BasePermission


def user_is_platform_admin(user):
    """Shared 'is this request from a platform admin' check. Previously
    duplicated verbatim across SchoolListCreateView, SchoolDetailView, and
    inlined again in DepartmentListCreateView.get(). Single source of truth
    now, both IsPlatformAdmin and any direct callers use this."""
    return bool(user and user.is_authenticated and user.is_admin)


class IsPlatformAdmin(BasePermission):
    """Allows access only to users with the platform-level is_admin flag."""

    def has_permission(self, request, view):
        return user_is_platform_admin(request.user)
