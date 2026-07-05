import hashlib
import logging
from functools import wraps

from django.conf import settings
from django.core.cache import cache
from rest_framework.response import Response

logger = logging.getLogger(__name__)


def make_cache_key(prefix, *parts):
    """Deterministic cache key from a prefix and identifying parts (e.g. an id).
    Used for detail views where the object being cached is knowable in advance,
    so it can also be invalidated precisely on write."""
    joined = ":".join(str(p) for p in parts)
    return f"academia:v1:{prefix}:{joined}"


def make_query_cache_key(prefix, request):
    """Cache key derived from a request's full path and query string. Used for
    list/search endpoints where the identifying factor is an arbitrary filter
    combination rather than a single object id."""
    query_string = request.META.get("QUERY_STRING", "")
    raw = f"{request.path}?{query_string}"
    digest = hashlib.md5(raw.encode()).hexdigest()
    return f"academia:v1:{prefix}:{digest}"


def get_cached(key):
    try:
        return cache.get(key)
    except Exception:
        logger.warning("Cache read failed for key %s", key)
        return None


def set_cached(key, value, timeout):
    try:
        cache.set(key, value, timeout)
    except Exception:
        logger.warning("Cache write failed for key %s", key)


def invalidate_key(key):
    try:
        cache.delete(key)
    except Exception:
        logger.warning("Cache invalidation failed for key %s", key)


def invalidate_prefix(prefix):
    """Best-effort pattern invalidation for list/search caches. Only works on
    backends that support delete_pattern (django-redis does; the LocMemCache
    fallback does not and silently no-ops here, relying on short TTLs as the
    safety net instead)."""
    delete_pattern = getattr(cache, "delete_pattern", None)
    if callable(delete_pattern):
        try:
            delete_pattern(f"academia:v1:{prefix}:*")
        except Exception:
            logger.warning("Pattern invalidation failed for prefix %s", prefix)


def cache_get_response(prefix, timeout_setting="CACHE_TTL_SHORT"):
    """Decorator for a DRF view's list()/get() handler. Caches only 200 OK
    responses, keyed by full path + query string."""
    def decorator(view_method):
        @wraps(view_method)
        def wrapper(self, request, *args, **kwargs):
            key = make_query_cache_key(prefix, request)
            cached = get_cached(key)
            if cached is not None:
                return Response(cached)

            response = view_method(self, request, *args, **kwargs)
            if response.status_code == 200:
                timeout = getattr(settings, timeout_setting, 60)
                set_cached(key, response.data, timeout)
            return response
        return wrapper
    return decorator
