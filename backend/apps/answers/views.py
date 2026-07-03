from django.db.models import F
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.questions.models import Question

from .models import Answer, AnswerVote
from .serializers import AnswerCreateSerializer, AnswerResponseSerializer, AnswerUpdateSerializer


class AnswerCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        write_serializer = AnswerCreateSerializer(data=request.data, context={"request": request})
        write_serializer.is_valid(raise_exception=True)
        answer = write_serializer.save()
        return Response(AnswerResponseSerializer(answer).data, status=status.HTTP_201_CREATED)


class AnswerDetailView(APIView):
    permission_classes = [IsAuthenticated]
    http_method_names = ["patch", "delete", "options"]

    def get_answer(self, answer_id):
        try:
            return Answer.objects.select_related("question").get(id=answer_id)
        except (Answer.DoesNotExist, ValueError):
            raise NotFound("Answer not found")

    def patch(self, request, answer_id):
        answer = self.get_answer(answer_id)
        if answer.author_id != request.user.id:
            raise PermissionDenied("You do not have permission to edit this answer")
        write_serializer = AnswerUpdateSerializer(answer, data=request.data, partial=True)
        write_serializer.is_valid(raise_exception=True)
        answer = write_serializer.save()
        return Response(AnswerResponseSerializer(answer).data)

    def delete(self, request, answer_id):
        answer = self.get_answer(answer_id)
        if answer.author_id != request.user.id:
            raise PermissionDenied("You do not have permission to delete this answer")
        question = answer.question
        was_best = answer.is_best
        answer.delete()

        remaining_count = question.answers.count()
        if remaining_count == 0:
            Question.objects.filter(id=question.id).update(status=Question.Status.OPEN)
        elif was_best:
            Question.objects.filter(id=question.id).update(status=Question.Status.ANSWERED)

        return Response(status=status.HTTP_204_NO_CONTENT)


class AnswerVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def get_answer(self, answer_id):
        try:
            return Answer.objects.get(id=answer_id)
        except (Answer.DoesNotExist, ValueError):
            raise NotFound("Answer not found")

    def post(self, request, answer_id):
        answer = self.get_answer(answer_id)

        if answer.author_id == request.user.id:
            return Response(
                {"error": "You cannot vote on your own answer"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if AnswerVote.objects.filter(answer=answer, user=request.user).exists():
            return Response(
                {"error": "You have already voted on this answer"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vote_type = str(request.data.get("vote_type", "")).upper()
        if vote_type not in AnswerVote.VoteType.values:
            return Response(
                {"vote_type": ["This field must be one of: UP, DOWN."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        AnswerVote.objects.create(answer=answer, user=request.user, vote_type=vote_type)
        delta = 1 if vote_type == AnswerVote.VoteType.UP else -1
        Answer.objects.filter(id=answer.id).update(vote_score=F("vote_score") + delta)
        answer.refresh_from_db(fields=["vote_score"])

        return Response({
            "message": "Vote recorded",
            "vote_type": vote_type,
            "vote_score": answer.vote_score,
        })

    def delete(self, request, answer_id):
        answer = self.get_answer(answer_id)
        try:
            vote = AnswerVote.objects.get(answer=answer, user=request.user)
        except AnswerVote.DoesNotExist:
            return Response(
                {"error": "You have not voted on this answer"},
                status=status.HTTP_404_NOT_FOUND,
            )

        delta = -1 if vote.vote_type == AnswerVote.VoteType.UP else 1
        vote.delete()
        Answer.objects.filter(id=answer.id).update(vote_score=F("vote_score") + delta)

        return Response(status=status.HTTP_204_NO_CONTENT)


class MarkBestAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, answer_id):
        answer = None
        try:
            answer = Answer.objects.select_related("question").get(id=answer_id)
        except (Answer.DoesNotExist, ValueError):
            raise NotFound("Answer not found")

        question = answer.question

        if question.author_id != request.user.id:
            raise PermissionDenied("Only the question owner can mark a best answer")

        if answer.is_best:
            return Response(
                {"error": "This answer is already marked as best"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        Answer.objects.filter(question=question, is_best=True).update(is_best=False)
        Answer.objects.filter(id=answer.id).update(is_best=True)
        Question.objects.filter(id=question.id).update(status=Question.Status.SOLVED)

        return Response({
            "message": "Answer marked as best",
            "answer": {
                "id": str(answer.id),
                "is_best": True,
            },
            "question": {
                "id": str(question.id),
                "status": Question.Status.SOLVED,
            },
        })
