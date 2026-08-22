from rest_framework.exceptions import Throttled
from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)

    if response is None:
        return response

    if isinstance(exc, Throttled):
        response.data = {"error": "Rate limit exceeded. Please try again later."}
        return response

    # A {"detail": "..."} body is DRF's generic single-message shape (used by
    # NotFound, PermissionDenied, AuthenticationFailed, ParseError on malformed
    # JSON, etc.) at ANY status code, including 400, ParseError specifically
    # is a 400 that is NOT field-keyed, so this can't be gated on status code
    # the way field-keyed validation errors are. Genuine field-keyed errors
    # never carry a "detail" key, so they pass through this check untouched.
    if isinstance(response.data, dict) and "detail" in response.data:
        response.data = {"error": str(response.data["detail"])}
        return response

    return response
