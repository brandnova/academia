from django.conf import settings
from django.db.models import Q
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.cache import (
    cache_get_response,
    get_cached,
    invalidate_key,
    invalidate_prefix,
    make_cache_key,
    set_cached,
)
from apps.core.permissions import IsPlatformAdmin
from apps.core.utils import validate_uuid
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
    pagination_class = SchoolPagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsPlatformAdmin()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SchoolWriteSerializer
        return SchoolListSerializer

    def _requesting_user_is_admin(self):
        user = self.request.user
        return bool(user and user.is_authenticated and getattr(user, "is_admin", False))

    def get_queryset(self):
        if self._requesting_user_is_admin():
            queryset = School.objects.all()
        else:
            queryset = School.objects.filter(is_active=True)

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

    def list(self, request, *args, **kwargs):
        # Admins see inactive schools too, so their response must never be
        # served from (or written to) the shared public cache.
        if self._requesting_user_is_admin():
            return super().list(request, *args, **kwargs)
        return self._cached_list(request, *args, **kwargs)

    @cache_get_response("school-list", timeout_setting="CACHE_TTL_SHORT")
    def _cached_list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        write_serializer = self.get_serializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        school = write_serializer.save()
        invalidate_prefix("school-list")
        return Response(SchoolDetailSerializer(school).data, status=status.HTTP_201_CREATED)


class SchoolDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "PATCH":
            return [IsAuthenticated(), IsPlatformAdmin()]
        return [AllowAny()]

    def _requesting_user_is_admin(self):
        user = self.request.user
        return bool(user and user.is_authenticated and getattr(user, "is_admin", False))

    def get_school(self, school_id, include_inactive=False):
        parsed_id = validate_uuid(school_id)
        qs = School.objects.all() if include_inactive else School.objects.filter(is_active=True)
        try:
            return qs.get(id=parsed_id)
        except School.DoesNotExist:
            raise NotFound("School not found")

    def get(self, request, school_id):
        if self._requesting_user_is_admin():
            school = self.get_school(school_id, include_inactive=True)
            return Response(SchoolDetailSerializer(school).data)

        cache_key = make_cache_key("school-detail", school_id)
        cached = get_cached(cache_key)
        if cached is not None:
            return Response(cached)

        school = self.get_school(school_id)
        data = SchoolDetailSerializer(school).data
        set_cached(cache_key, data, settings.CACHE_TTL_MEDIUM)
        return Response(data)

    def patch(self, request, school_id):
        # Always includes inactive here: this is how a school gets reactivated
        # in the first place, filtering it out would make reactivation
        # impossible through the API, forcing a Django admin round-trip.
        school = self.get_school(school_id, include_inactive=True)
        write_serializer = SchoolWriteSerializer(school, data=request.data, partial=True)
        write_serializer.is_valid(raise_exception=True)
        school = write_serializer.save()
        invalidate_key(make_cache_key("school-detail", school.id))
        invalidate_prefix("school-list")
        return Response(SchoolDetailSerializer(school).data)


class SchoolBySlugView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        cache_key = make_cache_key("school-by-slug", slug)
        cached = get_cached(cache_key)
        if cached is not None:
            return Response(cached)

        try:
            school = School.objects.get(slug=slug, is_active=True)
        except School.DoesNotExist:
            raise NotFound("School not found")

        data = SchoolDetailSerializer(school).data
        set_cached(cache_key, data, settings.CACHE_TTL_MEDIUM)
        return Response(data)


class DepartmentListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_school(self, school_id):
        parsed_id = validate_uuid(school_id)
        try:
            return School.objects.get(id=parsed_id, is_active=True)
        except School.DoesNotExist:
            raise NotFound("School not found")

    def get(self, request, school_id):
        school = self.get_school(school_id)

        from apps.hubs.permissions import user_is_representative_for_school
        user = request.user
        can_manage = bool(
            user
            and user.is_authenticated
            and (getattr(user, "is_admin", False) or user_is_representative_for_school(user, school.id))
        )

        departments = school.departments.all() if can_manage else school.departments.filter(is_active=True)
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
        invalidate_key(make_cache_key("school-detail", school.id))
        return Response(DepartmentSerializer(department).data, status=status.HTTP_201_CREATED)


class DepartmentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ["patch", "options"]

    def get_department(self, department_id):
        parsed_id = validate_uuid(department_id)
        return get_object_or_404(Department, id=parsed_id)

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
        invalidate_key(make_cache_key("school-detail", department.school_id))
        return Response(DepartmentSerializer(department).data)
