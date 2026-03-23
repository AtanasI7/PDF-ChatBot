from rest_framework import serializers

from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "file",
            "status",
            "index_dir",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "index_dir",
            "created_at",
            "updated_at",
        ]

class DocumentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "status",
            "created_at",
            "updated_at",
        ]