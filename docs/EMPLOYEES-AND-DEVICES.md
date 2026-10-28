# Employee records, qualifications and attendance

## What is implemented

The connected application's **People** section now provides a school-scoped searchable directory with card/table views, department/status filters and individual profiles. Profiles include employee identity, work email, role, department, school, curriculum, employment type, start/end dates, reporting-manager label, contact details, emergency contacts, TSC reference and a professional introduction. HR editors can create and update profiles; principals/managers can read within their school; employees can read only themselves; finance has directory summaries without private profile access. Enko has no individual access.

Academic, professional, TSC and safeguarding qualification records support title, issuer, dates, optional expiry and HR verification status. HR can add and amend them. Verification is a recorded HR decision, not a live check with an authority. Expired credentials are visibly flagged. Certificate upload/storage is not implemented.

Each profile has attendance events, day filtering in Africa/Nairobi, first clock-in, latest clock-out, recorded hours and current state, plus CSV export and activity history. HR can enter manual events with a reason. Manual records cannot impersonate fingerprint/device events. Profile updates, reads, credentials and attendance actions generate activity/audit entries. CSV export currently relies on authorized profile access; a dedicated export audit event is still pending.

The connected view refreshes every 30 seconds while visible and without open forms, and has manual Refresh controls. It is not a streaming or hardware availability guarantee.

Archiving an employee disables their linked account, deletes their sessions and removes device enrollments. Reactivation does not automatically restore identities or enrollments. End-to-end offboarding and workflow approvals remain separate work.

## Open it directly

`KISC-PeopleHub-HR.html` is a self-contained interactive HR demonstration. Download/open it in a modern browser. Fictional profiles, qualifications, profile editing, manual time events, and device-registration/enrollment illustrations work without a server. Changes use local browser storage when available; if storage is blocked they exist only for the open session. It is not secure storage for real staff information. The offline demonstration cannot receive events from physical hardware and issues no usable device credentials.

The updated public website HTML also includes **Explore HR demo**, with a return-to-website control. Neither static HTML file is the authenticated production application.

Rebuild the HR download: `npm run build:hr` then `python scripts/package-html.py --hr`. The connected React build remains `npm run build` with API startup as documented in README.md.

## How a real terminal connects

A device vendor, gateway or on-premises adapter must first authenticate an employee on the physical device. PeopleHub accepts only a normalized identity reference and attendance event. It does not capture or match fingerprints, detect faces, read video or control door locks.

1. HR registers the terminal under **Attendance connections**, selecting its school and category. The server returns a cryptographically random bearer key once; it stores only its SHA-256 digest. Store the key in the adapter's secret manager. Never put it in a website, repository, screenshot or chat.
2. HR enrolls a staff member by mapping the device's pseudonymous employee reference to the existing PeopleHub employee. Both must belong to the same school. Do not enter biometric templates as references.
3. The adapter sends an HTTPS POST to `/api/integrations/attendance`, using `Authorization: Bearer <device-key>` and `Content-Type: application/json`.
4. The endpoint verifies the registered/enabled key, enrollment and current employee/school. It records the time and direction atomically with an audit event. Revoking the device key immediately blocks further events.

Example request body (all fields required):

```json
{
  "external_ref": "vendor-staff-001",
  "event_id": "terminal-original-event-000123",
  "direction": "IN",
  "occurred_at": "2026-10-24T08:00:00+03:00"
}
```

The example date is illustrative; send the real event time, not this sample. Use the same original event ID when replaying an event. Identical repeated events return 200 with `duplicate: true`; first ingestion returns 201. Reusing an ID for a different payload returns 409. Other invalid data returns 400; invalid/revoked device credentials return 401; unknown/out-of-school enrollment returns 403.

Events must be within the last 31 days and at most five minutes in the future. Clock-out requires an open clock-in; a second clock-in or out-of-order event is rejected. Synchronize terminal clocks and send buffered events in chronological order. The database locks the employee during ingestion to prevent parallel state conflicts. Device requests do not use user-session cookies.

`scripts/device-adapter.mjs` is a minimal bridge for normalized newline-delimited JSON. Supply `ATTENDANCE_ENDPOINT` and `ATTENDANCE_DEVICE_TOKEN` through secure runtime configuration, then pipe an input file to the script. It sends sequentially, requires HTTPS except loopback development, logs acceptance without keys or personal payloads, and stops on the first failure. Preserve the original input for review/replay. It is not a vendor driver and has no automatic offline queue or retry subsystem.

## What still needs the school's hardware details

No physical terminal or camera was connected or tested. Vendor model, firmware, API/SDK, supported export format, deployment network and IN/OUT reader mapping are needed to implement and test the vendor adapter. A CCTV system requires a separately approved identity vendor and privacy/security assessment before any biometric processing. An ordinary CCTV camera does not automatically identify staff or reliably determine attendance.

The software does not store raw biometric templates, photographs or video. Before deployment, KISC must determine lawful basis, staff notices, retention, access controls and data-protection impact requirements, especially for biometric processing. Use alternative clocking methods where required by policy. These are deployment prerequisites, not controls this prototype claims to implement.

## Scope and production limits

This is employee operations development, not the complete HRMS or a production clearance. No real data should be entered yet. Authentication/MFA hardening, private certificate/personnel files, payroll, rosters, public holidays, overtime/break rules, leave reconciliation and correction approval chains are still pending.

Attendance hours are paired-event elapsed time, clipped to the selected Nairobi day, with open intervals counting to now. Only the latest 300 events are loaded in the profile. This is a review summary, not a payroll timesheet or a legal working-hours calculation. Missing punches require a separate correction workflow; event deletion/editing is intentionally not offered. Manager relationships are labels, not a full reporting-line authorization engine. Event/table pagination, long-term retention and streaming updates remain future work.

National identity numbers, bank accounts, statutory tax details, payroll history, dependent records and private file uploads are not part of this employee-core release. They require the corresponding restricted-field, encryption/storage and payroll workflows.

Initial demo data is added idempotently to fictional seed staff. Other employee records are preserved. Current SQL uses additive schema initialization; a formal migration system remains required before production.

The separate PeopleHub product mark uses KISC green, white and charcoal. The original school eagle-logo image shown in chat is not embedded as a verified original asset; no substitute eagle has been generated or presented as the official school logo.
