from apps.notifications.models import Notification
from apps.notifications.services import notify

from .models import QuestionFollow


def notify_followers_of_new_answer(question, answer, answering_user_id):
    """In-app only. Excludes the answering user and the question author,
    both already get notified through the existing dedicated paths."""
    exclude_ids = {answering_user_id, question.author_id}
    followers = (
        QuestionFollow.objects.filter(question=question)
        .exclude(user_id__in=exclude_ids)
        .select_related("user")
    )
    for follow in followers:
        notify(
            user=follow.user,
            notification_type=Notification.Type.NEW_ANSWER,
            message=f'A question you follow, "{question.title}", received a new answer.',
            content_object=answer,
        )


def notify_followers_of_best_answer(question, answer):
    """In-app only. Excludes the question author and the marked answer's
    author, both already get notified through the existing dedicated paths."""
    exclude_ids = {question.author_id, answer.author_id}
    followers = (
        QuestionFollow.objects.filter(question=question)
        .exclude(user_id__in=exclude_ids)
        .select_related("user")
    )
    for follow in followers:
        notify(
            user=follow.user,
            notification_type=Notification.Type.NEW_ANSWER,
            message=f'A question you follow, "{question.title}", has a best answer selected.',
            content_object=answer,
        )