from django.contrib import admin

from .models import Department, School, SchoolSourceRecord


class SchoolSourceRecordInline(admin.TabularInline):
    model = SchoolSourceRecord
    extra = 0
    fields = ["regulator", "raw_category", "source_url", "fetched_at", "is_current"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-fetched_at"]


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = [
        "short_name", "name", "slug", "institution_type", "ownership", "state", "country",
        "verification_status", "is_active", "created_at",
    ]
    search_fields = ["name", "short_name", "slug", "state"]
    list_filter = ["verification_status", "is_active", "institution_type", "ownership", "country"]
    readonly_fields = ["slug"]
    inlines = [SchoolSourceRecordInline]


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "school", "is_active", "created_at"]
    search_fields = ["name", "code", "school__name", "school__short_name"]
    list_filter = ["is_active", "school"]
