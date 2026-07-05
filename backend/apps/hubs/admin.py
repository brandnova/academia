from django.contrib import admin

from .models import Hub, HubActivationRequest, ModeratorAssignment, SchoolRepresentativeAssignment


@admin.register(Hub)
class HubAdmin(admin.ModelAdmin):
    list_display = ["school", "is_active", "activated_at", "created_at"]
    search_fields = ["school__name", "school__short_name"]
    list_filter = ["is_active"]


@admin.register(HubActivationRequest)
class HubActivationRequestAdmin(admin.ModelAdmin):
    list_display = ["school", "user", "status", "created_at"]
    search_fields = ["school__name", "school__short_name", "user__email"]
    list_filter = ["status"]


@admin.register(ModeratorAssignment)
class ModeratorAssignmentAdmin(admin.ModelAdmin):
    list_display = ["user", "hub", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["user__email", "hub__school__short_name"]


@admin.register(SchoolRepresentativeAssignment)
class SchoolRepresentativeAssignmentAdmin(admin.ModelAdmin):
    list_display = ["user", "hub", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["user__email", "hub__school__short_name"]
