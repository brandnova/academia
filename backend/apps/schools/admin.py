from django.contrib import admin

from .models import School


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ["short_name", "name", "verification_status", "is_active", "created_at"]
    search_fields = ["name", "short_name"]
    list_filter = ["verification_status", "is_active"]
