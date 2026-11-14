# Security and data model

## Authentication

The API uses a signed JWT for authenticated writes and admin operations.
Tokens must be sent as `Authorization: Bearer <token>`. The JWT signing secret
is read only from `JWT_SECRET`; the application does not use a built-in
fallback. The secret must have at least 32 UTF-8 bytes. Tokens are restricted
to HS256 and the `urbaneye` issuer.

Passwords are hashed asynchronously with bcrypt. Registration requires a
name of 1-80 characters, a syntactically valid email and a password of at least
12 characters. The maximum password size is 72 UTF-8 bytes because bcrypt
processes at most 72 bytes.

## Issue submission schema

| Field | Rule |
|---|---|
| description | Trimmed, 1-2,000 characters |
| category | road, waste, water, electricity or other |
| latitude | finite number in [-90, 90] |
| longitude | finite number in [-180, 180] |
| photo | optional PNG/JPEG/WebP base64 data URL, maximum 2,000,000 encoded characters |

Zero latitude and longitude are valid coordinates. All numeric values must be
finite; strings such as Infinity, NaN and empty strings are not accepted.

## Public response minimization

The public `GET /api/issues` feed returns only issue ID, description, category,
severity, coordinates, status and creation timestamp. It excludes
`reported_by`, `reporter_email` and the stored photo. Photos and reporter
identifiers are not required for the public map or the recent-issues list.

The browser escapes dynamic text before injecting it into Leaflet popup and
list HTML. This protects the rendering surface from markup supplied in issue
descriptions or category fields.

## Limitations before production

This is a portfolio implementation, not a completed civic platform security
review. Before production use, add:

1. Rate limiting for login, registration and issue submissions.
2. Abuse prevention, CAPTCHA or equivalent friction on anonymous entry points.
3. A moderation and removal workflow for harmful or false reports.
4. Data-retention rules and a user privacy notice.
5. CSRF protection and a more secure browser session strategy than local
   storage bearer tokens.
6. Atomic unique-email registration to handle concurrent requests.
7. Photo object storage with content sniffing, malware scanning and lifecycle
   policies instead of KV storage.
8. Audit logs and explicit admin permission management.
9. Automated integration tests against a disposable KV instance.
10. Dependency, secret and deployment scanning.

Do not treat the keyword-based severity label as an emergency-service triage
decision. It is a simple display heuristic and does not verify the facts of a
report.
