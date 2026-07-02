from django.db.models import Q
from django.http import Http404
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsPlatformAdmin
from .models import School
from .pagination import SchoolPagination
from .serializers import SchoolDetailSerializer, SchoolListSerializer, SchoolWriteSerializer


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
            # TODO(Phase 4): filter on the real Hub relation once it exists
            queryset = queryset.none() if want_hub else queryset

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
