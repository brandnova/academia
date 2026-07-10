from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, register_converter
from django.views.defaults import page_not_found

from apps.core.converters import LooseIDConverter

register_converter(LooseIDConverter, "looseid")


def custom_404_handler(request, exception=None):
    if request.path.startswith("/api/"):
        return JsonResponse({"error": "Resource not found"}, status=404)
    return page_not_found(request, exception)


def custom_500_handler(request):
    return JsonResponse({"error": "An unexpected error occurred"}, status=500)


handler404 = custom_404_handler
handler500 = custom_500_handler

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.core.urls")),
    path("api/v1/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.schools.urls")),
    path("api/v1/", include("apps.hubs.urls")),
    path("api/v1/", include("apps.questions.urls")),
    path("api/v1/", include("apps.tags.urls")),
    path("api/v1/", include("apps.answers.urls")),
    path("api/v1/", include("apps.comments.urls")),
    path("api/v1/", include("apps.notifications.urls")),
    path("api/v1/", include("apps.search.urls")),
    path("api/v1/", include("apps.reports.urls")),
]
