from rest_framework.routers import DefaultRouter
from .views import ChatSessionViewSet

router = DefaultRouter()
router.register(r"", ChatSessionViewSet, basename="chats")

urlpatterns = router.urls