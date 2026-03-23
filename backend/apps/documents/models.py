from django.db import models
from django.conf import settings

class Document(models.Model):
    class StatusInfo(models.TextChoices):
        UPLOADED = 'uploaded', 'Uploaded'
        PROCESSING = 'processing', 'Processing'
        READY = 'ready', 'Ready'
        FAILED = 'failed', 'Failed'

    owner = models.ForeignKey(
        to=settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    title = models.CharField(
        max_length=255,
    )

    file = models.FileField(
        upload_to="documents/",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    status = models.CharField(
        max_length=20,
        choices=StatusInfo.choices,
        default=StatusInfo.UPLOADED,
    )

    index_dir = models.CharField(
        max_length=500,
        blank=True,
        default='',
    )

    def __str__(self):
        return f"{self.title} - {self.owner.email}"
