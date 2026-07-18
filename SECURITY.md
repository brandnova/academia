# Security Policy

Academia handles real user accounts, authentication tokens, and personal data. If you find a security vulnerability, please help us fix it before it's public knowledge.

## Please do not

- Open a public GitHub issue describing the vulnerability.
- Discuss it in the WhatsApp community.
- Test it against the live production app in a way that could affect real users or their data (a local copy or a clearly test-only account is fine).

## Please do

Report it privately, directly to the maintainer (Nova), with:
- What the vulnerability is and where it lives (endpoint, page, or component)
- Steps to reproduce it
- What you think the impact is (what could an attacker actually do with this)

You'll get an acknowledgment as soon as possible, and credit once it's fixed and disclosure is safe, unless you'd prefer to stay anonymous, which is entirely your call.

## Scope

This covers the Academia backend (Django REST Framework API), the Academia frontend (Next.js app), and their deployed instances. Issues in third-party dependencies should generally be reported upstream to that project directly, but let us know too if it affects Academia specifically.
