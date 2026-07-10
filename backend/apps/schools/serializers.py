from rest_framework import serializers

from .models import Department, School


class DepartmentSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Department
        fields = ["id", "name", "code", "question_count", "is_active"]


class DepartmentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["name", "code"]

    def validate_name(self, value):
        return value.strip()


class DepartmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["name", "code", "is_active"]

    def validate_name(self, value):
        return value.strip()


class SchoolListSerializer(serializers.ModelSerializer):
    has_hub = serializers.BooleanField(read_only=True)

    class Meta:
        model = School
        fields = ["id", "name", "short_name", "slug", "location", "website", "has_hub", "created_at"]


class SchoolDetailSerializer(serializers.ModelSerializer):
    has_hub = serializers.BooleanField(read_only=True)
    departments = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = [
            "id", "name", "short_name", "slug", "location", "website",
            "has_hub", "departments", "verification_status", "created_at",
        ]

    def get_departments(self, obj):
        departments = obj.departments.filter(is_active=True)
        return DepartmentSerializer(departments, many=True).data


class SchoolWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ["name", "short_name", "location", "website"]

    def validate_name(self, value):
        return value.strip()

    def validate_short_name(self, value):
        return value.strip().upper()
