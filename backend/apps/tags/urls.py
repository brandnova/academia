from django.urls import path

from .views import TagDetailView, TagListView, TagMergeView, TagQuestionsView

urlpatterns = [
    path("tags/", TagListView.as_view(), name="tag-list"),
    path("tags/<looseid:tag_id>/merge/", TagMergeView.as_view(), name="tag-merge"),
    path("tags/<looseid:tag_id>/", TagDetailView.as_view(), name="tag-detail"),
    path("tags/<str:tag_name>/questions/", TagQuestionsView.as_view(), name="tag-questions"),
]
