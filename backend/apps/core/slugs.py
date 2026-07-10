from django.utils.text import slugify


def generate_unique_slug(model_class, value, instance_pk=None):
    """Generates a URL-safe slug from `value`, guaranteed unique for
    `model_class`. Appends -2, -3, etc. on collision. Excludes
    `instance_pk` so re-saving an existing instance doesn't collide with
    itself. Used for School, where the slug is a real, stable lookup key,
    generated once and never silently regenerated."""
    base_slug = slugify(value)[:80] or "item"
    slug = base_slug
    counter = 2

    queryset = model_class.objects.all()
    if instance_pk is not None:
        queryset = queryset.exclude(pk=instance_pk)

    while queryset.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


def generate_display_slug(value):
    """Non-unique, cosmetic slug for SEO-friendly URLs (e.g. Question
    titles). Not guaranteed unique, never used for lookups, safe to
    regenerate on every edit."""
    return slugify(value)[:80] or "item"
