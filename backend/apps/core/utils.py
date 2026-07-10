import uuid as uuid_lib

from rest_framework.exceptions import ValidationError


def parse_uuid_or_none(value):
    try:
        return uuid_lib.UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        return None


def validate_uuid(value):
    """Parses value as a UUID or raises a clean 400, instead of letting a
    malformed ID fall through to a 404 or worse further down the stack."""
    parsed = parse_uuid_or_none(value)
    if parsed is None:
        raise ValidationError({"error": "Invalid ID format"})
    return parsed
