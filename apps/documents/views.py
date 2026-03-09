from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.agent.services import AgentService
from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        document = serializer.save(
            owner=self.request.user,
            status=Document.StatusInfo.PROCESSING,
        )

        try:
            index_dir = AgentService.build_document_index(document)
            document.index_dir = index_dir
            document.status = Document.StatusInfo.READY
            document.save(update_fields=["index_dir", "status"])
        except Exception as exc:
            document.status = Document.StatusInfo.FAILED
            document.save(update_fields=["status"])
            raise ValidationError(
                {"detail": f"Document uploaded but indexing failed: {str(exc)}"}
            )