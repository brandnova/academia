import logging

from django.core.cache import cache
from django.db import connection
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

logger = logging.getLogger(__name__)


@api_view(["GET"])
def health_check(request):
    checks = {"database": "ok", "cache": "ok"}

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:
        logger.exception("Health check: database connectivity failed")
        checks["database"] = "unavailable"

    try:
        cache.set("health-check-probe", "ok", 5)
        if cache.get("health-check-probe") != "ok":
            checks["cache"] = "degraded"
    except Exception:
        logger.exception("Health check: cache connectivity failed")
        checks["cache"] = "unavailable"

    # Cache failures degrade performance, not correctness (it fails open by
    # design, see base.py). Only a real database failure marks the service
    # as degraded here.
    overall_status = "ok" if checks["database"] == "ok" else "degraded"

    return Response({
        "status": overall_status,
        "service": "academia-backend",
        "checks": checks,
        "timestamp": timezone.now(),
    })
