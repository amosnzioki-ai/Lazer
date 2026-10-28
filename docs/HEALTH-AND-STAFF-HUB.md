# Confidential health profiles and the staff collaboration hub

## Two separate information boundaries

Health records are separate from the employee directory and the staff publishing system. They are fetched only from `/api/employees/:id/health`, never embedded in directory, profile-summary, reporting or hub responses. Central HR and super administrators can read/update them; an employee can read only their own. School administrators, principals, finance, recruitment and Enko do not receive general health access.

The profile records allergies/sensitivities, relevant conditions, medication/support notes, workplace adjustments, emergency support instructions, an authorized health contact, last-review date and a source/authorized-purpose note. Fields are optional except review date and source/purpose when saving. It is a workplace-support record, not a diagnosis or medical-advice tool. Collect only information with a lawful, necessary workplace purpose.

In the connected application, the JSON health fields use AES-256-GCM with a fresh random nonce and authentication tag. Only encrypted payloads are stored in `employee_health`; identity/version/audit metadata remains ordinary database metadata. Read/update audit entries contain employee identifiers and actions, not health text. Optimistic versions prevent silent overwrites. Health responses use `Cache-Control: no-store`. No health publish or export function exists.

### Encryption key requirements

`HEALTH_DATA_KEY` must contain a private 32-byte key encoded as 64 hex characters. The development setup generates a private development-only key in the Git-ignored `.env` when missing. Existing keys are preserved. No key is embedded in the HTML, JavaScript, source, ZIP or logs. If a valid key is missing, health writes/decryption fail rather than silently storing plaintext.

Production needs a stable key from a secret manager, access restrictions, key backup/recovery and a deliberate rotation/re-encryption plan. Do not rotate/delete the key casually: existing records require it for recovery. Do not use a network-proxy placeholder as a local encryption key. Application-field encryption is not a claim that the whole database, backups or hosting environment have been secured.

## Admin reports and minutes

Open **Reports & meetings**, either inside the HR workspace or from the application's sidebar. Administrators can create reports and minutes as confidential drafts, edit them, and publish an explicitly reviewed Staff-ready version. Minutes have a text template for agenda, attendees, discussion, decisions and actions. A school administrator can manage records only for their own school; central HR can manage KISC-wide or school-specific records.

The user confirmed that “public” means **authorized KISC staff only**, not the open Internet. Publishing is always within the authenticated staff audience. School-specific publications are visible to staff with that school assignment; KISC-wide records are visible to authorized staff accounts. Enko oversight has no automatic communications access. The admin “Published staff preview” is a presentation preview of published records already within that admin's authorized scope, not a login/impersonation feature.

Before publishing, an admin must mark the content Staff-ready and affirm that it has been reviewed for its chosen audience. The record's version is checked inside a transaction, as are edit/withdraw actions. Editing returns a published record to draft with a new version; withdrawal also returns it to draft. Previously downloaded copies cannot be recalled. Downloads are plain text and require current server authorization/version validation, with an audit entry.

Health profiles cannot be selected as source records, published through the health API, or automatically copied into this workspace. The review checkbox is a human attestation, not an automatic medical/PII detector: an administrator could still manually paste inappropriate material. Policy, training and review remain essential. Do not place health, private personnel, grievances or safeguarding case details in a staff publication.

## Five related working tools

1. **Meeting calendar:** create dated meetings with venue/link and chair/owner; filter the agenda by Nairobi calendar month. A month-boundary test confirms a Nairobi 1 November meeting is included in November despite a prior-day UTC timestamp.
2. **Action tracker:** record actions with a responsible owner label, due date and Open/In progress/Completed progress. Overdue labels use Nairobi dates. Changes follow the same draft/review/publish process.
3. **Decisions register:** store decisions, reasoning, owner and follow-up date in a searchable register.
4. **Staff noticeboard:** publish reviewed announcements to KISC-wide or school-specific staff audiences.
5. **Policy acknowledgements:** publish a version and let each signed-in person acknowledge that specific version. The backend uses the authenticated account, refuses acknowledgements for unavailable/old versions, and de-duplicates repeats. Previous version acknowledgements are retained; revised policies need a fresh acknowledgement. Authorized admins see the current version's acknowledgement count.

Owner/chair fields are text labels, not permission grants or automated task assignment. The calendar is an agenda/date filter, not a connected Outlook/Google scheduling service. External invitations, email/SMS reminders, automatic escalations, task assignee notifications and calendar conflict detection are not implemented. Rich-text/attachments, PDF/Excel output, signatures, cross-referenced minutes/action generation and full approval delegation are also future work.

## Downloadable demonstration

`KISC-PeopleHub-Health-Reports.html` is a self-contained fictional-data demonstration of the HR workspace. It includes health forms, draft/publication controls, published previews and the five collaboration sections. Browser-local demo storage is **not encrypted medical storage or authentication**. Anyone with the file/browser storage can inspect the fictional state. Never enter actual health or personnel information into it. The offline preview cannot establish real backend authorization or publish onto the Internet.

The same UI connects to the protected PostgreSQL APIs in the application. The independent concept/unfinished-production status, original school logo asset limitation, and remaining MFA, privacy, retention, backup and security-review requirements are unchanged. No real health data has been entered or real-world publication/deployment performed.

## Validation

- Backend suite: 19 passed, zero failed/skipped. New checks include authenticated encryption round-trip/nonces/tamper rejection, at-rest ciphertext, health role/owner isolation, absence of health content from directory/hub/audits, version conflicts, draft invisibility, school boundaries, publication review, withdrawal-on-edit, authenticated downloads, Enko denial and acknowledgement identity/version/de-duplication.
- Browser: offline health form, private publication guard, reviewed staff publication, staff preview, policy acknowledgements, seven hub categories, Nairobi meeting month filtering, dark/mobile overflow and no script/network errors passed.
- Existing organization, employee/qualifications/attendance, and website-to-HR entry browser flows passed after integration.
- Normal application, standalone HR and standalone public-site builds passed. The local development environment initializer was checked for preservation of its existing configuration.

These are development checks, not a clinical-safety assessment, penetration test, WCAG certification or approval to handle actual staff medical records. Before real use, complete KISC's legal/privacy assessment, consent/lawful-basis and retention processes, privileged MFA/access review, encrypted backups with key recovery, incident controls and independent security verification.
