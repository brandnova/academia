from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["user", "type", "is_read", "created_at"]
    list_filter = ["type", "is_read"]
    search_fields = ["message", "user__email"]
