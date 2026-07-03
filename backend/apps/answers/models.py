import uuid

from django.db import models

from apps.accounts.models import User
from apps.questions.models import Question


class Answer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    body = models.TextField()
    author = models.ForeignKey(User, related_name="answers", on_delete=models.CASCADE)
    question = models.ForeignKey(Question, related_name="answers", on_delete=models.CASCADE)
    is_best = models.BooleanField(default=False)
    vote_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "answers"
        ordering = ["-is_best", "-vote_score", "created_at"]
        indexes = [
            models.Index(fields=["question", "is_best"]),
        ]

    def __str__(self):
        return f"Answer to {self.question_id} by {self.author_id}"

    @property
    def comment_count(self):
        return self.comments.count()


class AnswerVote(models.Model):
    class VoteType(models.TextChoices):
        UP = "UP", "Up"
        DOWN = "DOWN", "Down"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    answer = models.ForeignKey(Answer, related_name="votes", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="answer_votes", on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=10, choices=VoteType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "answer_votes"
        indexes = [models.Index(fields=["answer"])]
        constraints = [
            models.UniqueConstraint(fields=["answer", "user"], name="unique_answer_vote_per_user")
        ]

    def __str__(self):
        return f"{self.user_id} {self.vote_type} on {self.answer_id}"
