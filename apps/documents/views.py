from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from apps.agent.services import AgentServiceDBMemory
from .models import Document
from .serializers import DocumentSerializer, DocumentListSerializer
from ..chats.models import ChatSession


class DocumentViewSet(ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        if self.action == "list":
            return DocumentListSerializer
        return DocumentSerializer

    def perform_create(self, serializer):
        document = serializer.save(
            owner=self.request.user,
            status=Document.StatusInfo.PROCESSING,
        )

        try:
            index_dir = AgentServiceDBMemory.build_document_index(document)
            document.index_dir = index_dir
            document.status = Document.StatusInfo.READY
            document.save(update_fields=["index_dir", "status"])
        except Exception as exc:
            document.status = Document.StatusInfo.FAILED
            document.save(update_fields=["status"])
            raise ValidationError(
                {"detail": f"Document uploaded but indexing failed: {str(exc)}"}
            )

    # TODO: imam samo edit na title, trqbwa li mi towa?
    def perform_update(self, serializer):
        old_document = self.get_object()
        old_file_name = old_document.file.name if old_document.file else None

        document = serializer.save()

        file_changed = False
        if document.file and old_file_name != document.file.name:
            file_changed = True

        if not file_changed:
            return

        document.status = Document.StatusInfo.PROCESSING
        document.save(update_fields=["status"])

        try:
            index_dir = AgentServiceDBMemory.rebuild_document_index(document)
            document.index_dir = index_dir
            document.status = Document.StatusInfo.READY
            document.save(update_fields=["index_dir", "status"])
        except Exception as exc:
            document.status = Document.StatusInfo.FAILED
            document.save(update_fields=["status"])
            raise ValidationError(
                {"detail": f"Document updated but re-indexing failed: {str(exc)}"}
            )

    def perform_destroy(self, instance):
        AgentServiceDBMemory.delete_document_index(instance)

        if instance.file:
            instance.file.delete(save=False)

        instance.delete()

    @action(detail=True, methods=["post"], url_path="chat")
    def chat(self, request, pk=None):
        document = self.get_object()

        chat, created = ChatSession.objects.get_or_create(
            document=document,
            defaults={
                "owner": request.user,
                "title": document.title,
            },
        )

        return Response(
            {
                "chat_id": chat.id,
                "document_id": document.id,
                "created": created,
                "title": chat.title,
            }
        )