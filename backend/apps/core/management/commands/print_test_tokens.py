"""
Local-dev-only convenience command. Mints fresh JWTs for the three fixed
test users created by seed_demo_data, bypassing Google OAuth entirely.

Two ways to use it:

  eval "$(python manage.py print_test_tokens)"
      Sets ADMIN_ACCESS/ADMIN_REFRESH, STAFF_ACCESS/STAFF_REFRESH, and
      USER_ACCESS/USER_REFRESH directly in your current shell session.

  python manage.py print_test_tokens
      Just run it plainly to see the tokens printed out for copying into
      Postman, Insomnia, a browser extension, or anywhere else that isn't
      this shell session.

Re-run any time tokens expire (access tokens last 1 hour).

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
        "Prints ready-to-eval shell export statements (stdout) plus a "
        "human-readable copy of the same tokens (stderr) for the three "
        "fixed test users (admin, staff, user), bypassing Google OAuth. "
        "Run seed_demo_data first if the users don't exist yet. Refuses to "
        "run unless DEBUG=True."
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
        export_lines = []
        readable_lines = []

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
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            export_lines.append(f'export {label}_ACCESS="{access_token}"')
            export_lines.append(f'export {label}_REFRESH="{refresh_token}"')

            readable_lines.append(f"{label} ({email}):")
            readable_lines.append(f"  Access:  {access_token}")
            readable_lines.append(f"  Refresh: {refresh_token}")

        if not export_lines:
            self.stderr.write(self.style.ERROR("No test users found. Run seed_demo_data first."))
            return

        # Human-readable copy, printed to stderr so it never interferes with
        # `eval "$(...)"`, which only reads stdout. Safe to run plainly too,
        # this is what shows up when you do.
        self.stderr.write("")
        self.stderr.write(self.style.SUCCESS(
            "Fresh test tokens below, valid for 1 hour. Copy whichever you need into "
            "Postman, Insomnia, a browser extension, or anywhere outside this shell. "
            "If you're running this via eval \"$(python manage.py print_test_tokens)\", "
            "these same tokens are already set as $ADMIN_ACCESS / $STAFF_ACCESS / "
            "$USER_ACCESS (and their _REFRESH counterparts) in your current session."
        ))
        self.stderr.write("")
        for line in readable_lines:
            self.stderr.write(line)
        self.stderr.write("")

        if any_missing:
            self.stderr.write(self.style.WARNING(
                "Some test users were missing, re-run seed_demo_data to create them."
            ))
            self.stderr.write("")

        # Export statements, stdout only, this is the only part `eval` reads.
        for line in export_lines:
            self.stdout.write(line)
