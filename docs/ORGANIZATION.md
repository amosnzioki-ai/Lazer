# School teams, head office and staff assignment

## Structure now implemented

The HR workspace opens to **Our organization**:

- Seven school sections, each with Teaching staff, Support staff and Leadership views.
- A separate **Head Office & Group Leadership** area for people with KISC-wide responsibilities, including executive leadership and central HR, finance, academic strategy and operations.
- **Employee directory** for searching all authorized colleagues or narrowing by school/office, staff group, department and employment status.
- **Add & assign staff**, a dedicated creation form with organizational destination and staff group selected first. Each school/team also has a contextual add shortcut that preselects those fields.

Existing profiles can be amended by central HR or the appropriate school administrator, subject to server checks. The staff group and department appear in the directory and profile. A department may be selected from suggestions or typed, allowing additional support functions without creating a new login role.

This represents one primary placement per employee. Secondary cross-school assignments and formal transfer approval/history workflows remain separate future work.

## Data and permissions

`employees.org_scope` is School or Head office. School records require a `school_id`; head-office records require `school_id=null`. `staff_category` is Teaching, Support or Leadership. Both create and profile-update APIs validate this relationship. School administrators cannot create head-office staff, read central profiles or move staff between schools. Only central HR/super administrators can assign central-office placement. Enko sees only approved aggregate counts, including a separate central-office report row.

**Staff classification does not grant system access.** Adding someone to Leadership creates a personnel record, not an administrator account or privileged role. Account provisioning and permission assignment remain separate. One central administrative unit does not count as an eighth school or a fourth physical campus.

The database migration adds organizational fields and derives an initial category from previously stored departments only for records without a category. Existing explicit assignments are retained. Fictional additions are inserted idempotently with separate demonstration staff IDs. The offline HTML migrates its older fictional sample data without resetting edits and appends missing organization examples.

The new demonstration starts with 48 fictional staff: six in each of the seven school sections, plus six central-office colleagues. Actual staff counts, names, reporting lines and leadership appointments require KISC verification. No generated example is presented as a real KISC employee.

## Validation

The connected backend suite passed 17 tests, including central creation/update, nullable central school placement, per-school teaching/support/leadership examples, school-admin isolation, invalid placement rejection and aggregate-only central reporting. Browser checks cover contextual school/support creation, head-office leadership creation, editing the staff group, the dedicated assignment form, existing employee/qualification/attendance workflows and dark/mobile layouts. The single-file website entry into the HR demo remains functional.

Rebuild downloads using the commands in EMPLOYEES-AND-DEVICES.md. `KISC-PeopleHub-Organized-Teams.html` is an explicitly named copy of the updated standalone HR file. It uses fictional local data; the connected application uses PostgreSQL. Hardware integration and the remaining production-security requirements are unchanged.
