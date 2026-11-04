import uuid

from django.conf import settings
from django.db import models


class AdminActionLog(models.Model):
    """Append-only record of privileged admin actions that otherwise leave no
    trace. Report and HubActivationRequest already store resolved_by /
    reviewed_by, but nothing recorded who suspended a user, who merged,
    renamed or deleted a tag (the source tag is gone afterward), or which
    action was taken when resolving a report. target_id is a plain UUID, not
    a foreign key, and target_label snapshots a human-readable name, so an
    entry stays meaningful after its target has been deleted."""

    class Action(models.TextChoices):
        REPORT_RESOLVED = "REPORT_RESOLVED", "Report resolved"
        REPORT_REJECTED = "REPORT_REJECTED", "Report rejected"
        USER_SUSPENDED = "USER_SUSPENDED", "User suspended"
        USER_REACTIVATED = "USER_REACTIVATED", "User reactivated"
        TAG_MERGED = "TAG_MERGED", "Tag merged"
        TAG_RENAMED = "TAG_RENAMED", "Tag renamed"
        TAG_DELETED = "TAG_DELETED", "Tag deleted"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name="admin_actions",
        on_delete=models.SET_NULL,
    )
    action = models.CharField(max_length=30, choices=Action.choices)
    target_type = models.CharField(max_length=30)
    target_id = models.UUIDField()
    target_label = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "admin_action_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["target_type", "target_id"]),
            models.Index(fields=["actor", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.action} on {self.target_type} {self.target_id}"
