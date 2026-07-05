from rest_framework import serializers

from apps.questions.models import Question
from apps.questions.serializers import QuestionAuthorSerializer, QuestionHubSerializer


class SearchQuestionSerializer(serializers.ModelSerializer):
    author = QuestionAuthorSerializer(read_only=True)
    hub = QuestionHubSerializer(read_only=True)
    tags = serializers.ListField(read_only=True)
    score = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ["id", "title", "body", "status", "score", "author", "hub", "tags", "created_at"]

    def get_score(self, obj):
        rank = getattr(obj, "rank", None)
        if rank is None:
            return None
        return round(float(rank), 4)
