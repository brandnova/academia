class LooseIDConverter:
    """Matches any single URL segment as a plain string, deferring format
    validation to the view instead of letting Django's routing silently
    404 on a malformed UUID before the view (and our error handling) ever
    gets a chance to run."""
    regex = "[^/]+"

    def to_python(self, value):
        return value

    def to_url(self, value):
        return str(value)
