from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.utils import validate_uuid

from .models import Notification
from .pagination import NotificationPagination
from .serializers import NotificationSerializer


class NotificationListView(ListAPIView):
    serializer_class = NotificationSerializer
    pagination_class = NotificationPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        is_read = self.request.query_params.get("is_read")
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == "true")
        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data["unread_count"] = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return response


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        parsed_id = validate_uuid(notification_id)
        try:
            notification = Notification.objects.get(id=parsed_id)
        except Notification.DoesNotExist:
            raise NotFound("Notification not found")

        if notification.user_id != request.user.id:
            raise PermissionDenied("You do not have permission to modify this notification")

        if not notification.is_read:
            Notification.objects.filter(id=notification.id).update(is_read=True)

        return Response({"message": "Notification marked as read", "is_read": True})


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read", "count": count})
