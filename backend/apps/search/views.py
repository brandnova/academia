from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.db.models import Case, FloatField, IntegerField, Value, When
from django.db.models.functions import Coalesce
from django.db.models import Max
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle, UserRateThrottle

from apps.questions.models import Question

from .pagination import SearchPagination
from .serializers import SearchQuestionSerializer


class SearchQuestionsView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle, ScopedRateThrottle]
    throttle_scope = "search"

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        queryset = Question.objects.select_related("author", "hub__school", "department")

        hub = request.query_params.get("hub")
        if hub:
            queryset = queryset.filter(hub_id=hub)

        school = request.query_params.get("school")
        if school:
            queryset = queryset.filter(hub__school_id=school)

        department = request.query_params.get("department")
        if department:
            queryset = queryset.filter(department_id=department)

        tag = request.query_params.get("tag")
        if tag:
            queryset = queryset.filter(question_tags__tag__name=tag.strip().lower()).distinct()

        queryset = queryset.annotate(
            is_solved=Case(
                When(status=Question.Status.SOLVED, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            ),
            top_vote=Coalesce(Max("answers__vote_score"), Value(0)),
        )

        if q:
            vector = SearchVector("title", weight="A") + SearchVector("body", weight="B")
            search_query = SearchQuery(q)
            queryset = queryset.annotate(rank=SearchRank(vector, search_query)).filter(rank__gt=0)
            ordering = ("-is_solved", "-top_vote", "-created_at", "-rank")
        else:
            queryset = queryset.annotate(rank=Value(None, output_field=FloatField()))
            ordering = ("-is_solved", "-top_vote", "-created_at")

        queryset = queryset.order_by(*ordering)

        paginator = SearchPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = SearchQuestionSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
