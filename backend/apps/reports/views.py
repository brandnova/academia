from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.answers.models import Answer
from apps.comments.models import Comment
from apps.core.audit import log_admin_action
from apps.core.models import AdminActionLog
from apps.core.permissions import IsPlatformAdmin
from apps.core.throttling import MethodScopedThrottle
from apps.core.utils import validate_uuid
from apps.hubs.permissions import user_is_moderator_or_representative_for_hub
from apps.notifications.models import Notification
from apps.notifications.services import notify
from apps.questions.models import Question

from .models import Report
from .pagination import ReportPagination
from .serializers import ReportCreateResponseSerializer, ReportSerializer

CONTENT_TYPE_MODEL_MAP = {
    "question": Question,
    "answer": Answer,
    "comment": Comment,
}


def _get_hub_for_content(content_type_str, content_object):
    """Resolves the owning Hub for a reportable object, regardless of which
    of the three reportable models it is. Question owns hub directly,
    Answer and Comment resolve it by walking up to their parent Question."""
    if content_type_str == "question":
        return content_object.hub
    if content_type_str == "answer":
        return content_object.question.hub
    if content_type_str == "comment":
        return content_object.answer.question.hub
    return None


def _cascade_targets(content_type_str, content_object):
    """Every (model, pk) that deleting content_object will remove, itself
    included: a Question takes its Answers and their Comments with it, an
    Answer takes its Comments. Must run BEFORE the delete, afterwards the
    cascaded rows are gone and their ids can't be looked up. Queried by
    field name rather than reverse accessors, so it doesn't depend on
    related_name choices in other apps."""
    targets = [(type(content_object), content_object.pk)]
    if content_type_str == "question":
        answer_ids = list(
            Answer.objects.filter(question=content_object).values_list("id", flat=True)
        )
        comment_ids = list(
            Comment.objects.filter(answer_id__in=answer_ids).values_list("id", flat=True)
        )
        targets += [(Answer, pk) for pk in answer_ids]
        targets += [(Comment, pk) for pk in comment_ids]
    elif content_type_str == "answer":
        comment_ids = list(
            Comment.objects.filter(answer=content_object).values_list("id", flat=True)
        )
        targets += [(Comment, pk) for pk in comment_ids]
    return targets


def _auto_resolve_orphaned_reports(targets, exclude_report_id, resolver):
    """Resolves every other PENDING report pointing at content that was just
    deleted (the content itself, or anything cascade-deleted with it).
    Returns the affected reports so the caller can notify their reporters.
    Uses a queryset update(), not per-instance save(), so the stale
    GenericForeignKey caches that bit ResolveReportView before can't
    interfere."""
    by_model = {}
    for model_class, pk in targets:
        by_model.setdefault(model_class, []).append(pk)

    query = Q()
    for model_class, ids in by_model.items():
        content_type = ContentType.objects.get_for_model(model_class)
        query |= Q(content_type=content_type, object_id__in=ids)

    orphaned = list(
        Report.objects.filter(query, status=Report.Status.PENDING)
        .exclude(id=exclude_report_id)
        .select_related("reporter")
    )
    if orphaned:
        now = timezone.now()
        Report.objects.filter(id__in=[r.id for r in orphaned]).update(
            status=Report.Status.RESOLVED,
            resolved_by=resolver,
            resolved_at=now,
            updated_at=now,
        )
    return orphaned


class ReportListCreateView(APIView):
    pagination_class = ReportPagination
    throttle_classes = [AnonRateThrottle, UserRateThrottle, MethodScopedThrottle]
    throttle_scope = "reports"
    throttled_methods = ["POST"]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsPlatformAdmin()]

    def get(self, request):
        queryset = (
            Report.objects.select_related("reporter", "content_type", "escalated_by")
            .prefetch_related("content_object")
        )
        status_param = request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        is_escalated_param = request.query_params.get("is_escalated")
        if is_escalated_param is not None:
            queryset = queryset.filter(is_escalated=is_escalated_param.lower() == "true")

        content_type_param = request.query_params.get("content_type")
        if content_type_param:
            model_class = CONTENT_TYPE_MODEL_MAP.get(content_type_param.strip().lower())
            if model_class is None:
                return Response(
                    {"content_type": ["content_type must be one of: question, answer, comment."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            queryset = queryset.filter(content_type=ContentType.objects.get_for_model(model_class))

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ReportSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        content_type_str = str(request.data.get("content_type", "")).strip().lower()
        content_id = request.data.get("content_id")
        report_type = str(request.data.get("type", "")).strip().upper()
        description = request.data.get("description")

        errors = {}
        if not content_type_str:
            errors["content_type"] = ["This field is required."]
        elif content_type_str not in CONTENT_TYPE_MODEL_MAP:
            errors["content_type"] = ["content_type must be one of: question, answer, comment."]

        if not content_id:
            errors["content_id"] = ["This field is required."]

        if not report_type:
            errors["type"] = ["This field is required."]
        elif report_type not in Report.ReportType.values:
            errors["type"] = [f"type must be one of: {', '.join(Report.ReportType.values)}."]

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        model_class = CONTENT_TYPE_MODEL_MAP[content_type_str]
        try:
            content_object = model_class.objects.get(id=content_id)
        except (model_class.DoesNotExist, ValueError, TypeError, DjangoValidationError):
            return Response(
                {"content_id": ["No matching content found for this content_type and content_id."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content_type_obj = ContentType.objects.get_for_model(model_class)

        if Report.objects.filter(
            reporter=request.user, content_type=content_type_obj, object_id=content_object.pk
        ).exists():
            return Response(
                {"error": "You have already reported this content"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        report = Report.objects.create(
            reporter=request.user,
            type=report_type,
            content_type=content_type_obj,
            object_id=content_object.pk,
            description=description,
        )

        admin_users = User.objects.filter(is_admin=True, is_active=True).exclude(id=request.user.id)
        for admin in admin_users:
            notify(
                user=admin,
                notification_type=Notification.Type.NEW_REPORT,
                message=f"New {report_type.lower()} report submitted",
                content_object=report,
            )

        return Response(ReportCreateResponseSerializer(report).data, status=status.HTTP_201_CREATED)


class ResolveReportView(APIView):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def post(self, request, report_id):
        parsed_id = validate_uuid(report_id)
        try:
            report = Report.objects.select_related("content_type", "reporter").get(id=parsed_id)
        except Report.DoesNotExist:
            raise NotFound("Report not found")

        if report.status != Report.Status.PENDING:
            return Response(
                {"error": "This report has already been reviewed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        action = request.data.get("action", "NO_ACTION")

        # Captured up front: after the delete and refresh_from_db() below,
        # the cached content_type relation and the deleted instance's pk
        # can't be relied on.
        content_type_str = report.content_type.model
        content_id = report.object_id
        auto_resolved = []

        with transaction.atomic():
            if action == "DELETE_CONTENT":
                content_object = report.content_object
                if content_object is not None:
                    # Collected BEFORE the delete, afterwards the cascaded
                    # answers and comments (and their ids) are gone.
                    targets = _cascade_targets(content_type_str, content_object)
                    content_object.delete()
                    report.refresh_from_db()
                    auto_resolved = _auto_resolve_orphaned_reports(
                        targets, report.id, request.user
                    )

            report.status = Report.Status.RESOLVED
            report.resolved_by = request.user
            report.resolved_at = timezone.now()
            report.save(update_fields=["status", "resolved_by", "resolved_at", "updated_at"])

            log_admin_action(
                actor=request.user,
                action=AdminActionLog.Action.REPORT_RESOLVED,
                target_type="report",
                target_id=report.id,
                target_label=f"{report.type} report on {content_type_str}",
                metadata={
                    "action_taken": action,
                    "content_type": content_type_str,
                    "content_id": str(content_id),
                    "auto_resolved_count": len(auto_resolved),
                },
            )

        if report.reporter_id != request.user.id:
            notify(
                user=report.reporter,
                notification_type=Notification.Type.REPORT_REVIEWED,
                message=f"Your {report.type.lower()} report was resolved",
                content_object=report,
            )

        for orphan in auto_resolved:
            if orphan.reporter_id != request.user.id:
                notify(
                    user=orphan.reporter,
                    notification_type=Notification.Type.REPORT_REVIEWED,
                    message=f"Your {orphan.type.lower()} report was resolved",
                    content_object=orphan,
                )

        return Response({
            "message": "Report resolved",
            "status": "RESOLVED",
            "action_taken": action,
            "auto_resolved_count": len(auto_resolved),
            "resolved_at": report.resolved_at,
        })


class RejectReportView(APIView):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def post(self, request, report_id):
        parsed_id = validate_uuid(report_id)
        try:
            report = Report.objects.select_related("content_type", "reporter").get(id=parsed_id)
        except Report.DoesNotExist:
            raise NotFound("Report not found")

        if report.status != Report.Status.PENDING:
            return Response(
                {"error": "This report has already been reviewed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            report.status = Report.Status.REJECTED
            report.resolved_by = request.user
            report.resolved_at = timezone.now()
            report.save(update_fields=["status", "resolved_by", "resolved_at", "updated_at"])

            log_admin_action(
                actor=request.user,
                action=AdminActionLog.Action.REPORT_REJECTED,
                target_type="report",
                target_id=report.id,
                target_label=f"{report.type} report on {report.content_type.model}",
                metadata={
                    "content_type": report.content_type.model,
                    "content_id": str(report.object_id),
                },
            )

        if report.reporter_id != request.user.id:
            notify(
                user=report.reporter,
                notification_type=Notification.Type.REPORT_REVIEWED,
                message=f"Your {report.type.lower()} report was rejected",
                content_object=report,
            )

        return Response({
            "message": "Report rejected",
            "status": "REJECTED",
            "resolved_at": report.resolved_at,
        })


class EscalateReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, report_id):
        parsed_id = validate_uuid(report_id)
        try:
            report = Report.objects.select_related("content_type").get(id=parsed_id)
        except Report.DoesNotExist:
            raise NotFound("Report not found")

        if report.status != Report.Status.PENDING:
            return Response(
                {"error": "This report has already been reviewed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if report.is_escalated:
            return Response(
                {"error": "This report has already been escalated"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content_object = report.content_object
        if content_object is None:
            return Response(
                {"error": "The reported content no longer exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        hub = _get_hub_for_content(report.content_type.model, content_object)

        if not (
            request.user.is_admin
            or (hub is not None and user_is_moderator_or_representative_for_hub(request.user, hub.id))
        ):
            return Response(
                {"error": "You do not have permission to perform this action"},
                status=status.HTTP_403_FORBIDDEN,
            )

        report.is_escalated = True
        report.escalated_by = request.user
        report.save(update_fields=["is_escalated", "escalated_by", "updated_at"])

        admin_users = User.objects.filter(is_admin=True, is_active=True).exclude(id=request.user.id)
        for admin in admin_users:
            notify(
                user=admin,
                notification_type=Notification.Type.NEW_REPORT,
                message=f"Escalated by a moderator: {report.type.lower()} report needs priority review",
                content_object=report,
            )

        return Response(ReportSerializer(report).data, status=status.HTTP_200_OK)