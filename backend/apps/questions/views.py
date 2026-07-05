from django.db.models import Q
from django.http import Http404
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from apps.core.throttling import MethodScopedThrottle

from .models import Question
from .pagination import QuestionPagination
from .serializers import (
    QuestionCreateSerializer,
    QuestionDetailSerializer,
    QuestionListSerializer,
    QuestionUpdateSerializer,
)


class QuestionListCreateView(generics.ListCreateAPIView):
    pagination_class = QuestionPagination
    throttle_classes = [AnonRateThrottle, UserRateThrottle, MethodScopedThrottle]
    throttle_scope = "question_create"
    throttled_methods = ["POST"]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return QuestionCreateSerializer
        return QuestionListSerializer

    def get_queryset(self):
        queryset = Question.objects.select_related("author", "hub__school", "department")

        hub = self.request.query_params.get("hub")
        if hub:
            queryset = queryset.filter(hub_id=hub)

        department = self.request.query_params.get("department")
        if department:
            queryset = queryset.filter(department_id=department)

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(body__icontains=search))

        tag = self.request.query_params.get("tag")
        if tag:
            queryset = queryset.filter(question_tags__tag__name=tag.strip().lower()).distinct()

        ordering_map = {
            "created_at": "created_at",
            "-created_at": "-created_at",
            "views": "view_count",
            "-views": "-view_count",
        }
        ordering = ordering_map.get(self.request.query_params.get("ordering"))
        if ordering:
            queryset = queryset.order_by(ordering)

        return queryset

    def create(self, request, *args, **kwargs):
        write_serializer = self.get_serializer(data=request.data, context={"request": request})
        write_serializer.is_valid(raise_exception=True)
        question = write_serializer.save()
        return Response(QuestionDetailSerializer(question).data, status=status.HTTP_201_CREATED)


class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.select_related("author", "hub__school", "department")
    lookup_field = "id"
    lookup_url_kwarg = "question_id"

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return QuestionUpdateSerializer
        return QuestionDetailSerializer

    def get_object(self):
        try:
            return super().get_object()
        except Http404:
            raise NotFound("Question not found")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Question.objects.filter(id=instance.id).update(view_count=instance.view_count + 1)
        instance.refresh_from_db(fields=["view_count"])
        return Response(QuestionDetailSerializer(instance).data)

    def patch(self, request, *args, **kwargs):
        question = self.get_object()
        if question.author_id != request.user.id:
            raise PermissionDenied("You do not have permission to edit this question")
        write_serializer = self.get_serializer(question, data=request.data, partial=True)
        write_serializer.is_valid(raise_exception=True)
        question = write_serializer.save()
        return Response(QuestionDetailSerializer(question).data)

    def delete(self, request, *args, **kwargs):
        question = self.get_object()
        if question.author_id != request.user.id:
            raise PermissionDenied("You do not have permission to delete this question")
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UnansweredQuestionsView(generics.ListAPIView):
    """
    Admins see unanswered questions across all hubs. Moderators see unanswered
    questions only for hubs they are actively assigned to moderate. A user who
    is neither is blocked with a 403.
    """
    serializer_class = QuestionListSerializer
    pagination_class = QuestionPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Question.objects.filter(status=Question.Status.OPEN).select_related(
            "author", "hub__school", "department"
        )

        if not user.is_admin:
            from apps.hubs.models import ModeratorAssignment
            moderated_hub_ids = list(
                ModeratorAssignment.objects.filter(user=user, is_active=True).values_list("hub_id", flat=True)
            )
            if not moderated_hub_ids:
                raise PermissionDenied("You do not have permission to view unanswered questions")
            queryset = queryset.filter(hub_id__in=moderated_hub_ids)

        hub = self.request.query_params.get("hub")
        if hub:
            queryset = queryset.filter(hub_id=hub)

        return queryset
