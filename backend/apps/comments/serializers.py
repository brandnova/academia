from rest_framework import serializers

from apps.accounts.models import User
from apps.answers.models import Answer

from .models import Comment


class CommentAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "avatar"]


class CommentAnswerMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ["id"]


class CommentSerializer(serializers.ModelSerializer):
    author = CommentAuthorSerializer(read_only=True)
    answer = CommentAnswerMiniSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "body", "author", "answer", "created_at", "updated_at"]


class CommentCreateSerializer(serializers.ModelSerializer):
    answer_id = serializers.UUIDField()

    class Meta:
        model = Comment
        fields = ["answer_id", "body"]

    def validate_answer_id(self, value):
        try:
            answer = Answer.objects.get(id=value)
        except Answer.DoesNotExist:
            raise serializers.ValidationError("Answer with this ID does not exist.")
        return answer

    def create(self, validated_data):
        answer = validated_data.pop("answer_id")
        return Comment.objects.create(
            answer=answer,
            author=self.context["request"].user,
            **validated_data,
        )


class CommentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["body"]
