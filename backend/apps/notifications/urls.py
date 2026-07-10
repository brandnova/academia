from django.urls import path

from .views import MarkAllNotificationsReadView, MarkNotificationReadView, NotificationListView

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path("notifications/mark-all-read/", MarkAllNotificationsReadView.as_view(), name="notification-mark-all-read"),
    path("notifications/<looseid:notification_id>/mark-read/", MarkNotificationReadView.as_view(), name="notification-mark-read"),
]
