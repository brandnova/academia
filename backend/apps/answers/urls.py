from django.urls import path

from .views import AnswerCreateView, AnswerDetailView, AnswerVoteView, MarkBestAnswerView

urlpatterns = [
    path("answers/", AnswerCreateView.as_view(), name="answer-create"),
    path("answers/<uuid:answer_id>/", AnswerDetailView.as_view(), name="answer-detail"),
    path("answers/<uuid:answer_id>/vote/", AnswerVoteView.as_view(), name="answer-vote"),
    path("answers/<uuid:answer_id>/mark-best/", MarkBestAnswerView.as_view(), name="answer-mark-best"),
]
