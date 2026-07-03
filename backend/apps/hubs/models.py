import uuid

from django.db import models

from apps.accounts.models import User
from apps.schools.models import School


class Hub(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.OneToOneField(School, related_name="hub", on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "hubs"

    def __str__(self):
        return f"Hub: {self.school.short_name}"

    @property
    def question_count(self):
        return self.questions.count()

    @property
    def moderator_count(self):
        # TODO(Phase 14): return self.moderatorassignment_set.filter(is_active=True).count()
        return 0


class HubActivationRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, related_name="activation_requests", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="hub_activation_requests", on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True,
        related_name="reviewed_activation_requests", on_delete=models.SET_NULL,
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "hub_activation_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.school.short_name} - {self.status}"
