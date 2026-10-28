# Delivery specification and honest release status

The two original research documents in this directory remain the full functional specification. Their factual/legal statements have not been independently verified. The product is one organization's internal, staff-only HRMS; SaaS billing, students, parents, admissions, fees and grades are excluded. Configurable curricula must remain independent of schools. Proposed school labels and campus allocations require KISC confirmation. No official endorsement is implied.

Status vocabulary: **Working** means exercised implementation; **Register only** means a generic persisted task, not the specialist workflow; **Pending** means not implemented. A visible planned feature is never an enabled production control.

## Phase 1: Foundation (current release, incomplete)

| Requirement | Status / next acceptance condition |
|---|---|
| React portal, PostgreSQL, API and validation | Working; modular foundation, not an enterprise scaling claim |
| Seven sections and three campuses | Working seeded directory; editing schools, curricula, departments and organizational structure pending |
| One employee master record, unique staff ID/email | Working creation, directory, profile and exports; update history, assignments and import pending |
| Personal, emergency, dependent, bank, statutory and beneficiary details | Pending; no sensitive fields collected yet |
| Role and school permissions | Working fixed role policies and server-side school restrictions; custom roles, field-level grants and delegated access pending |
| Employee self-service | Working own leave and own helpdesk records; profile changes, payslips, documents and schedules pending |
| Enko oversight | Working aggregate workforce report only; policies, approved report sharing and configurable grants pending |
| Dashboards for every role | Shared role-filtered workspace working; dedicated finance/recruitment/manager task summaries pending |
| User accounts and sessions | Login, logout, inventory and expiry working; invitations, password reset, revocation UI, SSO, mandatory MFA and reauthentication pending |
| Audit | Write/sign-in events persisted; read/download/export and denial coverage, transaction coupling, tamper resistance and retention pending |
| Digital personnel files and document uploads | Register only; private object storage, MIME/size checks, antivirus, authorization and download audit pending |
| Backups, recovery, encryption and security monitoring | Pending production infrastructure and restoration/security verification |
| Branding and accessibility | Responsive interface and keyboard forms/modal implemented; official logo and WCAG 2.2 AA audit pending |
| Public website, contact, FAQ, privacy and terms | Public homepage, features, campuses, FAQ and project/privacy notice working; contact service, full legal terms and public careers pending |

## Phase 2: Essential HR operations

| Requirement | Current status / next implementation |
|---|---|
| Leave application and decision | Working single-stage request/approve/reject; not policy-complete |
| Leave accrual, balances, carryover and entitlements | Pending versioned policy rules, contract-specific working calendars and independent calculation tests |
| Holidays and overlap handling | Pending; weekday count is illustrative only and not an entitlement calculation |
| Multi-stage approvals, delegation, escalation and cancellation | Pending configurable workflow engine and authorization tests |
| Attendance | Register only; clock-in/out, corrections, lateness, overtime and payroll export pending |
| Shifts, duties, timesheets and teacher replacement | Register only; rota conflicts, cover assignment and manager confirmation pending |
| Onboarding | Register only; checklist dependencies, clearances, references, induction, equipment and acknowledgments pending |
| Probation and contracts | Register only; dated employment history, review decisions, expiry reminders, letters and renewal approvals pending |
| Helpdesk, welfare and announcements | Scoped task records working; messaging, acknowledgments, routing, service levels and policy attachments pending |
| Automated notifications | In-app attention summary working; scheduled jobs, delivery providers, retries and escalation pending |
| Bulk operations and import | Pending dry-run validation, duplicate resolution and authorized audit coverage |
| Advanced search and pagination | Client-side search working for demonstration volumes; indexed backend search and pagination pending |

## Phase 3: Complete HR lifecycle

| Requirement | Current status / next implementation |
|---|---|
| Recruitment | Register only; requisitions, approvals, public careers, applicants/consent, screening, interviews, scorecards, offers and hire conversion pending |
| Staff establishment and vacancies | Pending approved position/grade/cost-centre budgets and vacancy reconciliation |
| Payroll | **Disabled**; no calculations, payslips, payments or filing claims |
| Kenyan statutory compliance | Pending reviewed effective-dated PAYE/NSSF/SHIF/AHL rule versions; sources, rounding, test cases and historical locks required; do not hardcode rates |
| Compensation, benefits, allowances and loans | Benefits register only; salary structures, deductions, gross-to-net, proration and history pending |
| Payroll approvals/reconciliation | Pending independent makers/checkers, reauthentication, immutable run snapshots, reversals, payslips and bank/accounting reconciliation |
| Performance, probation and promotions | Register only; goals, rubrics, cycles, self-assessment, manager/360 reviews and decisions pending |
| Training, CPD, qualifications, TSC and safeguarding | Register only; structured credentials, validity, learning plans, completion evidence and renewal automation pending |
| Transfers and multiple assignments | Register only; sending/receiving approvals, effective dates, reporting lines and cost allocations pending |
| Employee relations | HR-only registers; case parties, conflict-of-interest controls, evidence access, confidentiality partitions, appeals and hearing timelines pending |
| Assets | Register only; inventory, custody history, issuance, return and clearance pending |
| Offboarding | Register only; exit tasks, final pay, retention and reliable account/session revocation pending |
| Reporting | Workforce distribution and CSV working; attendance, absence, recruitment, payroll, contracts, training, performance and longitudinal analytics pending |

## Phase 4: Administration, integration and launch

- Organization/school/campus/department/position/curriculum editing with historical assignments.
- Custom granular roles, per-action and per-field grants, restricted group oversight, access reviews and break-glass governance.
- Policy/workflow editors, templates, letter generation, signature provider, calendar and accounting interfaces.
- Private files, Excel imports/exports, PDF reports/payslips, notification templates and delivery tracking.
- Effective-dated compliance rules; independent legal/finance review and documented statutory source references.
- SSO/MFA, password recovery, staff provisioning, offboarding identity integration and fresh authentication for sensitive actions.
- External append-only audit sink, alerting, failed-login/authorization monitoring, integration retries/idempotency and operational runbooks.
- Managed PostgreSQL TLS, at-rest key management, encrypted file storage and encrypted backups; actual restore drills with agreed RPO/RTO.
- Kenyan privacy notices, retention schedules, legal holds, data subject requests, DPIA/controller review and international transfer governance.
- Security assessment (OWASP ASVS), dependency scans, role/record/field isolation tests, load testing, accessibility audit and mobile browser coverage.
- Staff training and administrators' operating guide; agreed incident response, service ownership and production acceptance sign-off.

## Launch acceptance gates

No real HR data or payroll until: every role matrix is reviewed; access cannot be bypassed through URLs; leave calculations are independently verified; payroll reconciles against finance-approved fixtures; files are private and scanned; offboarding revokes access; significant reads and writes are audited; backup restoration succeeds; MFA and sensitive reauthentication work; accessibility, privacy, cross-border and legal reviews are complete. The original research acceptance checklist applies in full.

## Additional research requirements retained

Expense claims, travel reimbursements, recognition, surveys, whistleblowing, HR knowledge-base content, employee demographic/turnover analysis, scheduled reports and notification preferences are pending specialist workflows, not silently excluded. Phase 3 covers the financial/employee-service functions and Phase 4 covers communication automation/reporting.

Predictive analytics, succession planning, AI-assisted search/drafting, authorized chatbots, internal talent marketplace, multilingual portals, advanced optimization and offline/native mobile functionality are optional Phase 4 extensions, deferred until core privacy and workflow controls pass. Multi-company subscriptions, licensing and SaaS billing are intentionally out of this single-organization project scope.

See [the itemized research inventory](REQUIREMENTS.md) for every checklist item and its implementation status.

## Employee operations implementation update

The employee foundation now includes card/table directory, filtering, individual detailed profiles, editable employment/contact/emergency details, structured qualifications with HR verification/expiry, attendance timelines and activity. Employees can read only their own profile; central HR and school roles follow server-side scope rules. Profile reads/updates and events are audited. Staff archiving disables linked accounts/sessions and removes device enrollments. This is not the full offboarding workflow.

Attendance now has individual IN/OUT events, manual HR entries with reasons, Nairobi day views, paired elapsed hours, CSV, sequence validation and duplicate-event protection. This replaces the earlier attendance-register-only status for these specific capabilities. Shifts, corrections/approval policies, payroll integration, breaks and overtime remain pending. Qualifications now support structured add/amend records; live authority checks and certificate files remain pending. A credential/enrollment-based device endpoint and vendor-normalized adapter example exist; actual hardware integration is untested and no device has been selected. See EMPLOYEES-AND-DEVICES.md.

Both the connected app and self-contained fictional HR HTML were exercised. This does not close the full production acceptance gates or imply biometric recognition, real CCTV integration or a completed HRMS.

## Health and staff collaboration update

A separate encrypted health-profile store with central-HR/own-record access, version checks and redacted read/write audit actions is now implemented. It is not production approved for medical data. Reports and minutes have admin drafts, scope-aware staff-only publication, review/classification gates, edit-to-draft versions and text downloads. Five related tools now have working record workflows: meeting agenda/calendar, action tracking, decisions, notices and versioned policy acknowledgements. External providers, files/PDF/Excel, advanced approval chains and production/privacy gates remain open.
