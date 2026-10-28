# KISC PeopleHub

A staff-only HR platform for Kitengela International Schools. Seven school sections, three campuses, one workforce. Built with React, Express and PostgreSQL.

**Release 0.1 is a working development foundation, not the complete or production-approved HRMS.** The full research is preserved in [docs/KISC-BRIEF.md](docs/KISC-BRIEF.md) and [docs/HR-RESEARCH.md](docs/HR-RESEARCH.md). [Delivery roadmap](docs/ROADMAP.md) lists the unfinished requirements without treating task registers as specialist implementations.

[Desktop screenshot](docs/screenshots/dashboard.png) · [Mobile screenshot](docs/screenshots/mobile.png) · [Validation results](docs/VALIDATION.md)

## Open the employee-management section

`KISC-PeopleHub-HR.html` opens the interactive HR demonstration directly: staff cards, profile details, editing, qualifications, attendance history and device-enrollment illustrations. Use fictional data only. The public website HTML also has **Explore HR demo**. These files do not connect to PostgreSQL or physical scanners.

The connected application's **People** section uses the same interface with real PostgreSQL APIs. Hardware integration is vendor-neutral because no device has been selected. See [employee and device integration guide](docs/EMPLOYEES-AND-DEVICES.md) for implemented capabilities, security boundaries, normalized event delivery and remaining production work.

## Open the website as a single file

Download `KISC-PeopleHub-Light-Dark.html` and open it in a modern browser. Use the Light/Dark control at the top right. Everything required for the public website is included; hosting and database setup are unnecessary. Rebuild with `npm run build:website` then `python scripts/package-html.py`.

## Start with the public website

The new public homepage introduces PeopleHub with features, campus information, FAQs and an interactive fictional workforce preview. It runs without the database: `npm run dev` starts the frontend, with the website at `/` and the development application at `/app`.

For a standalone website you can publish first, run `npm run build:website`. The output is `website-dist/`; a ready-to-upload ZIP is `kisc-peoplehub-website.zip`. See [the website and simple hosting guide](docs/WEBSITE.md). No public deployment has been performed.

For Render, the repository now includes a static-site `render.yaml` blueprint. See [Render deployment instructions](docs/RENDER.md). This publishes the public website and fictional HR demo; it does not expose the private API or database.

## Your first run

You need Node.js 24, npm and Docker with Compose. In a terminal:

```sh
cd /workspace/Lazer
bash scripts/dev-setup.sh
npm run server
```

Leave that terminal running. In another terminal, from the same directory:

```sh
npm run dev
```

The terminal reports the development server's address. The API runs on port 3001; Vite uses port 5173 and proxies `/api` to it. The API also serves the built website directly. `npm run build` refreshes that copy.

The setup creates a private, Git-ignored `.env` file and a fictional demonstration database. Sign in with `super_admin@example.test` and the `SEED_PASSWORD` from your local `.env`. Open the file privately in your editor; do not post its contents or commit it. Changing that variable **does not** change passwords in an existing database.

Additional initial demo identities: `school_admin@example.test`, `employee@example.test`, `enko@example.test`, `finance@example.test`, `recruiter@example.test`, `hr@example.test`, `principal@example.test`, `manager@example.test`. They initially share the development seed password. Demo startup adds missing demonstration identities without changing existing passwords.

**Never put real employee, salary, bank, identity or confidential case data into this release.** Do not expose its demo accounts to the public Internet.

## Try it step by step

1. Sign in and explore the workforce dashboard and school filter.
2. Open **People**. Search for Amara, open her profile, or add a fictional employee using the form.
3. Open **Leave & attendance**. Submit a request and approve or reject it as an administrator.
4. Open **Recruitment** or another register. Create a task with a school, due date and details; open it to start, complete or cancel it.
5. Inspect **Audit trail** to see server-recorded activity.
6. Sign out and try a school or employee account to see the narrower access.

## What works

- Responsive branded workspace, collapsible sidebar, dashboard, charts, alerts and searchable tables.
- PostgreSQL persistence, repeatable schema initialization, nine predefined role policies, school restrictions and aggregate-only Enko access.
- Password hashing, opaque server-side sessions, HttpOnly cookies, sign-out, rate limits, validation and security headers.
- Employee creation, profile viewing, filtering and CSV export.
- Leave submission, weekday duration, single-stage approve/reject with repeat-decision protection.
- Scoped HR task registers with due dates and start/complete/cancel transitions.
- Aggregate workforce reporting, account inventory, and sign-in/write audit events.

## Validate

With the API and database running against fictional data:

```sh
npm test
npm run build
node tests/browser.mjs
```

The browser smoke test needs Chromium (`/usr/bin/chromium` by default); set `CHROMIUM_PATH` to another installed executable. It writes desktop/mobile screenshots to `/tmp`. API tests create and clean up fictional test rows, and leave traceable audit events. Run them only against a dedicated development/test database.

## Project map

- `src/`: React interface and responsive styling; fonts are bundled locally.
- `server/`: API, authorization policy and PostgreSQL schema.
- `tests/`: policy, database-backed API and browser checks.
- `docs/`: original research, delivery scope and deployment/security guidance.
- `scripts/dev-setup.sh`: repeatable dependency/database/build setup.

See [deployment and security](docs/DEPLOYMENT.md) before considering staging or production. No payments, email, SMS, electronic signatures, MFA, private file storage or automated backups are connected. The temporary KISC crest is a text-based placeholder; an approved logo has not been supplied.

## Organization and placement

The HR workspace now opens with each school separated into teaching, support and leadership teams, and a dedicated Head Office & Group Leadership section. Use **Add & assign staff** or a team's plus button to create a colleague in the appropriate section. This does not grant login permissions. See [organization guide](docs/ORGANIZATION.md).

## Health, reports and staff collaboration

The new **Health** profile tab is restricted to central HR and the employee concerned in the connected app. **Reports & meetings** provides confidential drafts, reviewed staff-only publication, meeting agendas, actions, decisions, staff notices and versioned policy acknowledgements. Open `KISC-PeopleHub-Health-Reports.html` to try these with fictional data only. See [health and collaboration guide](docs/HEALTH-AND-STAFF-HUB.md) for roles, encryption keys, publishing boundaries and production limitations.
