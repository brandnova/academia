from django.contrib import admin

from .models import StaticPage


@admin.register(StaticPage)
class StaticPageAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "visibility", "is_published", "created_by", "updated_at"]
    list_filter = ["visibility", "is_published"]
    search_fields = ["title", "slug"]
    readonly_fields = ["slug"]
