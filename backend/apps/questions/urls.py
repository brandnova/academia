from django.urls import path

from .views import QuestionDetailView, QuestionListCreateView, UnansweredQuestionsView, QuestionFollowView, QuestionLockView

urlpatterns = [
    path("questions/unanswered/", UnansweredQuestionsView.as_view(), name="question-unanswered"),
    path("questions/", QuestionListCreateView.as_view(), name="question-list-create"),
    path("questions/<looseid:question_id>/", QuestionDetailView.as_view(), name="question-detail"),
    path("questions/<looseid:question_id>/follow/", QuestionFollowView.as_view(), name="question-follow"),
    path("questions/<looseid:question_id>/lock/", QuestionLockView.as_view(), name="question-lock"),
]
