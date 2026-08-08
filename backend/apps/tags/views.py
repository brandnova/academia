from django.conf import settings
from django.db.models import Count, Q
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.cache import get_cached, invalidate_prefix, make_query_cache_key, set_cached
from apps.core.permissions import IsPlatformAdmin
from apps.core.utils import validate_uuid
from apps.questions.models import Question
from apps.questions.pagination import QuestionPagination
from apps.questions.serializers import QuestionListSerializer

from .models import QuestionTag, Tag
from .serializers import TagSerializer


class TagListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cache_key = make_query_cache_key("tag-list", request)
        cached = get_cached(cache_key)
        if cached is not None:
            return Response(cached)

        queryset = Tag.objects.annotate(qcount=Count("question_tags"))

        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search.strip().lower())

        popular = request.query_params.get("popular")
        if popular and popular.lower() == "true":
            queryset = queryset.order_by("-qcount", "name")
        else:
            queryset = queryset.order_by("name")

        data = {"results": TagSerializer(queryset, many=True).data}
        set_cached(cache_key, data, settings.CACHE_TTL_SHORT)
        return Response(data)


class TagQuestionsView(ListAPIView):
    serializer_class = QuestionListSerializer
    pagination_class = QuestionPagination
    permission_classes = [AllowAny]

    ORDERING_MAP = {
        "created_at": "created_at",
        "-created_at": "-created_at",
        "views": "view_count",
        "-views": "-view_count",
    }

    def get_queryset(self):
        tag_name = self.kwargs["tag_name"].strip().lower()
        queryset = Question.objects.filter(
            question_tags__tag__name=tag_name
        ).select_related("author", "hub__school", "department").distinct()

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

        ordering = self.ORDERING_MAP.get(self.request.query_params.get("ordering"))
        if ordering:
            queryset = queryset.order_by(ordering)

        return queryset


class TagDetailView(APIView):
    """Admin-only tag deletion. Blocked by default if the tag still has
    questions attached, pass ?force=true to delete anyway (this removes the
    tag from those questions via cascade, it does not delete the questions
    themselves)."""
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    http_method_names = ["delete", "options"]

    def get_tag(self, tag_id):
        parsed_id = validate_uuid(tag_id)
        try:
            return Tag.objects.get(id=parsed_id)
        except Tag.DoesNotExist:
            raise NotFound("Tag not found")

    def delete(self, request, tag_id):
        tag = self.get_tag(tag_id)
        question_count = tag.question_tags.count()
        force = str(request.query_params.get("force", "")).lower() == "true"

        if question_count > 0 and not force:
            noun = "question" if question_count == 1 else "questions"
            return Response(
                {
                    "error": (
                        f"This tag is attached to {question_count} {noun}. "
                        "Pass ?force=true to delete it anyway."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        tag.delete()
        invalidate_prefix("tag-list")
        return Response(status=status.HTTP_204_NO_CONTENT)


class TagMergeView(APIView):
    """Admin-only. Merges the tag in the URL into a target tag, reassigning
    every QuestionTag row and removing the source tag. The target can be
    given as an existing tag's id (target_tag_id) or as a name
    (target_name): if a tag with that name already exists, this behaves
    identically to target_tag_id; if it doesn't, the source tag is simply
    renamed in place, since a rename is just a merge into a name nobody
    holds yet. Only one of target_tag_id / target_name may be given."""
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def get_tag(self, tag_id):
        parsed_id = validate_uuid(tag_id)
        try:
            return Tag.objects.get(id=parsed_id)
        except Tag.DoesNotExist:
            raise NotFound("Tag not found")

    def post(self, request, tag_id):
        source_tag = self.get_tag(tag_id)

        target_tag_id = request.data.get("target_tag_id")
        target_name = request.data.get("target_name")

        if not target_tag_id and not target_name:
            return Response(
                {"error": "Provide either target_tag_id or target_name."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if target_tag_id and target_name:
            return Response(
                {"error": "Provide only one of target_tag_id or target_name, not both."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target_tag_id:
            parsed_target_id = validate_uuid(target_tag_id)
            try:
                target_tag = Tag.objects.get(id=parsed_target_id)
            except Tag.DoesNotExist:
                return Response(
                    {"target_tag_id": ["Tag with this ID does not exist."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if target_tag.id == source_tag.id:
                return Response(
                    {"error": "Cannot merge a tag into itself."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return self._merge(source_tag, target_tag)

        normalized_name = str(target_name).strip().lower()
        if not normalized_name:
            return Response(
                {"target_name": ["This field may not be blank."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_target = Tag.objects.filter(name=normalized_name).exclude(id=source_tag.id).first()
        if existing_target:
            return self._merge(source_tag, existing_target)

        source_tag.name = normalized_name
        source_tag.save(update_fields=["name", "updated_at"])
        invalidate_prefix("tag-list")
        return Response({
            "message": "Tag renamed successfully",
            "tag": TagSerializer(source_tag).data,
        })

    def _merge(self, source_tag, target_tag):
        source_question_tags = QuestionTag.objects.filter(tag=source_tag)
        existing_target_question_ids = set(
            QuestionTag.objects.filter(tag=target_tag).values_list("question_id", flat=True)
        )

        reassigned_count = 0
        for question_tag in source_question_tags:
            if question_tag.question_id in existing_target_question_ids:
                question_tag.delete()
            else:
                question_tag.tag = target_tag
                question_tag.save(update_fields=["tag"])
                reassigned_count += 1

        source_tag.delete()
        invalidate_prefix("tag-list")

        return Response({
            "message": "Tags merged successfully",
            "tag": TagSerializer(target_tag).data,
            "questions_reassigned": reassigned_count,
        })
