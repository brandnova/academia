from django.urls import path

from .views import StaticPageDetailView, StaticPageListCreateView

urlpatterns = [
    path("pages/", StaticPageListCreateView.as_view(), name="page-list-create"),
    path("pages/<str:identifier>/", StaticPageDetailView.as_view(), name="page-detail"),
]
