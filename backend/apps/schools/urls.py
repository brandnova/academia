from django.urls import path

from .views import (
    DepartmentDetailView,
    DepartmentListCreateView,
    SchoolBySlugView,
    SchoolDetailView,
    SchoolListCreateView,
)

urlpatterns = [
    path("schools/", SchoolListCreateView.as_view(), name="school-list-create"),
    path("schools/by-slug/<slug:slug>/", SchoolBySlugView.as_view(), name="school-by-slug"),
    path("schools/<looseid:school_id>/", SchoolDetailView.as_view(), name="school-detail"),
    path("schools/<looseid:school_id>/departments/", DepartmentListCreateView.as_view(), name="department-list-create"),
    path("departments/<looseid:department_id>/", DepartmentDetailView.as_view(), name="department-detail"),
]
