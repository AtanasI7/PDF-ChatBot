from django.db import transaction
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import ChatSession, Message
from .serializers import ChatSessionSerializer, MessageSerializer, AskSerializer
from apps.agent.services import AgentService


class ChatSessionViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ChatSessionSerializer

    def get_queryset(self):
        return ChatSession.objects.select_related("document").filter(owner=self.request.user)

    @action(detail=True, methods=["get"], url_path="messages")
    def messages(self, request, pk=None):
        session = self.get_object()
        qs = session.messages.all()
        serializer = MessageSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="ask")
    def ask(self, request, pk=None):
        session = self.get_object()

        serializer = AskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.validated_data["question"]

        # взимаме последните N съобщения за контекст (за начало 20)
        history_qs = session.messages.order_by("-created_at")[:20]
        history = [
            {"role": m.role, "content": m.content}
            for m in reversed(list(history_qs))
        ]

        document_path = session.document.file.path

        with transaction.atomic():
            # 1) записваме user message
            Message.objects.create(
                session=session,
                role=Message.Role.USER,
                content=question,
                metadata={},
            )

            # 2) питаме агента
            answer, meta = AgentService.ask(
                document_id=session.document.id,
                pdf_path=session.document.file.path,
                question=question,
                chat_history=history,
            )

            # 3) записваме assistant message
            assistant_msg = Message.objects.create(
                session=session,
                role=Message.Role.ASSISTANT,
                content=answer,
                metadata=meta or {},
            )

        return Response(
            {
                "answer": assistant_msg.content,
                "metadata": assistant_msg.metadata,
                "message_id": assistant_msg.id,
                "session_id": session.id,
            },
            status=status.HTTP_200_OK,
        )