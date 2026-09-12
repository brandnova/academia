from rest_framework import serializers

from .models import Department, School, SchoolSourceRecord


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
        fields = [
            "id", "name", "short_name", "slug", "location", "website", "is_active", "has_hub",
            "institution_type", "ownership", "state", "country", "created_at",
        ]


class SchoolDetailSerializer(serializers.ModelSerializer):
    has_hub = serializers.BooleanField(read_only=True)
    departments = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = [
            "id", "name", "short_name", "slug", "location", "website", "is_active",
            "has_hub", "departments", "verification_status", "created_at",
            "institution_type", "ownership", "state", "country",
            "regulatory_code", "source_url", "last_verified_at",
        ]

    def get_departments(self, obj):
        departments = obj.departments.filter(is_active=True)
        return DepartmentSerializer(departments, many=True).data


class SchoolWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = [
            "name", "short_name", "location", "website", "is_active",
            "institution_type", "ownership", "state", "country",
            "regulatory_code", "source_url", "last_verified_at",
        ]

    def validate_name(self, value):
        return value.strip()

    def validate_short_name(self, value):
        return value.strip().upper()


class SchoolSourceRecordSerializer(serializers.ModelSerializer):
    """Not wired to a view yet in this phase, no endpoint exposes it
    directly, admin uses the inline instead. Defined here now since the
    import command (next phase) will need it for its own internal writes."""

    class Meta:
        model = SchoolSourceRecord
        fields = [
            "id", "school", "regulator", "raw_category", "raw_payload",
            "source_url", "fetched_at", "is_current", "created_at", "updated_at",
        ]
