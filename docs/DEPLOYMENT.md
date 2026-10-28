# Deployment and security notes

## Current environment

The app is a local development release. The API checks a real PostgreSQL connection and serves the built client. Demo mode creates fictional staff and demonstration identities. All seeded people, addresses and task descriptions are invented. The database and source are not connected to any KISC personnel systems.

Current verified security measures: bcrypt passwords, cryptographically random opaque cookie sessions stored as hashes, eight-hour server expiry, HttpOnly/SameSite cookies, production Secure cookie flag, login/general rate limits, security headers, parameterized SQL, Zod validation, server-side role/school checks, single-decision leave updates and scoped case registers. These measures **do not establish production security or legal compliance**.

## Reproduce local development

Run `bash scripts/dev-setup.sh`, then start `npm run server` and `npm run dev` in separate terminals. Existing checkout isolation is sufficient; do not create a Git worktree unless specifically requested. Setup preserves `.env`, user source files and lockfiles. `npm ci` follows the lockfile. PostgreSQL data persists with the container; Compose-created databases use the named `peoplehub_db` volume. The initial manually provisioned onboarding container uses Docker's attached database volume. Neither live processes nor Docker daemon state should be assumed to survive cloud publication; restore/create the demo database if unavailable.

Re-running schema startup is additive (`CREATE ... IF NOT EXISTS`); employee seeding is skipped when staff already exist, and demo identities are inserted only when missing. This is not a complete migration/versioning system. Changing `SEED_PASSWORD` only affects a newly initialized users table. Do not delete a database to reset access to real data.

## Container packaging for reviewed staging

`Dockerfile` packages the client and API with a non-root runtime. PostgreSQL is separate.

1. Build: `docker build -t kisc-peoplehub:0.1 .`
2. Provision a private PostgreSQL database and a restricted application account. Use an internal connection string and verified TLS; never disable certificate verification. Startup currently needs schema-creation rights; move DDL to a dedicated migration identity before production.
3. Supply runtime secrets through your secret manager: `DATABASE_URL`, initial `SEED_PASSWORD` (at least 12 characters), `DEMO_MODE=false`. Do not use the local `.env` file in production. New non-demo databases create only an initial super administrator; production provisioning remains unfinished.
4. Terminate HTTPS at your load balancer/reverse proxy and route to container port 3001 on a private network. Secure cookies require HTTPS. Configure host/origin allowlists and proxy trust for your actual topology; rate limiting currently uses in-memory state and is not shared across replicas.
5. Health check `/api/health` verifies database connectivity. Static assets are served from `dist`; APIs use `/api` routes. Keep API and frontend same-origin for cookie security.
6. Supply monitoring, log management, managed encryption, storage, backup, restoration and incident runbooks before production access.

`NODE_ENV=production` explicitly rejects `DEMO_MODE=true`. This guard only prevents accidentally enabling fixtures; it is not a production-readiness gate. **Do not deploy as a public production service until the roadmap's launch gates are closed.** No live production deployment was performed in this task.

## Remaining security work

- Mandatory administrator/finance MFA and established SSO identity provider; recovery, invitations, fresh-auth approvals, revocation and complete logout-everywhere.
- HTTP method/header defense and SameSite cookies are present; Origin validation is enforced for browser mutations; deployment allowlists and dedicated CSRF/security testing remain required.
- Transactional mutation/audit coupling, read/export/download audits, redacted structured logs, append-only external audit storage and failed-login/authorization alerts.
- Per-field privacy, finer manager/direct-report scopes, confidential case parties and conflict-of-interest rules; super admin currently has KISC-wide HR access. Validate this access with KISC.
- Complete validation limits and pagination, production database constraints, migrations, concurrent approval/reconciliation testing and database row-level defense.
- No document upload endpoint yet: build private encrypted object storage with scanning and scoped signed downloads before collecting files.
- No external encryption-key management or at-rest encryption guarantees in local Docker. Infrastructure must provide and verify them.
- No automated backup is configured and no recovery drill has been completed. Use managed encrypted backups/PITR and verify restoration to an isolated instance. Protect backups like production data.
- Payroll, electronic signatures, email/SMS, biometric devices, bank/payment and accounting integrations are not connected.
- Tests validate representative development behavior, not a penetration test, full WCAG audit, full cross-browser verification or statutory correctness.

## Networks

Development dependency installation uses `registry.npmjs.org`; Git uses the existing GitHub proxy; Docker pulls use Docker Hub. Fonts are bundled so no Google Fonts connection is needed. Browser checks use the installed Chromium; downloading Playwright's own Chromium was blocked by the network policy and is unnecessary here.

## Secrets and publishing

`.env` is Git ignored and should remain private. The environment snapshot may include local files, so never store real HR integration secrets there before publication. Use environment settings/secret management for real credentials. Draft configuration persistence, filesystem snapshot publication and validation in a fresh task are separate actions; none establishes production readiness.
