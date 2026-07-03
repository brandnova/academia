import uuid

from django.db import models

from apps.questions.models import Question


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tags"
        ordering = ["name"]

    def __str__(self):
        return self.name


class QuestionTag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, related_name="question_tags", on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, related_name="question_tags", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "question_tags"
        constraints = [
            models.UniqueConstraint(fields=["question", "tag"], name="unique_question_tag")
        ]

    def __str__(self):
        return f"{self.question_id} - {self.tag.name}"
