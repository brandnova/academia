from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from apps.answers.models import Answer
from apps.core.utils import validate_uuid
from apps.notifications.models import Notification
from apps.notifications.services import notify

from .models import Comment
from .pagination import CommentPagination
from .serializers import CommentCreateSerializer, CommentSerializer, CommentUpdateSerializer


class CommentCreateView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AnonRateThrottle, UserRateThrottle, ScopedRateThrottle]
    throttle_scope = "comment_create"

    def post(self, request):
        write_serializer = CommentCreateSerializer(data=request.data, context={"request": request})
        write_serializer.is_valid(raise_exception=True)
        comment = write_serializer.save()

        answer = comment.answer
        if answer.author_id != comment.author_id:
            notify(
                user=answer.author,
                notification_type=Notification.Type.NEW_COMMENT,
                message=f"{comment.author.full_name} commented on your answer",
                content_object=answer,
            )

        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class CommentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ["patch", "delete", "options"]

    def get_comment(self, comment_id):
        parsed_id = validate_uuid(comment_id)
        try:
            return Comment.objects.get(id=parsed_id)
        except Comment.DoesNotExist:
            raise NotFound("Comment not found")

    def patch(self, request, comment_id):
        comment = self.get_comment(comment_id)
        if comment.author_id != request.user.id:
            raise PermissionDenied("You do not have permission to edit this comment")
        write_serializer = CommentUpdateSerializer(comment, data=request.data, partial=True)
        write_serializer.is_valid(raise_exception=True)
        comment = write_serializer.save()
        return Response(CommentSerializer(comment).data)

    def delete(self, request, comment_id):
        comment = self.get_comment(comment_id)
        if comment.author_id != request.user.id:
            raise PermissionDenied("You do not have permission to delete this comment")
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentListView(ListAPIView):
    serializer_class = CommentSerializer
    pagination_class = CommentPagination
    permission_classes = [AllowAny]

    def get_queryset(self):
        parsed_id = validate_uuid(self.kwargs["answer_id"])
        if not Answer.objects.filter(id=parsed_id).exists():
            raise NotFound("Answer not found")
        return Comment.objects.filter(answer_id=parsed_id)
