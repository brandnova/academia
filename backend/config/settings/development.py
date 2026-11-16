import os

from .base import *  # noqa: F401,F403

DEBUG = True

# Loopback only by default. Expo Go on a physical phone reaches the machine over
# its LAN address, so those hosts must be added explicitly rather than opening
# the dev server to every Host header.
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

_extra_dev_hosts = os.environ.get("DJANGO_DEV_ALLOWED_HOSTS", "")
if _extra_dev_hosts:
    ALLOWED_HOSTS.extend(
        host.strip() for host in _extra_dev_hosts.split(",") if host.strip()
    )

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "localhost"
EMAIL_PORT = 1025
EMAIL_HOST_USER = ""
EMAIL_HOST_PASSWORD = ""
EMAIL_USE_TLS = False
DEFAULT_FROM_EMAIL = "Academia Atlas <no-reply@academia.local>"
