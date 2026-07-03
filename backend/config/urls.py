from django.contrib import admin
from django.urls import path, include

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
]
