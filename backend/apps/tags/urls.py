from django.urls import path

from .views import TagListView, TagQuestionsView

urlpatterns = [
    path("tags/", TagListView.as_view(), name="tag-list"),
    path("tags/<str:tag_name>/questions/", TagQuestionsView.as_view(), name="tag-questions"),
]
