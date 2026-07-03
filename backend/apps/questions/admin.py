from django.contrib import admin

from .models import Question


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["title", "hub", "department", "status", "author", "view_count", "created_at"]
    search_fields = ["title", "body"]
    list_filter = ["status", "hub"]
