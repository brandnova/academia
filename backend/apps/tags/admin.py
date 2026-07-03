from django.contrib import admin

from .models import QuestionTag, Tag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at"]
    search_fields = ["name"]


@admin.register(QuestionTag)
class QuestionTagAdmin(admin.ModelAdmin):
    list_display = ["question", "tag", "created_at"]
    search_fields = ["tag__name", "question__title"]
