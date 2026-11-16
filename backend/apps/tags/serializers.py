from rest_framework import serializers

from .models import Tag


class TagSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = ["id", "name", "question_count"]

    def get_question_count(self, obj):
        # TagListView annotates qcount on its queryset, reuse it instead of
        # running one count query per tag. Other callers (the merge and
        # rename responses) serialize a plain Tag, so they fall back to
        # counting.
        annotated = getattr(obj, "qcount", None)
        if annotated is not None:
            return annotated
        return obj.question_tags.count()