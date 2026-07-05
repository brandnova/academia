from rest_framework import serializers

from apps.accounts.models import User

from .models import Report


class ReporterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name"]


class ReportCreateResponseSerializer(serializers.ModelSerializer):
    content_type = serializers.SerializerMethodField()
    content_id = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = ["id", "content_type", "content_id", "type", "description", "status", "created_at"]

    def get_content_type(self, obj):
        return obj.content_type.model

    def get_content_id(self, obj):
        return obj.object_id


class ReportSerializer(ReportCreateResponseSerializer):
    reporter = ReporterSerializer(read_only=True)

    class Meta(ReportCreateResponseSerializer.Meta):
        fields = ReportCreateResponseSerializer.Meta.fields + ["reporter"]
