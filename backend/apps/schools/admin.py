from django.contrib import admin

from .models import Department, School


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ["short_name", "name", "slug", "verification_status", "is_active", "created_at"]
    search_fields = ["name", "short_name", "slug"]
    list_filter = ["verification_status", "is_active"]
    readonly_fields = ["slug"]


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "school", "is_active", "created_at"]
    search_fields = ["name", "code", "school__name", "school__short_name"]
    list_filter = ["is_active", "school"]
