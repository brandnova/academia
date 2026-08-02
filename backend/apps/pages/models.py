import uuid

from django.db import models

from apps.accounts.models import User
from apps.core.slugs import generate_unique_slug


class StaticPage(models.Model):
    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC", "Public"
        STAFF = "STAFF", "Staff"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=90, unique=True, editable=False, blank=True)
    body = models.TextField()
    visibility = models.CharField(max_length=10, choices=Visibility.choices, default=Visibility.PUBLIC)
    is_published = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        User, null=True, blank=True, related_name="static_pages", on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "static_pages"
        ordering = ["title"]
        indexes = [
            models.Index(fields=["is_published", "visibility"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(StaticPage, self.title)
        super().save(*args, **kwargs)
