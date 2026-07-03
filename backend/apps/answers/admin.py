from django.contrib import admin

from .models import Answer, AnswerVote


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ["question", "author", "is_best", "vote_score", "created_at"]
    search_fields = ["body", "question__title"]
    list_filter = ["is_best"]


@admin.register(AnswerVote)
class AnswerVoteAdmin(admin.ModelAdmin):
    list_display = ["answer", "user", "vote_type", "created_at"]
    list_filter = ["vote_type"]
