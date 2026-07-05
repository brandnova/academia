from django.urls import path

from .views import SearchQuestionsView

urlpatterns = [
    path("search/questions/", SearchQuestionsView.as_view(), name="search-questions"),
]
