MAX_TAG_NAME_LENGTH = 50


def is_valid_tag_name_length(name):
    """Tag.name is a CharField(max_length=50). Without this check, a name
    over that length reaches Postgres and raises a raw, unhandled DataError
    (500) instead of a clean validation error. Reachable by any regular
    user through ordinary question tagging, not just admin merge/rename,
    so this needs checking at every write path, not just here."""
    return len(name) <= MAX_TAG_NAME_LENGTH
