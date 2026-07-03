from rest_framework import serializers

from apps.accounts.models import User
from apps.schools.models import Department, School

from .models import Hub, HubActivationRequest


class SchoolMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ["id", "name", "short_name"]


class HubSchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ["id", "name", "short_name", "location"]


class HubDepartmentSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Department
        fields = ["id", "name", "code", "question_count"]


class HubDetailSerializer(serializers.ModelSerializer):
    school = HubSchoolSerializer(read_only=True)
    departments = serializers.SerializerMethodField()
    question_count = serializers.IntegerField(read_only=True)
    moderator_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Hub
        fields = [
            "id", "school", "is_active", "activated_at",
            "departments", "question_count", "moderator_count",
        ]

    def get_departments(self, obj):
        departments = obj.school.departments.filter(is_active=True)
        return HubDepartmentSerializer(departments, many=True).data


class ActivationRequestUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name"]


class HubActivationRequestSerializer(serializers.ModelSerializer):
    school = SchoolMiniSerializer(read_only=True)
    user = ActivationRequestUserSerializer(read_only=True)

    class Meta:
        model = HubActivationRequest
        fields = ["id", "school", "user", "status", "notes", "created_at"]


class HubActivationRequestCreateSerializer(serializers.ModelSerializer):
    school_id = serializers.UUIDField()

    class Meta:
        model = HubActivationRequest
        fields = ["school_id", "notes"]

    def validate_school_id(self, value):
        try:
            school = School.objects.get(id=value, is_active=True)
        except School.DoesNotExist:
            raise serializers.ValidationError("School not found.")
        if hasattr(school, "hub") and school.hub.is_active:
            raise serializers.ValidationError("This school already has an active hub.")
        if HubActivationRequest.objects.filter(
            school=school, status=HubActivationRequest.Status.PENDING
        ).exists():
            raise serializers.ValidationError(
                "There is already a pending activation request for this school."
            )
        return value

    def create(self, validated_data):
        school = School.objects.get(id=validated_data["school_id"])
        return HubActivationRequest.objects.create(
            school=school,
            user=self.context["request"].user,
            notes=validated_data.get("notes"),
        )
