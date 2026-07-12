from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    moderator_for = serializers.SerializerMethodField()
    representative_for = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "avatar", "is_admin",
            "moderator_for", "representative_for", "created_at",
        ]
        read_only_fields = fields

    def get_moderator_for(self, obj):
        from apps.hubs.models import ModeratorAssignment
        assignments = ModeratorAssignment.objects.filter(
            user=obj, is_active=True
        ).select_related("hub__school")
        return [
            {
                "hub_id": str(a.hub_id),
                "school": {
                    "id": str(a.hub.school_id),
                    "name": a.hub.school.name,
                    "slug": a.hub.school.slug,
                },
            }
            for a in assignments
        ]

    def get_representative_for(self, obj):
        from apps.hubs.models import SchoolRepresentativeAssignment
        assignments = SchoolRepresentativeAssignment.objects.filter(
            user=obj, is_active=True
        ).select_related("hub__school")
        return [
            {
                "hub_id": str(a.hub_id),
                "school": {
                    "id": str(a.hub.school_id),
                    "name": a.hub.school.name,
                    "slug": a.hub.school.slug,
                },
            }
            for a in assignments
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "avatar", "is_admin", "is_active", "created_at"]
        read_only_fields = fields


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["is_active"]


class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "email", "avatar"]
        read_only_fields = fields
