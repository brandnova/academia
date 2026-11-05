from rest_framework import serializers

from apps.core.content_links import get_link_target

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    related_object_type = serializers.SerializerMethodField()
    related_object_id = serializers.SerializerMethodField()
    link_target = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id", "type", "message", "is_read",
            "related_object_id", "related_object_type", "link_target", "created_at",
        ]

    def get_related_object_type(self, obj):
        return obj.content_type.model if obj.content_type_id else None

    def get_related_object_id(self, obj):
        return obj.object_id

    def get_link_target(self, obj):
        if not obj.content_type_id:
            return None
        return get_link_target(obj.content_object)