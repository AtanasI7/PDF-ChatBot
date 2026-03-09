
from django.db import models

from django.conf import settings

from apps.chats.choices import Role
from apps.documents.models import Document


class ChatSession(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_sessions'
    )

    document = models.OneToOneField(
        Document,
        on_delete=models.CASCADE,
        related_name='chat_sessions'
    )

    title = models.CharField(
        max_length=255,
        blank=True,
        default=''
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.document_id and self.owner_id and self.document.owner_id != self.owner_id:
            raise ValueError('Document owner mismatch!')

    def __str__(self):
        return f"ChatSession#{self.id} ({self.owner_id})"

class Message(models.Model):
    class Role(models.TextChoices):
        SYSTEM = "system", "System"
        USER = "user", "User"
        ASSISTANT = "assistant", "Assistant"

    class Meta:
        ordering = ["created_at"]

    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name="messages",
    )

    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()

    # за sources, page numbers, chunk ids, token usage и т.н.
    metadata = models.JSONField(blank=True, default=dict)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message#{self.id} ({self.role})"