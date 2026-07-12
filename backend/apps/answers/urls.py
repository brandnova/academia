from django.urls import path

from .views import AnswerCreateView, AnswerDetailView, AnswerVoteView, MarkBestAnswerView, MyAnswersView

urlpatterns = [
    path("answers/", AnswerCreateView.as_view(), name="answer-create"),
    path("answers/<looseid:answer_id>/", AnswerDetailView.as_view(), name="answer-detail"),
    path("answers/<looseid:answer_id>/vote/", AnswerVoteView.as_view(), name="answer-vote"),
    path("answers/<looseid:answer_id>/mark-best/", MarkBestAnswerView.as_view(), name="answer-mark-best"),
    path("users/me/answers/", MyAnswersView.as_view(), name="my-answers"),
]
