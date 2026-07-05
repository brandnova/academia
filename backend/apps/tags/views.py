from django.conf import settings
from django.db.models import Count, Q
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.cache import get_cached, make_query_cache_key, set_cached
from apps.questions.models import Question
from apps.questions.pagination import QuestionPagination
from apps.questions.serializers import QuestionListSerializer

from .models import Tag
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
