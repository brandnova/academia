from django.contrib import admin

from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["type", "status", "reporter", "content_type", "object_id", "created_at"]
    list_filter = ["type", "status"]
    search_fields = ["description", "reporter__email"]
