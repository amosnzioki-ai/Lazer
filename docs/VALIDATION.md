# Development validation record

Validated in the current cloud instance on 24 October 2026. This records a development milestone, not completion of the full HRMS.

- `bash scripts/dev-setup.sh`: passed against the existing checkout/database, including locked installation and production frontend build. Existing local configuration and data were retained.
- `npm run build`: passed after final UI changes.
- `npm test`: 14 passed, 0 failed, 0 skipped. Tests exercised PostgreSQL connectivity, unauthenticated access denial, school isolation, aggregate-only Enko access, employee restrictions, persistent employee creation and duplicate/invalid input handling, leave creation/single decision/audit, HR record persistence/status transition, cross-origin login rejection, role policies and weekday duration.
- `node tests/browser.mjs`: passed in installed Chromium, covering login, dashboard, directory search, form opening, leave navigation, mobile horizontal overflow and mobile drawer/navigation. No captured JavaScript runtime exceptions in the desktop page. This is a smoke test, not complete end-to-end coverage or WCAG certification.
- API health: returned `status: ok` with demo mode enabled after a database query.
- Vite root: HTTP 200. API and development frontend were both started in the current instance.
- `npm audit --omit=dev --audit-level=high`: reported 0 vulnerabilities at validation time. This does not establish overall application security.
- `git diff --check`: passed. `.env`, build output and dependencies are ignored. Application changes have not been pushed or deployed.

Screenshots: [desktop](screenshots/dashboard.png), [mobile](screenshots/mobile.png). All shown people and operational records are fictional.

Cloud install/start instructions were saved to the environment draft. Publication and restoration into a new cloud task have not been verified. Docker image packaging is provided but an image build/deployment has not been exercised. Production launch gates in ROADMAP.md remain open.

## Public website update

The homepage now serves a public website; the existing application moved to `/app`. Both normal and standalone static website builds passed. Website browser checks passed against both the Express-served website and a separate static file server: responsive desktop/mobile layouts, menu, FAQ, preview filter, overview download, no public-page backend requests and no captured desktop runtime errors. Existing application browser smoke checks passed after the route change. Static ZIP packaging is provided; no Internet-facing deployment has been performed.

## KISC business themes

Normal and standalone builds passed. Desktop/mobile Light/Dark and preference persistence passed against the static website. Keyboard workspace-preview tabs, mobile menu and offline HTML controls passed. Application/login Dark mode and persistence after login/reload passed, including mobile layout. Existing website and application browser smoke checks passed after the UI changes. Screenshots are in `docs/screenshots/business-*`. No backend behavior was changed for this theme update.

## Employee directory, profiles and attendance update

The normal client, standalone HR, and public-site builds passed. The database-backed suite passed 15 tests with no failures or skips, including the new profile/qualification/device lifecycle: school isolation, own-only profile access, HR editing, qualification dates/amendment, authenticated ingestion, enrollment scope, clock sequencing, duplicate events, future-time rejection, key redaction/revocation and archived enrollment removal. A separate adapter test passed for sequential delivery, replay outcome, credential-log protection and rejection of external plaintext HTTP.

The HR browser flow passed offline: directory search, individual profile, editing, qualification creation/amendment, a new colleague and manual clock-in, attendance review, device/enrollment demonstration, dark mode and mobile overflow. The existing connected app browser smoke check passed after adapting it to the new card directory. HTML controls were exercised without external network requests. Screenshots are under `docs/screenshots/hr-*`. Public-website entry into the HR demo is tested separately.

No physical device, biometric recognition or live video integration was tested. The school confirmed no device is selected yet. The adapter remains vendor-neutral. Real staff data and production security approval remain outside the validated scope.

## School and head-office organization

Backend suite: 17 passed, 0 failed, 0 skipped. New checks validate school groups, central-office creation and editing, school-admin denial of central records and aggregate head-office reporting. Browser organization/assignment workflows and the existing HR/browser entry flow were exercised after rebuilding all downloads. Source data is fictional; original user records and prior offline edits are preserved by additive migration.

## Confidential health and staff publication — 26 October 2026

The backend suite passed 19 tests, including encryption integrity and role/owner restrictions for health; staff-only draft/publish/scope/version rules; and acknowledgement isolation/de-duplication. The new offline browser workflow passed for health updates, publication review, staff preview, policy reading, five collaboration tools and Nairobi month-boundary filtering. Existing organization and employee browser flows and the website-to-HR entry passed. Health demo data is fictional and never fed into publishing; there is no Internet-facing publication route. See HEALTH-AND-STAFF-HUB.md for full scope and limits.
