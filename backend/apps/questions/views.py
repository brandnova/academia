from django.core.cache import cache
from django.db.models import F, Q
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from apps.core.throttling import MethodScopedThrottle
from apps.core.utils import validate_uuid

from .models import Question, QuestionFollow
from .pagination import QuestionPagination
from .serializers import (
    QuestionCreateSerializer,
    QuestionDetailSerializer,
    QuestionListSerializer,
    QuestionUpdateSerializer,
)

VIEW_DEDUP_TTL_SECONDS = 60 * 60 * 24  # 24 hours, rolling window not calendar-day


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

        author = self.request.query_params.get("author")
        if author:
            author_id = validate_uuid(author)
            queryset = queryset.filter(author_id=author_id)

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
        return Response(
            QuestionDetailSerializer(question, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class QuestionDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_question(self, question_id):
        parsed_id = validate_uuid(question_id)
        try:
            return Question.objects.select_related("author", "hub__school", "department").get(id=parsed_id)
        except Question.DoesNotExist:
            raise NotFound("Question not found")

    def get(self, request, question_id):
        question = self.get_question(question_id)

        if request.user and request.user.is_authenticated:
            cache_key = f"question_view:{question.id}:user:{request.user.id}"
            if cache.get(cache_key) is None:
                Question.objects.filter(id=question.id).update(view_count=F("view_count") + 1)
                question.refresh_from_db(fields=["view_count"])
                cache.set(cache_key, True, timeout=VIEW_DEDUP_TTL_SECONDS)

        return Response(QuestionDetailSerializer(question, context={"request": request}).data)

    def patch(self, request, question_id):
        question = self.get_question(question_id)
        if question.author_id != request.user.id:
            raise PermissionDenied("You do not have permission to edit this question")
        write_serializer = QuestionUpdateSerializer(question, data=request.data, partial=True)
        write_serializer.is_valid(raise_exception=True)
        question = write_serializer.save()
        return Response(QuestionDetailSerializer(question, context={"request": request}).data)

    def delete(self, request, question_id):
        question = self.get_question(question_id)
        if question.author_id != request.user.id:
            raise PermissionDenied("You do not have permission to delete this question")
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UnansweredQuestionsView(generics.ListAPIView):
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


class QuestionFollowView(APIView):
    permission_classes = [IsAuthenticated]

    def get_question(self, question_id):
        parsed_id = validate_uuid(question_id)
        try:
            return Question.objects.get(id=parsed_id)
        except Question.DoesNotExist:
            raise NotFound("Question not found")

    def post(self, request, question_id):
        question = self.get_question(question_id)
        follow, created = QuestionFollow.objects.get_or_create(user=request.user, question=question)
        if not created:
            return Response(
                {"error": "You are already following this question"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"message": "Now following question", "is_following": True},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, question_id):
        question = self.get_question(question_id)
        deleted, _ = QuestionFollow.objects.filter(user=request.user, question=question).delete()
        if not deleted:
            return Response(
                {"error": "You have not followed this question"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class QuestionLockView(APIView):
    permission_classes = [IsAuthenticated]

    def get_question(self, question_id):
        parsed_id = validate_uuid(question_id)
        try:
            return Question.objects.get(id=parsed_id)
        except Question.DoesNotExist:
            raise NotFound("Question not found")

    def check_lock_permission(self, user, question):
        if user.is_admin:
            return True

        from apps.hubs.models import ModeratorAssignment, SchoolRepresentativeAssignment
        
        # Check moderator
        if ModeratorAssignment.objects.filter(hub=question.hub, user=user, is_active=True).exists():
            return True

        # Check school representative
        if SchoolRepresentativeAssignment.objects.filter(hub=question.hub, user=user, is_active=True).exists():
            return True

        return False

    def post(self, request, question_id):
        question = self.get_question(question_id)
        if not self.check_lock_permission(request.user, question):
            raise PermissionDenied("You do not have permission to lock this question")

        if question.is_locked:
            return Response(
                {"error": "Question is already locked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        question.is_locked = True
        question.save(update_fields=["is_locked"])
        return Response(
            {"message": "Question locked successfully", "is_locked": True},
            status=status.HTTP_200_OK,
        )

    def delete(self, request, question_id):
        question = self.get_question(question_id)
        if not self.check_lock_permission(request.user, question):
            raise PermissionDenied("You do not have permission to unlock this question")

        if not question.is_locked:
            return Response(
                {"error": "Question is not locked"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        question.is_locked = False
        question.save(update_fields=["is_locked"])
        return Response(
            {"message": "Question unlocked successfully", "is_locked": False},
            status=status.HTTP_200_OK,
        )
