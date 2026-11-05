from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403

DEBUG = False
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

# Refuse to start production on SQLite. base.py falls back to a local SQLite
# file whenever DATABASE_URL is unset, which is right for contributors but
# dangerous here: a missing or misspelled DATABASE_URL would otherwise boot
# normally on a throwaway file (ephemeral on most hosts, and invisible until
# data vanishes). Deployments that genuinely run SQLite on purpose, such as
# the PythonAnywhere preview site, opt in explicitly with
# DJANGO_ALLOW_SQLITE=True.
if (
    DATABASES["default"]["ENGINE"].endswith("sqlite3")
    and not env.bool("DJANGO_ALLOW_SQLITE", default=False)
):
    raise ImproperlyConfigured(
        "Production settings are running on SQLite because DATABASE_URL is "
        "unset or points at SQLite. Set DATABASE_URL to your Postgres "
        "connection string, or set DJANGO_ALLOW_SQLITE=True in the .env "
        "file if SQLite is intentional for this deployment."
    )

# Most hosts, PythonAnywhere included, terminate TLS at a reverse proxy and
# forward the original scheme via this header. Without it, Django can't tell
# a request was actually HTTPS, which breaks secure cookies and can cause
# redirect loops if SECURE_SSL_REDIRECT is also on.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# JSON only in production. The browsable HTML API is a development
# convenience, serving it publicly exposes endpoint structure and forms for
# no benefit. Django admin is unaffected.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
}

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="Academia <no-reply@academia.local>")

# Media storage. Nothing uploads files yet, so this stays FileSystemStorage,
# which is NOT safe for real uploads here: Vercel's filesystem is read-only
# and PaaS disks are usually wiped on redeploy. Before any upload feature
# ships, install and verify a cloud storage backend, then point this
# variable at it (and add whatever settings that backend needs).
STORAGES = {
    "default": {
        "BACKEND": env(
            "DEFAULT_FILE_STORAGE_BACKEND",
            default="django.core.files.storage.FileSystemStorage",
        ),
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}