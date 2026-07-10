from rest_framework import serializers

from apps.accounts.models import User
from apps.questions.models import Question

from .models import Answer


class AnswerAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "avatar"]


class AnswerQuestionMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ["id", "title"]


class AnswerSerializer(serializers.ModelSerializer):
    """Used when nesting answers inside a question's detail response."""
    author = AnswerAuthorSerializer(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = [
            "id", "body", "is_best", "vote_score", "user_vote",
            "author", "comment_count", "created_at", "updated_at",
        ]

    def get_user_vote(self, obj):
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return None
        vote = obj.votes.filter(user=request.user).first()
        return vote.vote_type if vote else None


class AnswerResponseSerializer(AnswerSerializer):
    """Used for create/update responses, includes the parent question."""
    question = AnswerQuestionMiniSerializer(read_only=True)

    class Meta(AnswerSerializer.Meta):
        fields = [
            "id", "body", "question", "author", "is_best",
            "vote_score", "user_vote", "created_at", "updated_at",
        ]


class AnswerCreateSerializer(serializers.ModelSerializer):
    question_id = serializers.UUIDField()

    class Meta:
        model = Answer
        fields = ["question_id", "body"]

    def validate_question_id(self, value):
        try:
            question = Question.objects.get(id=value)
        except Question.DoesNotExist:
            raise serializers.ValidationError("Question with this ID does not exist.")
        return question

    def validate(self, attrs):
        question = attrs.get("question_id")
        if question and question.status == Question.Status.SOLVED:
            raise serializers.ValidationError(
                {"question": ["Cannot add answer to a solved question."]}
            )
        return attrs

    def create(self, validated_data):
        question = validated_data.pop("question_id")
        answer = Answer.objects.create(
            question=question,
            author=self.context["request"].user,
            **validated_data,
        )
        Question.objects.filter(id=question.id, status=Question.Status.OPEN).update(
            status=Question.Status.ANSWERED
        )
        return answer


class AnswerUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ["body"]
