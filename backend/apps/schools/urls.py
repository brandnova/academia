from django.urls import path

from .views import (
    DepartmentDetailView,
    DepartmentListCreateView,
    SchoolDetailView,
    SchoolListCreateView,
)

urlpatterns = [
    path("schools/", SchoolListCreateView.as_view(), name="school-list-create"),
    path("schools/<uuid:school_id>/", SchoolDetailView.as_view(), name="school-detail"),
    path("schools/<uuid:school_id>/departments/", DepartmentListCreateView.as_view(), name="department-list-create"),
    path("departments/<uuid:department_id>/", DepartmentDetailView.as_view(), name="department-detail"),
]
