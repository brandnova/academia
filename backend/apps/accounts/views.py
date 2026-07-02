import requests
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import UserSerializer

GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

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

        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "full_name": google_data.get("name", email.split("@")[0]),
                "avatar": google_data.get("picture"),
            },
        )

        updated_fields = []
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
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        full_name = request.data.get("full_name")
        if full_name:
            user.full_name = full_name
            user.save(update_fields=["full_name", "updated_at"])
        return Response(UserSerializer(user).data)
