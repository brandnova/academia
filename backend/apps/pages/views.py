from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.cache import get_cached, invalidate_key, make_cache_key, set_cached
from apps.core.permissions import IsPlatformAdmin, user_is_platform_admin
from apps.core.utils import validate_uuid
from apps.hubs.permissions import user_is_staff

from .models import StaticPage
from .serializers import (
    StaticPageDetailSerializer,
    StaticPageListSerializer,
    StaticPageUpdateSerializer,
    StaticPageWriteSerializer,
)

# Tiers whose responses are cached. Admins are deliberately absent: they see
# drafts and need their own edits reflected instantly, so they always read
# live data. Cache keys are per TIER, never per user, and the tier is part of
# every key, so a public visitor can never be served a staff-visible page.
CACHED_TIERS = ("public", "staff")


def _get_tier(user):
    if user_is_platform_admin(user):
        return "admin"
    return "staff" if user_is_staff(user) else "public"


def _queryset_for_tier(tier):
    """Admins see everything, including drafts of either visibility. Staff
    (moderator/rep, checked globally not per-hub) see every published page.
    Everyone else sees only published PUBLIC pages."""
    if tier == "admin":
        return StaticPage.objects.all()

    queryset = StaticPage.objects.filter(is_published=True)
    if tier == "staff":
        return queryset
    return queryset.filter(visibility=StaticPage.Visibility.PUBLIC)


def _visible_queryset(user):
    return _queryset_for_tier(_get_tier(user))


def _invalidate_page_cache(slug):
    """Clears the cached list and the cached detail for this page, for every
    cached tier. A page's slug never changes after creation, so one slug
    covers every write (create, edit, visibility flip, unpublish, delete).
    Exact keys rather than a prefix wipe, so this works on LocMemCache too."""
    for tier in CACHED_TIERS:
        invalidate_key(make_cache_key("page-list", tier))
        invalidate_key(make_cache_key("page-detail", tier, slug))


class StaticPageListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsPlatformAdmin()]
        return [AllowAny()]

    @staticmethod
    def _build_list(tier):
        queryset = _queryset_for_tier(tier).select_related("created_by").order_by("title")
        return {"results": StaticPageListSerializer(queryset, many=True).data}

    def get(self, request):
        tier = _get_tier(request.user)
        if tier == "admin":
            return Response(self._build_list(tier))

        cache_key = make_cache_key("page-list", tier)
        cached = get_cached(cache_key)
        if cached is not None:
            return Response(cached)

        data = self._build_list(tier)
        set_cached(cache_key, data, settings.CACHE_TTL_MEDIUM)
        return Response(data)

    def post(self, request):
        write_serializer = StaticPageWriteSerializer(data=request.data, context={"request": request})
        write_serializer.is_valid(raise_exception=True)
        page = write_serializer.save()
        _invalidate_page_cache(page.slug)
        return Response(StaticPageDetailSerializer(page).data, status=status.HTTP_201_CREATED)


class StaticPageDetailView(APIView):
    """GET is public, the URL segment is treated as a slug. PATCH/DELETE
    are admin-only, the same URL segment is treated as a UUID id instead.
    One resource path, method-dispatched, matching the documented contract
    exactly (GET .../{slug}/, PATCH/DELETE .../{id}/) rather than splitting
    into two separate routes for what's conceptually one endpoint."""

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsPlatformAdmin()]

    @staticmethod
    def _build_detail(tier, identifier):
        page = _queryset_for_tier(tier).filter(slug=identifier).first()
        if page is None:
            # Same 404 whether the page doesn't exist or just isn't visible
            # to this tier, and never cached, so a hidden page's existence
            # is never confirmable.
            raise NotFound("Page not found")
        return StaticPageDetailSerializer(page).data

    def get(self, request, identifier):
        tier = _get_tier(request.user)
        if tier == "admin":
            return Response(self._build_detail(tier, identifier))

        cache_key = make_cache_key("page-detail", tier, identifier)
        cached = get_cached(cache_key)
        if cached is not None:
            return Response(cached)

        data = self._build_detail(tier, identifier)
        set_cached(cache_key, data, settings.CACHE_TTL_MEDIUM)
        return Response(data)

    def get_page_for_write(self, identifier):
        parsed_id = validate_uuid(identifier)
        try:
            return StaticPage.objects.get(id=parsed_id)
        except StaticPage.DoesNotExist:
            raise NotFound("Page not found")

    def patch(self, request, identifier):
        page = self.get_page_for_write(identifier)
        write_serializer = StaticPageUpdateSerializer(page, data=request.data, partial=True)
        write_serializer.is_valid(raise_exception=True)
        page = write_serializer.save()
        _invalidate_page_cache(page.slug)
        return Response(StaticPageDetailSerializer(page).data)

    def delete(self, request, identifier):
        page = self.get_page_for_write(identifier)
        slug = page.slug
        page.delete()
        _invalidate_page_cache(slug)
        return Response(status=status.HTTP_204_NO_CONTENT)