import uuid

from django.db import models

from apps.core.slugs import generate_unique_slug


class School(models.Model):
    class VerificationStatus(models.TextChoices):
        UNVERIFIED = "UNVERIFIED", "Unverified"
        PENDING = "PENDING", "Pending"
        VERIFIED = "VERIFIED", "Verified"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    short_name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=90, unique=True, editable=False, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.UNVERIFIED,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "schools"
        ordering = ["name"]

    def __str__(self):
        return self.short_name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(School, self.short_name or self.name)
        super().save(*args, **kwargs)

    @property
    def has_hub(self):
        return hasattr(self, "hub") and self.hub.is_active


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, related_name="departments", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "departments"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "name"], name="unique_department_name_per_school")
        ]

    def __str__(self):
        return f"{self.name} ({self.school.short_name})"

    @property
    def question_count(self):
        return self.questions.count()
