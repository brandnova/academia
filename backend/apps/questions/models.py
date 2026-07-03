import uuid

from django.db import models

from apps.accounts.models import User
from apps.hubs.models import Hub
from apps.schools.models import Department


class Question(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        ANSWERED = "ANSWERED", "Answered"
        SOLVED = "SOLVED", "Solved"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
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

    @property
    def answer_count(self):
        # TODO(Phase 7): return self.answer_set.count()
        return 0

    @property
    def best_answer_id(self):
        # TODO(Phase 7): return getattr(self.answer_set.filter(is_best=True).first(), "id", None)
        return None

    @property
    def tags(self):
        # TODO(Phase 6): return list(self.questiontag_set.values_list("tag__name", flat=True))
        return []
