from django.db import models
from django.conf import settings


class Document(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="documents"
    )

    title = models.CharField(max_length=255)

    file = models.FileField(
        upload_to="documents/"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    status = models.CharField(
        choices=[
            ("uploaded", "Uploaded"),
            ("processing", "Processing"),
            ("ready", "Ready"),
            ("failed", "Failed")
        ]
    )

    def __str__(self):
        return f"{self.title} ({self.owner.email})"
