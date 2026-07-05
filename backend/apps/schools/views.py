from django.db.models import Q
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsPlatformAdmin
from .models import Department, School
from .pagination import SchoolPagination
from .serializers import (
    DepartmentSerializer,
    DepartmentUpdateSerializer,
    DepartmentWriteSerializer,
    SchoolDetailSerializer,
    SchoolListSerializer,
    SchoolWriteSerializer,
)


class SchoolListCreateView(generics.ListCreateAPIView):
    queryset = School.objects.filter(is_active=True)
    pagination_class = SchoolPagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsPlatformAdmin()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SchoolWriteSerializer
        return SchoolListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(short_name__icontains=search)
            )

        has_hub = self.request.query_params.get("has_hub")
        if has_hub is not None:
            want_hub = has_hub.lower() == "true"
            if want_hub:
                queryset = queryset.filter(hub__is_active=True)
            else:
                queryset = queryset.exclude(hub__is_active=True)

        return queryset

    def create(self, request, *args, **kwargs):
        write_serializer = self.get_serializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        school = write_serializer.save()
        return Response(SchoolDetailSerializer(school).data, status=status.HTTP_201_CREATED)


class SchoolDetailView(generics.RetrieveUpdateAPIView):
    queryset = School.objects.filter(is_active=True)
    lookup_field = "id"
    lookup_url_kwarg = "school_id"
    http_method_names = ["get", "patch", "options", "head"]

    def get_permissions(self):
        if self.request.method == "PATCH":
            return [IsAuthenticated(), IsPlatformAdmin()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return SchoolWriteSerializer
        return SchoolDetailSerializer

    def get_object(self):
        try:
            return super().get_object()
        except Http404:
            raise NotFound("School not found")

    def patch(self, request, *args, **kwargs):
        school = self.get_object()
        write_serializer = self.get_serializer(school, data=request.data, partial=True)
        write_serializer.is_valid(raise_exception=True)
        school = write_serializer.save()
        return Response(SchoolDetailSerializer(school).data)


class DepartmentListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_school(self, school_id):
        try:
            return School.objects.get(id=school_id, is_active=True)
        except (School.DoesNotExist, ValueError):
            raise NotFound("School not found")

    def get(self, request, school_id):
        school = self.get_school(school_id)
        departments = school.departments.filter(is_active=True)
        return Response({"results": DepartmentSerializer(departments, many=True).data})

    def post(self, request, school_id):
        school = self.get_school(school_id)

        from apps.hubs.permissions import user_is_representative_for_school
        if not user_is_representative_for_school(request.user, school.id):
            raise PermissionDenied("You do not have permission to perform this action")

        write_serializer = DepartmentWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        try:
            department = write_serializer.save(school=school)
        except Exception:
            return Response(
                {"name": ["A department with this name already exists for this school."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(DepartmentSerializer(department).data, status=status.HTTP_201_CREATED)


class DepartmentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ["patch", "options"]

    def get_department(self, department_id):
        return get_object_or_404(Department, id=department_id)

    def patch(self, request, department_id):
        try:
            department = self.get_department(department_id)
        except Http404:
            raise NotFound("Department not found")

        from apps.hubs.permissions import user_is_representative_for_school
        if not user_is_representative_for_school(request.user, department.school_id):
            raise PermissionDenied("You do not have permission to perform this action")

        write_serializer = DepartmentUpdateSerializer(department, data=request.data, partial=True)
        write_serializer.is_valid(raise_exception=True)
        department = write_serializer.save()
        return Response(DepartmentSerializer(department).data)
