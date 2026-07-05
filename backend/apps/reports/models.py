import uuid

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.accounts.models import User


class Report(models.Model):
    class ReportType(models.TextChoices):
        SPAM = "SPAM", "Spam"
        ABUSE = "ABUSE", "Abuse"
        MISINFORMATION = "MISINFORMATION", "Misinformation"
        DUPLICATE = "DUPLICATE", "Duplicate"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        RESOLVED = "RESOLVED", "Resolved"
        REJECTED = "REJECTED", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(User, related_name="reports", on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=ReportType.choices)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey("content_type", "object_id")
    description = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    resolved_by = models.ForeignKey(
        User, null=True, blank=True, related_name="resolved_reports", on_delete=models.SET_NULL
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reports"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["content_type", "object_id"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["reporter", "content_type", "object_id"],
                name="unique_report_per_user_per_content",
            )
        ]

    def __str__(self):
        return f"{self.type} report on {self.content_type} {self.object_id}"
