from rest_framework import serializers

from apps.accounts.models import User

from .models import StaticPage


class StaticPageAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name"]


class StaticPageListSerializer(serializers.ModelSerializer):
    created_by = StaticPageAuthorSerializer(read_only=True)

    class Meta:
        model = StaticPage
        fields = ["id", "title", "slug", "visibility", "is_published", "created_by", "updated_at"]


class StaticPageDetailSerializer(StaticPageListSerializer):
    class Meta(StaticPageListSerializer.Meta):
        fields = StaticPageListSerializer.Meta.fields + ["body", "created_at"]


class StaticPageWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaticPage
        fields = ["title", "body", "visibility", "is_published"]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("This field may not be blank.")
        return value

    def create(self, validated_data):
        return StaticPage.objects.create(
            created_by=self.context["request"].user,
            **validated_data,
        )


class StaticPageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaticPage
        fields = ["title", "body", "visibility", "is_published"]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("This field may not be blank.")
        return value
