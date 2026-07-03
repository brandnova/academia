from django.contrib import admin

from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["answer", "author", "created_at"]
    search_fields = ["body"]
