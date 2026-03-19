from rest_framework import serializers
from apps.documents.models import Document
from .models import ChatSession, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            "id",
            "role",
            "content",
            "metadata",
            "created_at"
        ]
        read_only_fields = ["id", "created_at"]

class ChatSessionListSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source="document.title", read_only=True)
    document_id = serializers.CharField(source="document.i", read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            "id",
            "title",
            "document_id",
            "document_title",
            "created_at",
            "updated_at",
        ]

class ChatSessionDetailSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source="document.title", read_only=True)
    document_id = serializers.IntegerField(source="document.id", read_only=True)
    document_file = serializers.CharField(source="document.file", read_only=True)
    messages_count = serializers.IntegerField(source="messages.count", read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            "id",
            "title",
            "document_id",
            "document_title",
            "document_file",
            "messages_count",
            "created_at",
            "updated_at",
        ]

class ChatSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ["id", "title", "document"]
        read_only_fields = ["id"]

    def validate_document(self, document: Document):
        request = self.context["request"]

        if document.owner_id != request.user.id:
            raise serializers.ValidationError("You can only create a chat for your own document.")
        return document

    def create(self, validated_data):
        request = self.context["request"]
        document = validated_data["document"]

        chat, _created = ChatSession.objects.get_or_create(
            document=document,
            defaults={
                "owner": request.user,
                "title": validated_data.get("title", "") or document.title,
            },
        )
        return chat


# Original
class ChatSessionSerializer(serializers.ModelSerializer):

    document_title = serializers.CharField(source="document.title", read_only=True)
    document_file = serializers.FileField(source="document.file", read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            "id",
            "title",
            "document",
            "document_title",
            "document_file",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "document_title", "document_file"]

    def validate_document(self, document: Document):
        request = self.context["request"]
        if document.owner_id != request.user.id:
            raise serializers.ValidationError("You can only create a chat for your own document.")
        return document

    def create(self, validated_data):
        """
        Ако вече има chat за този документ -> връщаме съществуващия (идемпотентно поведение).
        Това е удобно за фронтенд: при open на document -> "дай ми чат" без да мисли дали има.
        """
        request = self.context["request"]
        document = validated_data["document"]

        chat, _created = ChatSession.objects.get_or_create(
            document=document,
            defaults={
                "owner": request.user,
                "title": validated_data.get("title", "") or document.title,
            },
        )
        return chat


class AskSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=5000)