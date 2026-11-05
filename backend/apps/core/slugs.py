from django.db import IntegrityError, transaction
from django.utils.text import slugify

MAX_SLUG_ATTEMPTS = 5


def generate_unique_slug(model_class, value, instance_pk=None):
    """Generates a URL-safe slug from `value`, guaranteed unique for
    `model_class` at the moment it runs. Appends -2, -3, etc. on collision.
    Excludes `instance_pk` so re-saving an existing instance doesn't collide
    with itself. Used for School and StaticPage, where the slug is a real,
    stable lookup key, generated once and never silently regenerated.

    Note this only checks, it does not reserve: two simultaneous creates can
    both see the same slug as free. Callers that insert should go through
    save_with_unique_slug() below, which closes that gap."""
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


def save_with_unique_slug(instance, source_value, save, *args, **kwargs):
    """Assigns instance.slug and saves the instance, retrying when two
    simultaneous creates pick the same slug.

    generate_unique_slug() checks and the caller saves afterwards, so two
    requests can both see a slug as free and the second INSERT then violates
    the database's unique constraint (an unhandled IntegrityError, a raw
    500). Each attempt runs inside a savepoint. If it fails and the chosen
    slug now exists in the table, someone else won the race, so a fresh slug
    is generated and the save is retried. Any other IntegrityError (a
    duplicate name, say) is re-raised untouched, as is a failure on the
    final attempt.

    `save` is the real save callable, e.g. super().save from a model's own
    save()."""
    model_class = type(instance)
    for attempt in range(1, MAX_SLUG_ATTEMPTS + 1):
        instance.slug = generate_unique_slug(model_class, source_value)
        try:
            with transaction.atomic():
                save(*args, **kwargs)
            return
        except IntegrityError:
            slug_now_taken = model_class.objects.filter(slug=instance.slug).exists()
            if not slug_now_taken or attempt == MAX_SLUG_ATTEMPTS:
                raise