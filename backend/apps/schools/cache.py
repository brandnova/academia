from apps.core.cache import invalidate_key, invalidate_prefix, make_cache_key


def invalidate_school_cache(school):
    """Single source of truth for invalidating every cache key derived from
    a School: school-detail, school-by-slug, and the school-list prefix.
    Previously PATCH /schools/{id}/, department create/update, and hub
    activation approval each invalidated school-detail but never
    school-by-slug, so a slug-based lookup (project-overview.md's
    recommended primary route for school pages) could serve stale data,
    including a deactivated school still showing active, for up to
    CACHE_TTL_MEDIUM. Used by apps.schools directly and imported by
    apps.hubs (activation changes School.has_hub indirectly), so the two
    apps can't drift apart on this again, matching how apps.hubs already
    handles hub-by-slug correctly for its own Hub cache."""
    invalidate_key(make_cache_key("school-detail", school.id))
    invalidate_key(make_cache_key("school-by-slug", school.slug))
    invalidate_prefix("school-list")