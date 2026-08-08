from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsPlatformAdmin
from apps.core.utils import validate_uuid
from apps.hubs.permissions import user_is_staff

from .models import StaticPage
from .serializers import (
    StaticPageDetailSerializer,
    StaticPageListSerializer,
    StaticPageUpdateSerializer,
    StaticPageWriteSerializer,
)


def _visible_queryset(user):
    """Admins see everything, including drafts of either visibility. Staff
    (moderator/rep, checked globally not per-hub) see every published page.
    Everyone else sees only published PUBLIC pages."""
    if user and user.is_authenticated and user.is_admin:
        return StaticPage.objects.all()

    queryset = StaticPage.objects.filter(is_published=True)

    if user_is_staff(user):
        return queryset

    return queryset.filter(visibility=StaticPage.Visibility.PUBLIC)


class StaticPageListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsPlatformAdmin()]
        return [AllowAny()]

    def get(self, request):
        queryset = _visible_queryset(request.user).order_by("title")
        return Response({"results": StaticPageListSerializer(queryset, many=True).data})

    def post(self, request):
        write_serializer = StaticPageWriteSerializer(data=request.data, context={"request": request})
        write_serializer.is_valid(raise_exception=True)
        page = write_serializer.save()
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

    def get(self, request, identifier):
        page = _visible_queryset(request.user).filter(slug=identifier).first()
        if page is None:
            raise NotFound("Page not found")
        return Response(StaticPageDetailSerializer(page).data)

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
        return Response(StaticPageDetailSerializer(page).data)

    def delete(self, request, identifier):
        page = self.get_page_for_write(identifier)
        page.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
