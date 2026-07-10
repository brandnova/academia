import uuid

from django.db import models

from apps.accounts.models import User
from apps.core.slugs import generate_display_slug
from apps.hubs.models import Hub
from apps.schools.models import Department


class Question(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        ANSWERED = "ANSWERED", "Answered"
        SOLVED = "SOLVED", "Solved"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=90, editable=False, blank=True)
    body = models.TextField()
    author = models.ForeignKey(User, related_name="questions", on_delete=models.CASCADE)
    hub = models.ForeignKey(Hub, related_name="questions", on_delete=models.CASCADE)
    department = models.ForeignKey(
        Department, related_name="questions", null=True, blank=True, on_delete=models.SET_NULL
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    view_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "questions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["hub", "-created_at"]),
            models.Index(fields=["hub", "status"]),
            models.Index(fields=["department"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        self.slug = generate_display_slug(self.title)
        super().save(*args, **kwargs)

    @property
    def answer_count(self):
        return self.answers.count()

    @property
    def best_answer_id(self):
        best = self.answers.filter(is_best=True).first()
        return best.id if best else None

    @property
    def tags(self):
        from apps.tags.models import QuestionTag
        return list(
            QuestionTag.objects.filter(question=self).values_list("tag__name", flat=True)
        )
