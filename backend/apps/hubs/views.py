from django.conf import settings
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.core.cache import get_cached, invalidate_key, invalidate_prefix, make_cache_key, set_cached
from apps.core.permissions import IsPlatformAdmin
from apps.core.utils import validate_uuid
from apps.notifications.models import Notification
from apps.notifications.services import notify
from apps.schools.models import School

from .models import Hub, HubActivationRequest, ModeratorAssignment, SchoolRepresentativeAssignment
from .pagination import HubActivationRequestPagination
from .permissions import user_is_representative_for_hub
from .serializers import (
    HubActivationRequestCreateSerializer,
    HubActivationRequestSerializer,
    HubDetailSerializer,
    ModeratorAssignmentSerializer,
    RepresentativeAssignmentSerializer,
)


def _invalidate_hub_cache(hub):
    invalidate_key(make_cache_key("hub-detail", hub.id))
    invalidate_key(make_cache_key("hub-by-school", hub.school_id))
    invalidate_key(make_cache_key("hub-by-slug", hub.school.slug))
    invalidate_key(make_cache_key("school-detail", hub.school_id))


class HubDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, hub_id):
        parsed_id = validate_uuid(hub_id)
        cache_key = make_cache_key("hub-detail", hub_id)
        cached = get_cached(cache_key)
        if cached is not None:
            return Response(cached)

        try:
            hub = Hub.objects.get(id=parsed_id, is_active=True)
        except Hub.DoesNotExist:
            raise NotFound("Hub not found")

        data = HubDetailSerializer(hub).data
        set_cached(cache_key, data, settings.CACHE_TTL_SHORT)
        return Response(data)


class HubBySchoolView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, school_id):
        parsed_id = validate_uuid(school_id)
        cache_key = make_cache_key("hub-by-school", school_id)
        cached = get_cached(cache_key)
        if cached is not None:
            return Response(cached)

        try:
            hub = Hub.objects.get(school_id=parsed_id, is_active=True)
        except Hub.DoesNotExist:
            raise NotFound("Hub not found for this school")

        data = HubDetailSerializer(hub).data
        set_cached(cache_key, data, settings.CACHE_TTL_SHORT)
        return Response(data)


class HubBySlugView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        cache_key = make_cache_key("hub-by-slug", slug)
        cached = get_cached(cache_key)
        if cached is not None:
            return Response(cached)

        try:
            school = School.objects.get(slug=slug, is_active=True)
            hub = Hub.objects.get(school=school, is_active=True)
        except (School.DoesNotExist, Hub.DoesNotExist):
            raise NotFound("Hub not found for this school")

        data = HubDetailSerializer(hub).data
        set_cached(cache_key, data, settings.CACHE_TTL_SHORT)
        return Response(data)


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
        parsed_id = validate_uuid(request_id)
        try:
            activation_request = HubActivationRequest.objects.get(id=parsed_id)
        except HubActivationRequest.DoesNotExist:
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

        _invalidate_hub_cache(hub)
        invalidate_prefix("school-list")

        notify(
            user=activation_request.user,
            notification_type=Notification.Type.HUB_ACTIVATED,
            message=f"Your hub activation request for {hub.school.short_name} was approved",
            content_object=hub,
            email_subject="Your hub activation request was approved",
            email_template="hub_activated",
            email_context={
                "recipient_name": activation_request.user.full_name,
                "school_name": hub.school.name,
                "hub_url": f"{settings.FRONTEND_URL}/hubs/{hub.school.slug}",
            },
        )

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
        parsed_id = validate_uuid(request_id)
        try:
            activation_request = HubActivationRequest.objects.get(id=parsed_id)
        except HubActivationRequest.DoesNotExist:
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


class HubModeratorListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_hub(self, hub_id):
        parsed_id = validate_uuid(hub_id)
        try:
            return Hub.objects.get(id=parsed_id, is_active=True)
        except Hub.DoesNotExist:
            raise NotFound("Hub not found")

    def get(self, request, hub_id):
        hub = self.get_hub(hub_id)
        assignments = ModeratorAssignment.objects.filter(hub=hub, is_active=True).select_related("user")
        return Response({"results": ModeratorAssignmentSerializer(assignments, many=True).data})

    def post(self, request, hub_id):
        hub = self.get_hub(hub_id)
        if not user_is_representative_for_hub(request.user, hub.id):
            raise PermissionDenied("You do not have permission to perform this action")

        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"user_id": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        parsed_user_id = validate_uuid(user_id)
        try:
            target_user = User.objects.get(id=parsed_user_id)
        except User.DoesNotExist:
            return Response(
                {"user_id": [f"User with ID '{user_id}' does not exist."]},
                status=status.HTTP_404_NOT_FOUND,
            )

        existing = ModeratorAssignment.objects.filter(hub=hub, user=target_user).first()
        if existing and existing.is_active:
            return Response(
                {"error": "User is already a moderator for this hub"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if existing and not existing.is_active:
            existing.is_active = True
            existing.save(update_fields=["is_active", "updated_at"])
            assignment = existing
        else:
            assignment = ModeratorAssignment.objects.create(hub=hub, user=target_user)

        _invalidate_hub_cache(hub)
        return Response(ModeratorAssignmentSerializer(assignment).data, status=status.HTTP_201_CREATED)


class HubModeratorDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, hub_id, user_id):
        parsed_hub_id = validate_uuid(hub_id)
        parsed_user_id = validate_uuid(user_id)
        try:
            hub = Hub.objects.get(id=parsed_hub_id, is_active=True)
        except Hub.DoesNotExist:
            raise NotFound("Hub not found")

        if not user_is_representative_for_hub(request.user, hub.id):
            raise PermissionDenied("You do not have permission to perform this action")

        try:
            assignment = ModeratorAssignment.objects.get(hub=hub, user_id=parsed_user_id, is_active=True)
        except ModeratorAssignment.DoesNotExist:
            raise NotFound("Moderator assignment not found")

        assignment.is_active = False
        assignment.save(update_fields=["is_active", "updated_at"])
        _invalidate_hub_cache(hub)
        return Response(status=status.HTTP_204_NO_CONTENT)


class HubRepresentativeListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsPlatformAdmin()]
        return [AllowAny()]

    def get_hub(self, hub_id):
        parsed_id = validate_uuid(hub_id)
        try:
            return Hub.objects.get(id=parsed_id, is_active=True)
        except Hub.DoesNotExist:
            raise NotFound("Hub not found")

    def get(self, request, hub_id):
        hub = self.get_hub(hub_id)
        assignments = SchoolRepresentativeAssignment.objects.filter(
            hub=hub, is_active=True
        ).select_related("user")
        return Response({"results": RepresentativeAssignmentSerializer(assignments, many=True).data})

    def post(self, request, hub_id):
        hub = self.get_hub(hub_id)
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"user_id": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
        parsed_user_id = validate_uuid(user_id)
        try:
            target_user = User.objects.get(id=parsed_user_id)
        except User.DoesNotExist:
            return Response(
                {"user_id": [f"User with ID '{user_id}' does not exist."]},
                status=status.HTTP_404_NOT_FOUND,
            )

        existing = SchoolRepresentativeAssignment.objects.filter(hub=hub, user=target_user).first()
        if existing and existing.is_active:
            return Response(
                {"error": "User is already a representative for this hub"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if existing and not existing.is_active:
            existing.is_active = True
            existing.save(update_fields=["is_active", "updated_at"])
            assignment = existing
        else:
            assignment = SchoolRepresentativeAssignment.objects.create(hub=hub, user=target_user)

        return Response(RepresentativeAssignmentSerializer(assignment).data, status=status.HTTP_201_CREATED)


class HubRepresentativeDetailView(APIView):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def delete(self, request, hub_id, user_id):
        parsed_hub_id = validate_uuid(hub_id)
        parsed_user_id = validate_uuid(user_id)
        try:
            hub = Hub.objects.get(id=parsed_hub_id, is_active=True)
        except Hub.DoesNotExist:
            raise NotFound("Hub not found")

        try:
            assignment = SchoolRepresentativeAssignment.objects.get(hub=hub, user_id=parsed_user_id, is_active=True)
        except SchoolRepresentativeAssignment.DoesNotExist:
            raise NotFound("Representative assignment not found")

        assignment.is_active = False
        assignment.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
