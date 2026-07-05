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
        return self.moderator_assignments.filter(is_active=True).count()


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


class ModeratorAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name="moderator_assignments", on_delete=models.CASCADE)
    hub = models.ForeignKey(Hub, related_name="moderator_assignments", on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "moderator_assignments"
        constraints = [
            models.UniqueConstraint(fields=["user", "hub"], name="unique_moderator_per_hub")
        ]

    def __str__(self):
        return f"{self.user_id} moderates {self.hub_id}"


class SchoolRepresentativeAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name="representative_assignments", on_delete=models.CASCADE)
    hub = models.ForeignKey(Hub, related_name="representative_assignments", on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "school_representative_assignments"
        constraints = [
            models.UniqueConstraint(fields=["user", "hub"], name="unique_representative_per_hub")
        ]

    def __str__(self):
        return f"{self.user_id} represents {self.hub_id}"
