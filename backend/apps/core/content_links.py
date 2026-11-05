def get_link_target(content_object):
    """Resolves where a notification or report about some content should
    link: the question page, optionally anchored to an answer. Returns None
    when the object is gone, or isn't a Question/Answer/Comment (a hub, an
    activation request, a report), so there's nothing to link to.

    For a Comment, answer_id is its parent answer: comments render inside
    their answer on the question page, so that is the anchor to scroll to.
    Imports are deferred like the rest of this codebase's cross-app code."""
    if content_object is None:
        return None

    from apps.answers.models import Answer
    from apps.comments.models import Comment
    from apps.questions.models import Question

    answer = None
    if isinstance(content_object, Question):
        question = content_object
    elif isinstance(content_object, Answer):
        answer = content_object
        question = answer.question
    elif isinstance(content_object, Comment):
        answer = content_object.answer
        question = answer.question
    else:
        return None

    return {
        "question_id": str(question.id),
        "question_slug": question.slug,
        "answer_id": str(answer.id) if answer else None,
    }