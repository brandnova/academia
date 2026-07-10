from rest_framework import serializers

from apps.accounts.models import User
from apps.hubs.models import Hub
from apps.schools.models import Department, School

from .models import Question


class QuestionAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "avatar"]


class QuestionHubSchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ["name", "short_name", "slug"]


class QuestionHubSerializer(serializers.ModelSerializer):
    school = QuestionHubSchoolSerializer(read_only=True)

    class Meta:
        model = Hub
        fields = ["id", "school"]


class QuestionDepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name"]


class QuestionListSerializer(serializers.ModelSerializer):
    author = QuestionAuthorSerializer(read_only=True)
    hub = QuestionHubSerializer(read_only=True)
    department = QuestionDepartmentSerializer(read_only=True)
    tags = serializers.ListField(read_only=True)
    answer_count = serializers.IntegerField(read_only=True)
    best_answer_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Question
        fields = [
            "id", "title", "slug", "body", "status", "view_count", "author", "hub",
            "department", "tags", "answer_count", "best_answer_id",
            "created_at", "updated_at",
        ]


class QuestionDetailSerializer(QuestionListSerializer):
    answers = serializers.SerializerMethodField()

    class Meta(QuestionListSerializer.Meta):
        fields = QuestionListSerializer.Meta.fields + ["answers"]

    def get_answers(self, obj):
        from apps.answers.serializers import AnswerSerializer
        return AnswerSerializer(obj.answers.all(), many=True).data


def _sync_tags(question, tag_names):
    from apps.tags.models import QuestionTag, Tag

    if tag_names is None:
        return

    normalized_names = []
    for raw_name in tag_names:
        name = raw_name.strip().lower()
        if name:
            normalized_names.append(name)

    QuestionTag.objects.filter(question=question).delete()
    for name in normalized_names:
        tag, _ = Tag.objects.get_or_create(name=name)
        QuestionTag.objects.create(question=question, tag=tag)


class QuestionCreateSerializer(serializers.ModelSerializer):
    hub_id = serializers.UUIDField()
    department_id = serializers.UUIDField(required=False, allow_null=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Question
        fields = ["title", "body", "hub_id", "department_id", "tags"]

    def validate_title(self, value):
        return value.strip()

    def validate_hub_id(self, value):
        try:
            hub = Hub.objects.get(id=value, is_active=True)
        except Hub.DoesNotExist:
            raise serializers.ValidationError("Hub with this ID does not exist.")
        return hub

    def validate(self, attrs):
        department_id = attrs.get("department_id")
        if department_id:
            hub = attrs.get("hub_id")
            try:
                department = Department.objects.get(id=department_id, is_active=True)
            except Department.DoesNotExist:
                raise serializers.ValidationError(
                    {"department_id": ["Department does not belong to this hub's school."]}
                )
            if hub and department.school_id != hub.school_id:
                raise serializers.ValidationError(
                    {"department_id": ["Department does not belong to this hub's school."]}
                )
            attrs["department_id"] = department
        return attrs

    def create(self, validated_data):
        tag_names = validated_data.pop("tags", None)
        hub = validated_data.pop("hub_id")
        department = validated_data.pop("department_id", None)
        question = Question.objects.create(
            hub=hub,
            department=department,
            author=self.context["request"].user,
            **validated_data,
        )
        _sync_tags(question, tag_names)
        return question


class QuestionUpdateSerializer(serializers.ModelSerializer):
    department_id = serializers.UUIDField(required=False, allow_null=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Question
        fields = ["title", "body", "department_id", "tags"]

    def validate_title(self, value):
        return value.strip()

    def validate(self, attrs):
        department_id = attrs.get("department_id")
        if department_id:
            try:
                department = Department.objects.get(id=department_id, is_active=True)
            except Department.DoesNotExist:
                raise serializers.ValidationError(
                    {"department_id": ["Department does not belong to this hub's school."]}
                )
            if department.school_id != self.instance.hub.school_id:
                raise serializers.ValidationError(
                    {"department_id": ["Department does not belong to this hub's school."]}
                )
            attrs["department_id"] = department
        return attrs

    def update(self, instance, validated_data):
        tag_names = validated_data.pop("tags", None)
        department = validated_data.pop("department_id", "unset")
        if department != "unset":
            instance.department = department
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        _sync_tags(instance, tag_names)
        return instance
