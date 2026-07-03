from django.urls import path

from .views import CommentCreateView, CommentDetailView, CommentListView

urlpatterns = [
    path("comments/", CommentCreateView.as_view(), name="comment-create"),
    path("comments/<uuid:comment_id>/", CommentDetailView.as_view(), name="comment-detail"),
    path("answers/<uuid:answer_id>/comments/", CommentListView.as_view(), name="comment-list"),
]
