# BUILD LOG

## Current Phase
Phase 2 — Schools (complete, pending your confirmation)

## Completed Phases
- Phase 0: Django 6.0.6 project scaffolded, settings split (base/development/production),
  PostgreSQL connected via django-environ, health-check endpoint live at /api/v1/health/.
- Phase 1: Custom User model (apps.accounts) on UUID PK, email-based auth. Google OAuth
  verified via Google's userinfo endpoint (not allauth). JWT issued via SimpleJWT with
  refresh rotation + blacklist. Endpoints: /api/v1/auth/google/, /api/v1/auth/refresh/,
  /api/v1/auth/logout/, /api/v1/users/me/ (GET/PATCH).
- Phase 2: School model (apps.schools) with verification_status field (schema addition).
  List/search/detail endpoints public; create/update admin-only via IsPlatformAdmin
  permission. has_hub and departments stubbed pending Phase 4/3. "Delete" implemented as
  soft-delete via is_active, not a separate endpoint. Global error-response normalizer
  added (apps.core.exceptions) so all future phases get api-contract.md's {"error": "..."}
  shape for free.

## Key Decisions Made
- API namespaced under /api/v1/ from the start
- Report/Notification use Django ContentType (GenericForeignKey), not string fields
- Reviews/Billing apps reserved but not built in MVP
- Django 6.0.6 on Python 3.12, psycopg3 as DB driver
- Settings split into config/settings/{base,development,production}.py, env vars via django-environ
- App code lives under apps/ (apps.core, apps.accounts, apps.schools so far)
- Backend is API-only; frontend framework left open/undecided
- Google auth verified by calling Google's userinfo endpoint with the client-supplied
  access_token, instead of django-allauth's full social-auth flow
- Shared permission (IsPlatformAdmin) and exception handler live in apps.core for reuse
  across all future apps
- School "delete" is soft-delete via is_active=False through the existing PATCH endpoint,
  not a dedicated DELETE endpoint (not documented in api-contract.md)

## Conventions Established
- manage.py/wsgi.py/asgi.py default to development settings; production is explicit via env
- All new apps go under apps/<app_name>/ with dotted INSTALLED_APPS path apps.<app_name>
- .env holds secrets, .env.example is the committed template
- Custom User model: apps.accounts.User, UUID PK, USERNAME_FIELD=email, no username field
- All list endpoints use PageNumberPagination with a per-app pagination class
  (page_size default 20, configurable max) matching api-contract.md's {count, next,
  previous, results} shape
- All error responses normalized to api-contract.md's {"error": "..."} shape via
  apps.core.exceptions.custom_exception_handler; 400s stay field-keyed
- is_admin (not is_staff) is the platform-permission flag checked by API views;
  is_staff only gates Django admin-site login

## Known Deviations From Docs
- project-plan.md names django-allauth for social auth; implemented instead via direct
  Google userinfo verification
- database-schema.md's User model doesn't list is_staff; added it for Django admin-site
  compatibility, separate from is_admin
- database-schema.md's School model gained verification_status (not in the original
  table, added per our earlier scalability discussion)
- api-contract.md's School responses now also include verification_status (additive
  field, doesn't break documented shape)
- api-contract.md documents no School delete endpoint; feature-list.md mentions delete —
  resolved via soft-delete (is_active) through PATCH, no new endpoint added

## Next Immediate Step
Phase 3 — Departments (list/create/update scoped to a school; create/update restricted
to School Representatives once that role exists — for now, admin-only until Phase 14
introduces SchoolRepresentativeAssignment)