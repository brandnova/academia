from rest_framework import serializers

from .models import Tag


class TagSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = ["id", "name", "question_count"]

    def get_question_count(self, obj):
        return obj.question_tags.count()
