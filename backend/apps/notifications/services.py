import logging

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from .models import Notification

logger = logging.getLogger(__name__)


def create_notification(user, notification_type, message, content_object=None):
    content_type = None
    object_id = None
    if content_object is not None:
        content_type = ContentType.objects.get_for_model(content_object)
        object_id = content_object.pk

    return Notification.objects.create(
        user=user,
        type=notification_type,
        message=message,
        content_type=content_type,
        object_id=object_id,
    )


def send_notification_email(user, subject, template_name, context):
    if not user.email:
        return

    merged_context = {
        "site_name": settings.SITE_NAME,
        "frontend_url": settings.FRONTEND_URL,
        **context,
    }
    html_body = render_to_string(f"emails/{template_name}.html", merged_context)
    text_body = render_to_string(f"emails/{template_name}.txt", merged_context)

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.attach_alternative(html_body, "text/html")

    try:
        email.send(fail_silently=False)
    except Exception:
        # Email delivery failing should never break the action that triggered it.
        logger.exception("Failed to send notification email to %s", user.email)


def notify(user, notification_type, message, content_object=None,
           email_subject=None, email_template=None, email_context=None):
    """
    Always creates an in-app Notification record. Sends an email too, only if
    email_subject and email_template are both provided.
    """
    notification = create_notification(user, notification_type, message, content_object)

    if email_subject and email_template:
        send_notification_email(user, email_subject, email_template, email_context or {})

    return notification
