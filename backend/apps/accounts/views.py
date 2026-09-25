import requests
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.core.permissions import IsPlatformAdmin
from apps.core.utils import validate_uuid
from apps.notifications.models import Notification
from apps.notifications.services import notify

from .models import User
from .pagination import UserPagination
from .serializers import AdminUserSerializer, AdminUserUpdateSerializer, UserSearchSerializer, UserSerializer

GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle, ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        access_token = request.data.get("access_token")
        if not access_token:
            return Response(
                {"error": "access_token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        google_response = requests.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=5,
        )
        if google_response.status_code != 200:
            return Response(
                {"error": "Invalid Google token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        google_data = google_response.json()
        email = google_data.get("email")
        if not email:
            return Response(
                {"error": "Invalid Google token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # The v3 userinfo endpoint returns email_verified as a real JSON
        # boolean. An unverified email means Google itself isn't vouching
        # that this account controls that address, trusting it implicitly
        # would let someone sign in as an email they don't actually own.
        # Reuses the existing generic message rather than a new one, this
        # tightens behavior without adding new documented response text.
        if not google_data.get("email_verified", False):
            return Response(
                {"error": "Invalid Google token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "full_name": google_data.get("name", email.split("@")[0]),
                "avatar": google_data.get("picture"),
            },
        )

        if created:
            # get_or_create() calls the base manager's plain create(), never
            # UserManager._create_user(), so password was left at Django's
            # blank default rather than genuinely unusable. Harmless today
            # with no password-auth path at all, but worth hardening
            # explicitly before email/password auth ships.
            user.set_unusable_password()
            user.save(update_fields=["password"])

        if not user.is_active:
            return Response(
                {"error": "Your account has been suspended"},
                status=status.HTTP_403_FORBIDDEN,
            )

        updated_fields = []
        if not created:
            if google_data.get("picture") and user.avatar != google_data.get("picture"):
                user.avatar = google_data.get("picture")
                updated_fields.append("avatar")
            if google_data.get("name") and user.full_name != google_data.get("name"):
                user.full_name = google_data.get("name")
                updated_fields.append("full_name")
            if updated_fields:
                user.save(update_fields=updated_fields + ["updated_at"])

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class ScopedTokenRefreshView(TokenRefreshView):
    throttle_classes = [AnonRateThrottle, ScopedRateThrottle]
    throttle_scope = "auth"


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(refresh_token).blacklist()
        except Exception:
            return Response(
                {"error": "Invalid or already blacklisted token"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # stats is now a SerializerMethodField on UserSerializer itself,
        # no longer bolted onto the response dict here manually.
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        full_name = request.data.get("full_name")
        if full_name:
            user.full_name = full_name
            user.save(update_fields=["full_name", "updated_at"])
        return Response(UserSerializer(user).data)


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    pagination_class = UserPagination
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def get_queryset(self):
        queryset = User.objects.all().order_by("-created_at")

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) | Q(full_name__icontains=search)
            )

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    http_method_names = ["get", "patch", "options"]

    def get_user(self, user_id):
        parsed_id = validate_uuid(user_id)
        try:
            return User.objects.get(id=parsed_id)
        except User.DoesNotExist:
            raise NotFound("User not found")

    def get(self, request, user_id):
        user = self.get_user(user_id)
        return Response(AdminUserSerializer(user).data)

    def patch(self, request, user_id):
        user = self.get_user(user_id)

        if user.id == request.user.id and "is_active" in request.data and not request.data["is_active"]:
            raise ValidationError({"error": "You cannot suspend your own account"})

        was_active = user.is_active

        write_serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)
        write_serializer.is_valid(raise_exception=True)
        user = write_serializer.save()

        if was_active and not user.is_active:
            notify(
                user=user,
                notification_type=Notification.Type.USER_SUSPENDED,
                message="Your account has been suspended",
                email_subject="Your account has been suspended",
                email_template="account_suspended",
                email_context={"recipient_name": user.full_name},
            )

        return Response(AdminUserSerializer(user).data)


class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.hubs.permissions import user_is_representative_for_any_hub

        if not (request.user.is_admin or user_is_representative_for_any_hub(request.user)):
            raise PermissionDenied("You do not have permission to search for users")

        search = request.query_params.get("search", "").strip()
        if not search:
            return Response({"results": []})

        users = User.objects.filter(
            Q(email__icontains=search) | Q(full_name__icontains=search),
            is_active=True,
        ).order_by("full_name")[:10]

        return Response({"results": UserSearchSerializer(users, many=True).data})
