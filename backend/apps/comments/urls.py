from django.urls import path

from .views import CommentCreateView, CommentDetailView, CommentListView, MyCommentsView

urlpatterns = [
    path("comments/", CommentCreateView.as_view(), name="comment-create"),
    path("comments/<looseid:comment_id>/", CommentDetailView.as_view(), name="comment-detail"),
    path("answers/<looseid:answer_id>/comments/", CommentListView.as_view(), name="comment-list"),
    path("users/me/comments/", MyCommentsView.as_view(), name="my-comments"),
]
