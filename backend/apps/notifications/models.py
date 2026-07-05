import uuid

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.accounts.models import User


class Notification(models.Model):
    class Type(models.TextChoices):
        NEW_ANSWER = "NEW_ANSWER", "New Answer"
        NEW_COMMENT = "NEW_COMMENT", "New Comment"
        BEST_ANSWER = "BEST_ANSWER", "Best Answer"
        VOTE = "VOTE", "Vote"
        MODERATOR_ASSIGNED = "MODERATOR_ASSIGNED", "Moderator Assigned"
        HUB_ACTIVATED = "HUB_ACTIVATED", "Hub Activated"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name="notifications", on_delete=models.CASCADE)
    type = models.CharField(max_length=30, choices=Type.choices)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    content_type = models.ForeignKey(ContentType, null=True, blank=True, on_delete=models.SET_NULL)
    object_id = models.UUIDField(null=True, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read", "-created_at"]),
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return f"{self.type} to {self.user_id}"
