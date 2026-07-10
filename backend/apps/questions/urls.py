from django.urls import path

from .views import QuestionDetailView, QuestionListCreateView, UnansweredQuestionsView

urlpatterns = [
    path("questions/unanswered/", UnansweredQuestionsView.as_view(), name="question-unanswered"),
    path("questions/", QuestionListCreateView.as_view(), name="question-list-create"),
    path("questions/<looseid:question_id>/", QuestionDetailView.as_view(), name="question-detail"),
]
