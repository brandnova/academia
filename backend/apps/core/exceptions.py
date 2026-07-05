from rest_framework import status
from rest_framework.exceptions import Throttled
from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)

    if response is None:
        return response

    if isinstance(exc, Throttled):
        response.data = {"error": "Rate limit exceeded. Please try again later."}
        return response

    # 400s are already field-keyed by DRF, matching api-contract.md as-is
    if response.status_code == status.HTTP_400_BAD_REQUEST:
        return response

    # Everything else: normalize {"detail": "..."} -> {"error": "..."}
    if isinstance(response.data, dict) and "detail" in response.data:
        response.data = {"error": str(response.data["detail"])}

    return response
