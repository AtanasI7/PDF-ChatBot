from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models

class User(AbstractUser):
    email = models.EmailField(
        "email address",
        unique=True
    )

    def __str__(self) -> str:
        return self.email