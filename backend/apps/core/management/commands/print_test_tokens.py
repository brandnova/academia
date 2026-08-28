"""
Local-dev-only convenience command. Mints fresh JWTs for the three fixed
test users created by seed_demo_data, bypassing Google OAuth entirely, and
prints them as shell export statements ready to eval directly.

Usage:
    eval "$(python manage.py print_test_tokens)"

This sets ADMIN_ACCESS/ADMIN_REFRESH, STAFF_ACCESS/STAFF_REFRESH, and
USER_ACCESS/USER_REFRESH in your current shell session. Re-run any time
tokens expire (access tokens last 1 hour).

SECURITY: this mints tokens without any password check, refuses to run
unless DEBUG=True as a safety net. Never expose this as an HTTP endpoint,
and never run it against a production database.
"""
from django.conf import settings
from django.core.management.base import BaseCommand
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User

TEST_USER_EMAILS = {
    "ADMIN": "test-admin@example.com",
    "STAFF": "test-staff@example.com",
    "USER": "test-user@example.com",
}


class Command(BaseCommand):
    help = (
        "Prints ready-to-eval shell export statements with fresh JWT tokens "
        "for the three fixed test users (admin, staff, user), bypassing "
        "Google OAuth. Run seed_demo_data first if the users don't exist yet. "
        "Refuses to run unless DEBUG=True."
    )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            self.stderr.write(self.style.ERROR(
                "Refusing to run: DEBUG is False. This command mints tokens "
                "without a password check and must never run against a "
                "production database."
            ))
            return

        any_missing = False
        lines = []

        for label, email in TEST_USER_EMAILS.items():
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                self.stderr.write(self.style.WARNING(
                    f"No user found for {email}, run 'python manage.py seed_demo_data' first."
                ))
                any_missing = True
                continue

            refresh = RefreshToken.for_user(user)
            lines.append(f'export {label}_ACCESS="{str(refresh.access_token)}"')
            lines.append(f'export {label}_REFRESH="{str(refresh)}"')

        if not lines:
            self.stderr.write(self.style.ERROR("No test users found. Run seed_demo_data first."))
            return

        for line in lines:
            self.stdout.write(line)

        if any_missing:
            self.stderr.write(self.style.WARNING(
                "Some test users were missing, re-run seed_demo_data to create them."
            ))