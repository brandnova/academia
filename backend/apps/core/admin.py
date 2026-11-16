from django.contrib import admin

from .models import AdminActionLog


@admin.register(AdminActionLog)
class AdminActionLogAdmin(admin.ModelAdmin):
    list_display = ["created_at", "actor", "action", "target_type", "target_label"]
    list_filter = ["action", "target_type"]
    search_fields = ["target_label", "actor__email"]
    readonly_fields = [
        "id", "actor", "action", "target_type", "target_id",
        "target_label", "metadata", "created_at",
    ]

    # Append-only: entries are written by the API, never by hand.
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
