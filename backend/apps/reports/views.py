from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError as DjangoValidationError
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
        queryset = Report.objects.select_related("reporter", "content_type", "escalated_by")
        status_param = request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        is_escalated_param = request.query_params.get("is_escalated")
        if is_escalated_param is not None:
            queryset = queryset.filter(is_escalated=is_escalated_param.lower() == "true")

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
            report = Report.objects.get(id=parsed_id)
        except Report.DoesNotExist:
            raise NotFound("Report not found")

        if report.status != Report.Status.PENDING:
            return Response(
                {"error": "This report has already been reviewed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        action = request.data.get("action", "NO_ACTION")

        if action == "DELETE_CONTENT":
            content_object = report.content_object
            if content_object is not None:
                content_object.delete()
                report.refresh_from_db()

        report.status = Report.Status.RESOLVED
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save(update_fields=["status", "resolved_by", "resolved_at", "updated_at"])

        return Response({
            "message": "Report resolved",
            "status": "RESOLVED",
            "action_taken": action,
            "resolved_at": report.resolved_at,
        })


class RejectReportView(APIView):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def post(self, request, report_id):
        parsed_id = validate_uuid(report_id)
        try:
            report = Report.objects.get(id=parsed_id)
        except Report.DoesNotExist:
            raise NotFound("Report not found")

        if report.status != Report.Status.PENDING:
            return Response(
                {"error": "This report has already been reviewed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        report.status = Report.Status.REJECTED
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save(update_fields=["status", "resolved_by", "resolved_at", "updated_at"])

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