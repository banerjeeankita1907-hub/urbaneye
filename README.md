# UrbanEye — Community Issue Reporting

UrbanEye is a small web application for collecting geolocated community
infrastructure reports, displaying their locations on a map and giving an
administrator a category/severity summary.

The repository contains a Vercel-style API, a static browser interface and a
KV-backed persistence layer. This release focuses on request validation,
authentication configuration and privacy-safe rendering.

## Features

- Citizen registration and login using bcrypt password hashes and signed JWTs.
- Authenticated issue submission with category, description and geolocation.
- Strict latitude/longitude bounds, allowed category list and image data-URL
  size/type checks.
- Public issue feed that excludes reporter identifiers, email addresses and
  base64 photo payloads.
- Escaped user-submitted text in map popups and the issue list.
- Admin-only summary endpoint.
- Automated validation tests and JavaScript syntax checks.

## Local checks

Requires Node.js 18 or newer.

```bash
npm install
npm test
npm run check
```

The application requires a Vercel KV-compatible service and a secret for
JWT signing. Do not run the authenticated APIs in production until these
secrets are configured.

## Environment configuration

Set `JWT_SECRET` to a randomly generated secret with at least 32 UTF-8 bytes.
The API deliberately refuses to fall back to a hard-coded default. Configure
KV credentials through your deployment provider's supported environment
variables; never commit tokens or live database credentials.

## Security and privacy notes

- Passwords are hashed with bcrypt using asynchronous APIs.
- Password input is restricted to bcrypt's 72-byte input limit.
- JWTs are verified as HS256 tokens with the expected issuer.
- Issue submissions validate descriptions, category, coordinates and optional
  image data URLs before storage.
- Public issue responses omit reporter identifiers, email addresses and stored
  photos. Admin-only details should be exposed only through a separate,
  authenticated and audited admin workflow.
- User-provided issue text is HTML-escaped before being inserted in Leaflet
  popups or list markup.
- The current design does not include rate limiting, abuse reporting, retention
  controls, moderation queues, CSRF protection for token-in-storage clients,
  or a full privacy-consent workflow. Those are required before handling
  sensitive community reports at scale.

See [docs/security-and-data-model.md](docs/security-and-data-model.md) for the
request rules and remaining production work.

## Deployment

The repository includes a Vercel configuration. Before deployment, configure
KV and `JWT_SECRET` environment variables, review access policies, enable
provider-level rate limits and verify that issue reporting works with a
non-production data store first.

## Licence

No separate licence file is currently provided. Ask before reusing or
redistributing this repository's code.
