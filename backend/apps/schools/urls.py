from django.urls import path

from .views import SchoolDetailView, SchoolListCreateView

urlpatterns = [
    path("schools/", SchoolListCreateView.as_view(), name="school-list-create"),
    path("schools/<uuid:school_id>/", SchoolDetailView.as_view(), name="school-detail"),
]
