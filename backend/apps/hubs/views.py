from django.http import Http404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsPlatformAdmin
from .models import Hub, HubActivationRequest
from .pagination import HubActivationRequestPagination
from .serializers import (
    HubActivationRequestCreateSerializer,
    HubActivationRequestSerializer,
    HubDetailSerializer,
)


class HubDetailView(generics.RetrieveAPIView):
    queryset = Hub.objects.filter(is_active=True)
    serializer_class = HubDetailSerializer
    lookup_field = "id"
    lookup_url_kwarg = "hub_id"
    permission_classes = [AllowAny]

    def get_object(self):
        try:
            return super().get_object()
        except Http404:
            raise NotFound("Hub not found")


class HubBySchoolView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, school_id):
        try:
            hub = Hub.objects.get(school_id=school_id, is_active=True)
        except (Hub.DoesNotExist, ValueError):
            raise NotFound("Hub not found for this school")
        return Response(HubDetailSerializer(hub).data)


class HubActivationRequestListCreateView(generics.ListCreateAPIView):
    pagination_class = HubActivationRequestPagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsPlatformAdmin()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return HubActivationRequestCreateSerializer
        return HubActivationRequestSerializer

    def get_queryset(self):
        queryset = HubActivationRequest.objects.all()
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param.upper())
        return queryset

    def create(self, request, *args, **kwargs):
        write_serializer = self.get_serializer(data=request.data, context={"request": request})
        write_serializer.is_valid(raise_exception=True)
        activation_request = write_serializer.save()
        return Response(
            HubActivationRequestSerializer(activation_request).data,
            status=status.HTTP_201_CREATED,
        )


class ApproveActivationRequestView(APIView):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def post(self, request, request_id):
        try:
            activation_request = HubActivationRequest.objects.get(id=request_id)
        except (HubActivationRequest.DoesNotExist, ValueError):
            raise NotFound("Activation request not found")

        if activation_request.status != HubActivationRequest.Status.PENDING:
            return Response(
                {"error": "This activation request has already been reviewed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        hub, created = Hub.objects.get_or_create(
            school=activation_request.school,
            defaults={"is_active": True, "activated_at": timezone.now()},
        )
        if not created:
            hub.is_active = True
            hub.activated_at = hub.activated_at or timezone.now()
            hub.save(update_fields=["is_active", "activated_at", "updated_at"])

        activation_request.status = HubActivationRequest.Status.APPROVED
        activation_request.reviewed_by = request.user
        activation_request.reviewed_at = timezone.now()
        activation_request.save(update_fields=["status", "reviewed_by", "reviewed_at", "updated_at"])

        return Response({
            "message": "Hub activated successfully",
            "hub": {
                "id": str(hub.id),
                "school": {
                    "id": str(hub.school.id),
                    "name": hub.school.name,
                    "short_name": hub.school.short_name,
                },
                "activated_at": hub.activated_at,
            },
        })


class RejectActivationRequestView(APIView):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def post(self, request, request_id):
        try:
            activation_request = HubActivationRequest.objects.get(id=request_id)
        except (HubActivationRequest.DoesNotExist, ValueError):
            raise NotFound("Activation request not found")

        if activation_request.status != HubActivationRequest.Status.PENDING:
            return Response(
                {"error": "This activation request has already been reviewed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        activation_request.status = HubActivationRequest.Status.REJECTED
        activation_request.reviewed_by = request.user
        activation_request.reviewed_at = timezone.now()
        activation_request.save(update_fields=["status", "reviewed_by", "reviewed_at", "updated_at"])

        return Response({
            "message": "Activation request rejected",
            "status": "REJECTED",
        })
