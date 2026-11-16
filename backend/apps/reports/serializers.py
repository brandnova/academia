from rest_framework import serializers

from apps.accounts.models import User
from apps.core.content_links import get_link_target

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


class ReportContentMixin:
    """content_exists and link_target, shared by the admin and the
    reporter-facing serializers."""

    def get_content_exists(self, obj):
        # False when the reported content was deleted by some path that
        # doesn't auto-resolve its reports (e.g. an author deleting their
        # own question).
        return obj.content_object is not None

    def get_link_target(self, obj):
        # None when the content is gone, so a deleted item never produces a
        # broken link.
        return get_link_target(obj.content_object)


class ReportSerializer(ReportContentMixin, ReportCreateResponseSerializer):
    reporter = ReporterSerializer(read_only=True)
    escalated_by = ReporterSerializer(read_only=True)
    content_exists = serializers.SerializerMethodField()
    link_target = serializers.SerializerMethodField()

    class Meta(ReportCreateResponseSerializer.Meta):
        fields = ReportCreateResponseSerializer.Meta.fields + [
            "reporter", "is_escalated", "escalated_by", "content_exists", "link_target",
        ]


class MyReportSerializer(ReportContentMixin, ReportCreateResponseSerializer):
    """What a user sees of their OWN reports. Deliberately leaves out
    everything about the review itself: who reviewed it, whether a moderator
    escalated it, who the reporter was (always the requester). Showing
    those would expose moderator and admin activity, and the project's
    privacy design is that reporting is private in both directions."""
    content_exists = serializers.SerializerMethodField()
    link_target = serializers.SerializerMethodField()

    class Meta(ReportCreateResponseSerializer.Meta):
        fields = ReportCreateResponseSerializer.Meta.fields + [
            "resolved_at", "content_exists", "link_target",
        ]