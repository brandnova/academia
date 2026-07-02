from rest_framework import serializers

from .models import School


class SchoolListSerializer(serializers.ModelSerializer):
    has_hub = serializers.BooleanField(read_only=True)

    class Meta:
        model = School
        fields = ["id", "name", "short_name", "location", "website", "has_hub", "created_at"]


class SchoolDetailSerializer(serializers.ModelSerializer):
    has_hub = serializers.BooleanField(read_only=True)
    departments = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = [
            "id", "name", "short_name", "location", "website",
            "has_hub", "departments", "verification_status", "created_at",
        ]

    def get_departments(self, obj):
        # TODO(Phase 3): replace with real department serialization
        return []


class SchoolWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ["name", "short_name", "location", "website"]

    def validate_name(self, value):
        return value.strip()

    def validate_short_name(self, value):
        return value.strip().upper()
