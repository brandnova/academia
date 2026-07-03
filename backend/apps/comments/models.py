import uuid

from django.db import models

from apps.accounts.models import User
from apps.answers.models import Answer


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    body = models.TextField()
    author = models.ForeignKey(User, related_name="comments", on_delete=models.CASCADE)
    answer = models.ForeignKey(Answer, related_name="comments", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "comments"
        ordering = ["created_at"]
        indexes = [models.Index(fields=["answer", "created_at"])]

    def __str__(self):
        return f"Comment on {self.answer_id} by {self.author_id}"
