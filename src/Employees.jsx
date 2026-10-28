import HealthProfile from "./HealthProfile.jsx";
import StaffHub from "./StaffHub.jsx";
import React, { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Building2,
  Search,
  Plus,
  ArrowLeft,
  ArrowUpRight,
  LayoutGrid,
  List,
  GraduationCap,
  Clock3,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  Fingerprint,
  Monitor,
  Settings2,
  Download,
  RefreshCw,
  X,
  Contact,
  CheckCheck,
  Activity,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";
import BrandMark from "./BrandMark.jsx";
import { demoPeopleApi, demoSchools, eventId } from "./people-demo.js";
import "./employees.css";
import AssignmentForm from "./AssignmentForm.jsx";
import {
  staffCategories,
  categoryLabel,
  isHeadOffice,
  placementValue,
} from "./organization.js";
const tz = "Africa/Nairobi";
const dayKey = (d) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(d));
const today = () => dayKey(new Date());
const date = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: tz,
      })
    : "Not recorded";
const time = (d) =>
  d
    ? new Date(d).toLocaleTimeString("en-KE", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: tz,
      })
    : "—";
const initials = (n) =>
  n
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
const editorRoles = ["super_admin", "hr", "school_admin"];
function hours(events, day) {
  const start = new Date(day + "T00:00:00+03:00").getTime(),
    end = start + 86400000;
  let total = 0,
    open = null;
  for (const e of [...events].sort(
    (a, b) => new Date(a.occurred_at) - new Date(b.occurred_at),
  )) {
    const at = new Date(e.occurred_at).getTime();
    if (e.direction === "IN") open = at;
    else if (open !== null) {
      total += Math.max(0, Math.min(at, end) - Math.max(open, start));
      open = null;
    }
  }
  if (open !== null)
    total += Math.max(0, Math.min(Date.now(), end) - Math.max(open, start));
  return (total / 3600000).toFixed(1);
}
const emptyProfile = {
  phone: "",
  location: "",
  employment_type: "Permanent",
  manager: "",
  emergency_name: "",
  emergency_phone: "",
  tsc_number: "",
  bio: "",
  contract_end: null,
  status: "Active",
  curriculum: "CBE",
};
export default function Employees({
  user,
  schools,
  api,
  school = "all",
  onChanged = () => {},
  offline = false,
}) {
  const [list, setList] = useState([]),
    [selected, setSelected] = useState(null),
    [tab, setTab] = useState("Overview"),
    [search, setSearch] = useState(""),
    [schoolFilter, setSchoolFilter] = useState(school),
    [department, setDepartment] = useState("All departments"),
    [status, setStatus] = useState("All statuses"),
    [layout, setLayout] = useState("grid"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState(null),
    [busy, setBusy] = useState(false),
    [devices, setDevices] = useState([]),
    [section, setSection] = useState("organization"),
    [category, setCategory] = useState("All staff groups"),
    [attendanceDay, setAttendanceDay] = useState(today()),
    [token, setToken] = useState(null);
  const canEdit = editorRoles.includes(user.role);
  const canCentral = ["super_admin", "hr"].includes(user.role);
  const seeCentral = canCentral || list.some(isHeadOffice);
  function openTeam(placement, group = "All staff groups") {
    setSchoolFilter(placement);
    setCategory(group);
    setSearch("");
    setDepartment("All departments");
    setStatus("All statuses");
    setSection("people");
  }
  function addContext(placement, group) {
    setModal({ add: { placement, category: group || "Support" } });
  }
  async function createEmployee(d) {
    const result = await mutate(
      () => api("/employees", { method: "POST", body: JSON.stringify(d) }),
      "Employee created",
    );
    if (result)
      openTeam(
        d.org_scope === "Head office" ? "head-office" : String(d.school_id),
      );
  }

  const load = async () => {
    setList(await api("/employees"));
    if (canEdit) setDevices(await api("/devices"));
  };
  useEffect(() => {
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 5000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const handler = (e) => {
      if (e.key === "Escape") setModal(null);
      if (e.key === "Tab") {
        const nodes = [
          ...document.querySelectorAll(
            ".people-dialog button,.people-dialog input,.people-dialog select,.people-dialog textarea",
          ),
        ].filter((n) => !n.disabled);
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          e.preventDefault();
          nodes[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [modal]);
  async function openEmployee(id) {
    setError("");
    setLoading(true);
    try {
      setSelected(await api("/employees/" + id));
      setTab("Overview");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function mutate(fn, message) {
    setBusy(true);
    setError("");
    try {
      const result = await fn();
      await load();
      if (selected) setSelected(await api("/employees/" + selected.id));
      onChanged();
      setModal(null);
      setNotice(message);
      return result;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (offline || busy || modal) return;
    const timer = setInterval(async () => {
      if (document.hidden) return;
      try {
        await load();
        if (selected) setSelected(await api("/employees/" + selected.id));
      } catch (e) {
        setError(e.message);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [offline, busy, modal, selected?.id]);
  const visible = list.filter(
    (e) =>
      (schoolFilter === "all" ||
        (schoolFilter === "head-office"
          ? isHeadOffice(e)
          : !isHeadOffice(e) &&
            String(e.school_id) === String(schoolFilter))) &&
      (category === "All staff groups" || e.staff_category === category) &&
      (department === "All departments" || e.department === department) &&
      (status === "All statuses" || e.status === status) &&
      [e.name, e.staff_id, e.title, e.email, e.school]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const inNow = visible.filter((e) => e.last_direction === "IN");
  function exportAttendance() {
    if (!selected?.attendance.length)
      return setNotice("No attendance events to export.");
    const escape = (v) => '"' + String(v ?? "").replaceAll('"', '""') + '"';
    const lines = [
      ["Time (UTC)", "Direction", "Source", "Reason"],
      ...selected.attendance.map((e) => [
        e.occurred_at,
        e.direction,
        e.source,
        e.reason,
      ]),
    ]
      .map((row) =>
        row
          .map((v) => escape(/^[=+@-]/.test(String(v)) ? "'" + v : v))
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([lines], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = selected.staff_id + "-attendance.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  const badge = (s) => (
    <span
      className={
        "people-badge " +
        (s === "Active" ? "positive" : s === "Archived" ? "neutral" : "warning")
      }
    >
      {s}
    </span>
  );
  const events =
    selected?.attendance.filter(
      (e) => dayKey(e.occurred_at) === attendanceDay,
    ) || [];
  return (
    <section className="people-workspace">
      {offline && (
        <div className="people-demo-strip">
          <ShieldCheck size={15} />
          <span>
            OFFLINE HR DEMONSTRATION · Fictional staff · Changes stay in this
            browser · No real scanners connected
          </span>
        </div>
      )}
      {error && (
        <div className="people-alert" role="alert">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {notice && (
        <div className="people-success" role="status">
          <CheckCheck size={16} />
          {notice}
        </div>
      )}
      {!selected ? (
        <>
          {section !== "hub" && (
            <>
              <div className="people-intro">
                <div>
                  <span className="people-eyebrow">
                    PEOPLE & CULTURE / KISC
                  </span>
                  <h2>
                    Good people.
                    <br />
                    <em>A great place to grow.</em>
                  </h2>
                  <p>
                    Your colleagues, their credentials and their working day.
                    Together in one place.
                  </p>
                </div>
                <div className="people-intro-note">
                  <span>ONE TEAM.</span>
                  <b>Every colleague counts.</b>
                  <small>Seven school sections. A shared purpose.</small>
                </div>
              </div>
              <div className="people-metrics">
                {[
                  [
                    Users,
                    "People in view",
                    visible.length,
                    "One master record per employee",
                  ],
                  [
                    Fingerprint,
                    "Clocked in",
                    inNow.length,
                    "Latest recorded state · all dates",
                  ],
                  [
                    BuildingIcon,
                    "School sections",
                    new Set(
                      visible
                        .filter((e) => !isHeadOffice(e))
                        .map((e) => e.school_id),
                    ).size,
                    "Within your authorized view",
                  ],
                  [
                    GraduationCap,
                    "Qualifications",
                    visible.reduce(
                      (a, e) => a + (e.qualification_count || 0),
                      0,
                    ),
                    "Recorded credentials, not a compliance score",
                  ],
                ].map(([Icon, label, count, help]) => (
                  <article key={label}>
                    <Icon size={19} />
                    <span>{label}</span>
                    <b>{count}</b>
                    <small>{help}</small>
                  </article>
                ))}
              </div>
            </>
          )}
          <div className="people-section-nav">
            <button
              className={section === "organization" ? "active" : ""}
              onClick={() => setSection("organization")}
            >
              <Building2 size={16} />
              Our organization
            </button>
            <button
              className={section === "people" ? "active" : ""}
              onClick={() => setSection("people")}
            >
              <Users size={16} />
              Employee directory
            </button>
            {canEdit && (
              <button
                className={section === "devices" ? "active" : ""}
                onClick={() => setSection("devices")}
              >
                <Fingerprint size={16} />
                Attendance connections <span>{devices.length}</span>
              </button>
            )}
            {canEdit && (
              <button
                className={section === "add" ? "active" : ""}
                onClick={() => setSection("add")}
              >
                <Plus size={16} />
                Add & assign staff
              </button>
            )}
            {user.role !== "enko" && (
              <button
                className={section === "hub" ? "active" : ""}
                onClick={() => setSection("hub")}
              >
                <FileText size={16} />
                Reports & meetings
              </button>
            )}
            <span className="people-timezone">
              <Clock3 size={13} />
              Nairobi · EAT (UTC+3)
            </span>
          </div>
          {section === "hub" ? (
            <StaffHub
              api={api}
              user={user}
              schools={schools}
              offline={offline}
            />
          ) : section === "organization" ? (
            <div className="organization-workspace">
              {seeCentral && (
                <article className="organization-central">
                  <div className="organization-central-copy">
                    <span className="people-eyebrow">
                      KISC-WIDE RESPONSIBILITY
                    </span>
                    <h3>Head Office & Group Leadership</h3>
                    <p>
                      Top management and the central teams supporting every
                      school: executive leadership, HR, finance, academics and
                      operations.
                    </p>
                    <div className="organization-central-counts">
                      <span>
                        <b>{list.filter(isHeadOffice).length}</b> colleagues
                      </span>
                      <span>
                        <b>
                          {
                            list.filter(
                              (e) =>
                                isHeadOffice(e) &&
                                e.staff_category === "Leadership",
                            ).length
                          }
                        </b>{" "}
                        leaders
                      </span>
                      <span>
                        <b>
                          {
                            list.filter(
                              (e) =>
                                isHeadOffice(e) &&
                                e.staff_category === "Support",
                            ).length
                          }
                        </b>{" "}
                        central support
                      </span>
                    </div>
                    <div className="organization-actions">
                      <button
                        className="people-primary"
                        onClick={() => openTeam("head-office")}
                      >
                        View central team
                        <ArrowUpRight size={15} />
                      </button>
                      {canCentral && (
                        <button
                          className="people-secondary"
                          onClick={() =>
                            addContext("head-office", "Leadership")
                          }
                        >
                          <Plus size={15} />
                          Add head office colleague
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="organization-central-symbol">
                    <Building2 size={46} />
                    <span>
                      ONE KISC.
                      <br />
                      SHARED DIRECTION.
                    </span>
                  </div>
                </article>
              )}
              <div className="organization-school-heading">
                <div>
                  <span className="people-eyebrow">
                    LOCAL TEAMS. ONE CONNECTED COMMUNITY.
                  </span>
                  <h3>School sections & their people</h3>
                  <p>
                    Choose a school, then explore its teaching, support and
                    leadership teams.
                  </p>
                </div>
                <span>{schools.length} sections in your view</span>
              </div>
              <div className="organization-school-grid">
                {schools.map((s, i) => {
                  const members = list.filter(
                    (e) => !isHeadOffice(e) && e.school_id === s.id,
                  );
                  return (
                    <article className="organization-school-card" key={s.id}>
                      <div className="organization-school-top">
                        <span>
                          <Building2 size={20} />
                        </span>
                        <small>SECTION {String(i + 1).padStart(2, "0")}</small>
                      </div>
                      <h3>{s.name}</h3>
                      <p>
                        <MapPin size={12} />
                        {s.campus || "KISC"} campus <span>·</span>
                        {members.length} colleagues
                      </p>
                      <div className="organization-team-rows">
                        {staffCategories.map((c) => (
                          <div key={c}>
                            <button onClick={() => openTeam(String(s.id), c)}>
                              <span
                                className={
                                  "organization-team-dot " + c.toLowerCase()
                                }
                              />
                              {categoryLabel(c)}
                              <b>
                                {
                                  members.filter((e) => e.staff_category === c)
                                    .length
                                }
                              </b>
                              <ChevronRight size={13} />
                            </button>
                            {canEdit && (
                              <button
                                className="organization-add-inline"
                                aria-label={
                                  "Add " + categoryLabel(c) + " to " + s.name
                                }
                                onClick={() => addContext(String(s.id), c)}
                              >
                                <Plus size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="organization-actions">
                        <button
                          className="people-link"
                          onClick={() => openTeam(String(s.id))}
                        >
                          View all staff
                          <ArrowUpRight size={13} />
                        </button>
                        {canEdit && (
                          <button
                            className="people-secondary"
                            onClick={() => addContext(String(s.id), "Support")}
                          >
                            <Plus size={13} />
                            Add staff
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
              <p className="people-footnote">
                A staff member has one primary organizational placement. Staff
                groups do not change login permissions or grant access to other
                schools. Cross-school secondary assignments remain separate
                work.
              </p>
            </div>
          ) : section === "add" ? (
            <article className="organization-add-panel">
              <div>
                <span className="people-eyebrow">
                  THE RIGHT PERSON. THE RIGHT PLACE.
                </span>
                <h3>Add & assign a colleague</h3>
                <p>
                  Choose the school or central office, select their staff group,
                  then create one employee record. You can add further details
                  and qualifications from their profile.
                </p>
                <div className="organization-assignment-note">
                  <ShieldCheck size={23} />
                  <b>One person. One master profile.</b>
                  <span>
                    Placement, department and system access are managed
                    separately.
                  </span>
                </div>
              </div>
              <AssignmentForm
                schools={schools}
                centralAllowed={canCentral}
                initial={{
                  placement: schoolFilter !== "all" ? schoolFilter : undefined,
                  category:
                    category !== "All staff groups" ? category : "Teaching",
                }}
                busy={busy}
                onSubmit={createEmployee}
              />
            </article>
          ) : section === "people" ? (
            <>
              <div className="organization-directory-context">
                <div>
                  <span className="people-eyebrow">
                    {schoolFilter === "head-office"
                      ? "KISC-WIDE TEAM"
                      : schoolFilter === "all"
                        ? "ALL AUTHORIZED TEAMS"
                        : "SCHOOL TEAM"}
                  </span>
                  <h3>
                    {schoolFilter === "head-office"
                      ? "Head Office & Group Leadership"
                      : schools.find((s) => String(s.id) === schoolFilter)
                          ?.name || "All colleagues"}
                  </h3>
                </div>
                <button
                  className="people-link"
                  onClick={() => setSection("organization")}
                >
                  <ArrowLeft size={14} />
                  School & office overview
                </button>
              </div>
              <div className="organization-category-chips">
                {["All staff groups", ...staffCategories].map((c) => (
                  <button
                    className={category === c ? "active" : ""}
                    key={c}
                    onClick={() => setCategory(c)}
                  >
                    {c === "All staff groups" ? c : categoryLabel(c)}
                  </button>
                ))}
              </div>
              <div className="people-toolbar">
                <label className="people-search">
                  <Search size={17} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search people, roles, schools or staff ID…"
                    aria-label="Search records"
                  />
                </label>
                <select
                  aria-label="Filter school section"
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                >
                  <option value="all">All school sections & office</option>
                  {seeCentral && (
                    <option value="head-office">
                      Head Office & Group Leadership
                    </option>
                  )}
                  {schools.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  value={department}
                  aria-label="Filter department"
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option>All departments</option>
                  {[...new Set(list.map((e) => e.department))]
                    .sort()
                    .map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                </select>
                <select
                  aria-label="Filter employment status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {[
                    "All statuses",
                    "Active",
                    "Probation",
                    "On leave",
                    "Archived",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <div className="people-view-toggle">
                  <button
                    aria-label="Card view"
                    aria-pressed={layout === "grid"}
                    onClick={() => setLayout("grid")}
                  >
                    <LayoutGrid size={17} />
                  </button>
                  <button
                    aria-label="Table view"
                    aria-pressed={layout === "table"}
                    onClick={() => setLayout("table")}
                  >
                    <List size={17} />
                  </button>
                </div>
                <button
                  className="people-secondary"
                  aria-label="Refresh employee records"
                  disabled={busy}
                  onClick={() => mutate(async () => {}, "Records refreshed")}
                >
                  <RefreshCw size={15} />
                </button>
                {canEdit && (
                  <button
                    className="people-primary"
                    onClick={() => setModal("add")}
                  >
                    <Plus size={16} />
                    Add employee
                  </button>
                )}
              </div>
              <div className="people-results">
                <span>
                  {visible.length} colleague{visible.length === 1 ? "" : "s"}
                </span>
                <span>Designed around your people.</span>
              </div>
              {loading ? (
                <p className="people-empty">Loading employee records…</p>
              ) : visible.length ? (
                layout === "grid" ? (
                  <div className="people-grid">
                    {visible.map((e) => (
                      <article className="people-card" key={e.id}>
                        <div className="people-card-top">
                          <span
                            className={"people-portrait tone-" + (e.id % 5)}
                          >
                            {initials(e.name)}
                            <i
                              className={
                                e.last_direction === "IN" ? "is-in" : ""
                              }
                            />
                          </span>
                          {badge(e.status)}
                        </div>
                        <button
                          className="people-card-name"
                          onClick={() => openEmployee(e.id)}
                        >
                          {e.name}
                          <ArrowUpRight size={16} />
                        </button>
                        <p className="people-job">{e.title}</p>
                        <span className="people-school">
                          <MapPin size={12} />
                          {e.school}
                        </span>
                        <div className="people-card-tags">
                          <span>{categoryLabel(e.staff_category)}</span>
                          <span>{e.department}</span>
                          <span>{e.curriculum}</span>
                        </div>
                        <div className="people-card-facts">
                          <span>
                            <GraduationCap size={14} />
                            {e.qualification_count} credentials
                          </span>
                          <span>
                            <Clock3 size={14} />
                            {e.last_direction === "IN"
                              ? "Clocked in"
                              : "Clocked out"}
                          </span>
                        </div>
                        <div className="people-card-bottom">
                          <span>{e.staff_id}</span>
                          <button onClick={() => openEmployee(e.id)}>
                            View profile
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="people-table-wrap">
                    <table className="people-table">
                      <thead>
                        <tr>
                          {[
                            "Colleague",
                            "School",
                            "Department",
                            "Qualifications",
                            "Attendance",
                            "Profile",
                          ].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((e) => (
                          <tr key={e.id}>
                            <td>
                              <b>{e.name}</b>
                              <small>{e.title}</small>
                            </td>
                            <td>{e.school}</td>
                            <td>{e.department}</td>
                            <td>{e.qualification_count}</td>
                            <td>
                              {e.last_direction === "IN"
                                ? "Clocked in"
                                : "Clocked out"}
                            </td>
                            <td>
                              <button
                                className="people-link"
                                onClick={() => openEmployee(e.id)}
                              >
                                View profile <ArrowUpRight size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="people-empty">
                  <Search size={28} />
                  <h3>No matching colleagues</h3>
                  <p>
                    Try another name or adjust the department and status
                    filters.
                  </p>
                  <button
                    className="people-secondary"
                    onClick={() => {
                      setSearch("");
                      setDepartment("All departments");
                      setStatus("All statuses");
                      setSchoolFilter("all");
                      setCategory("All staff groups");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="people-device-heading">
                <div>
                  <h3>A connected arrival. A clear record.</h3>
                  <p>
                    Register a school device, map its employee reference, then
                    send authenticated attendance events.
                  </p>
                </div>
                <button
                  className="people-primary"
                  onClick={() => setModal("device")}
                >
                  <Plus size={15} />
                  Register device
                </button>
              </div>
              <div className="people-device-notice">
                <ShieldCheck size={19} />
                <p>
                  {offline
                    ? "This offline preview only demonstrates registration and enrollment. Device keys are placeholders. Real scanners cannot connect to this HTML file."
                    : "No raw fingerprints, face images or video are stored here. A vendor adapter must authenticate a recognized employee and send an IN/OUT event. Registration alone does not establish a hardware connection."}
                </p>
              </div>
              {token && (
                <div className="people-device-secret">
                  <b>
                    {offline
                      ? "Demonstration key"
                      : "New device key · shown once"}
                  </b>
                  <p>
                    Store this securely in your vendor adapter. It is not
                    included in device listings.
                  </p>
                  <code>{token}</code>
                  <button
                    className="people-secondary"
                    onClick={() => setToken(null)}
                  >
                    Hide key
                  </button>
                </div>
              )}
              <div className="people-device-grid">
                {devices.map((d) => (
                  <article className="people-device-card" key={d.id}>
                    <Fingerprint size={29} />
                    <span
                      className={
                        "people-badge " + (d.active ? "positive" : "neutral")
                      }
                    >
                      {d.active ? "Registered" : "Revoked"}
                    </span>
                    <h3>{d.name}</h3>
                    <p>
                      {d.kind} ·{" "}
                      {schools.find((s) => s.id === Number(d.school_id))?.name}
                    </p>
                    <dl>
                      <dt>Employees enrolled</dt>
                      <dd>{d.enrolled || 0}</dd>
                      <dt>Last received event</dt>
                      <dd>
                        {d.last_event
                          ? date(d.last_event) + " " + time(d.last_event)
                          : "No events received"}
                      </dd>
                    </dl>
                    <div>
                      <button
                        className="people-secondary"
                        onClick={() => setModal({ enroll: d })}
                      >
                        Enroll employee
                      </button>
                      <button
                        className="people-link"
                        onClick={() =>
                          mutate(
                            () =>
                              api("/devices/" + d.id, {
                                method: "PATCH",
                                body: JSON.stringify({ active: !d.active }),
                              }),
                            d.active ? "Device revoked" : "Device enabled",
                          )
                        }
                      >
                        {d.active ? "Revoke key" : "Enable key"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {!devices.length && (
                <div className="people-empty">
                  <Fingerprint size={32} />
                  <h3>No devices registered</h3>
                  <p>
                    Start with the terminal’s vendor, model and API
                    documentation. A local adapter is usually needed for door
                    hardware.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <button
            className="people-back"
            onClick={() => {
              setSelected(null);
              setError("");
            }}
          >
            <ArrowLeft size={16} />
            All colleagues
          </button>
          <div className="people-profile-hero">
            <div className="people-profile-avatar">
              {initials(selected.name)}
              <i />
            </div>
            <div className="people-profile-heading">
              <div>
                <span className="people-eyebrow">{selected.staff_id}</span>
                {badge(selected.status)}
              </div>
              <h2>{selected.name}</h2>
              <p>
                {selected.title} <span>·</span> {selected.department}
              </p>
              <span className="people-profile-location">
                <MapPin size={13} />
                {selected.school} <span>·</span>
                {selected.curriculum}
              </span>
            </div>
            <div className="people-profile-actions">
              <button
                className="people-secondary"
                disabled={busy}
                onClick={() => mutate(async () => {}, "Records refreshed")}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              {canEdit && (
                <>
                  <button
                    className="people-secondary"
                    onClick={() => setModal("edit")}
                  >
                    <Settings2 size={15} />
                    Edit profile
                  </button>
                  <button
                    className="people-primary"
                    onClick={() => setModal("attendance")}
                  >
                    <Fingerprint size={15} />
                    Record attendance
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="people-profile-summary">
            <span>
              <BriefcaseBusiness size={16} />
              <b>{selected.employment_type}</b> employment
            </span>
            <span>
              <CalendarDays size={16} />
              Joined <b>{date(selected.start_date)}</b>
            </span>
            <span>
              <GraduationCap size={16} />
              <b>{selected.qualifications.length}</b> qualifications
            </span>
            <span className="people-presence">
              <i className={selected.last_direction === "IN" ? "is-in" : ""} />
              {selected.last_direction === "IN"
                ? "Clocked in"
                : "Clocked out"}{" "}
              {selected.last_seen && (
                <small>· {time(selected.last_seen)}</small>
              )}
            </span>
          </div>
          <div className="people-section-nav">
            {[
              "Overview",
              "Qualifications",
              "Attendance",
              ...(["super_admin", "hr"].includes(user.role) ||
              user.employee_id === selected.id
                ? ["Health"]
                : []),
              "Activity",
            ].map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t}
                {t === "Qualifications" && (
                  <span>{selected.qualifications.length}</span>
                )}
              </button>
            ))}
          </div>
          {tab === "Overview" && (
            <div className="people-overview-grid">
              <article className="people-panel">
                <div className="people-panel-title">
                  <Contact size={18} />
                  <h3>About this colleague</h3>
                </div>
                <p className="people-bio">
                  {selected.bio ||
                    "Add a short professional introduction when editing this profile."}
                </p>
                <Details
                  data={[
                    ["Work email", selected.email],
                    ["Phone", selected.phone],
                    ["Campus / location", selected.location],
                    ["Reporting manager", selected.manager],
                    ["Emergency contact", selected.emergency_name],
                    ["Emergency phone", selected.emergency_phone],
                  ]}
                />
              </article>
              <div>
                <article className="people-panel">
                  <div className="people-panel-title">
                    <BriefcaseBusiness size={18} />
                    <h3>Employment at a glance</h3>
                  </div>
                  <Details
                    data={[
                      ["School / office", selected.school],
                      ["Staff group", categoryLabel(selected.staff_category)],
                      ["Department", selected.department],
                      ["Curriculum", selected.curriculum],
                      ["Employment type", selected.employment_type],
                      [
                        "Contract end",
                        selected.contract_end
                          ? date(selected.contract_end)
                          : "Not recorded / open-ended",
                      ],
                      [
                        "TSC registration",
                        selected.tsc_number || "Not recorded / not applicable",
                      ],
                    ]}
                  />
                </article>
                <article className="people-profile-callout">
                  <ShieldCheck size={24} />
                  <div>
                    <h3>One person. One trusted record.</h3>
                    <p>
                      Profile reads and updates are recorded by the connected
                      server. Offline edits stay in this demo browser.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          )}
          {tab === "Qualifications" && (
            <article className="people-panel">
              <div className="people-panel-toolbar">
                <div>
                  <h3>Qualifications & professional readiness</h3>
                  <p>
                    Academic awards, registration and safeguarding credentials.
                  </p>
                </div>
                {canEdit && (
                  <button
                    className="people-primary"
                    onClick={() => setModal("qualification")}
                  >
                    <Plus size={15} />
                    Add qualification
                  </button>
                )}
              </div>
              <div className="people-qualification-grid">
                {selected.qualifications.map((q) => (
                  <article key={q.id} className="people-qualification">
                    <span className="people-cert-icon">
                      <GraduationCap size={24} />
                    </span>
                    <div>
                      <span className="people-eyebrow">{q.category}</span>
                      <h4>{q.title}</h4>
                      <p>{q.issuer}</p>
                      <small>
                        Awarded {date(q.awarded_on)} <span>·</span>{" "}
                        {q.expires_on
                          ? "Expires " + date(q.expires_on)
                          : "No expiry recorded"}
                      </small>
                    </div>
                    <span
                      className={
                        "people-badge " +
                        (q.expires_on && dayKey(q.expires_on) < today()
                          ? "warning"
                          : q.verified
                            ? "positive"
                            : "neutral")
                      }
                    >
                      {q.expires_on && dayKey(q.expires_on) < today()
                        ? "Expired"
                        : q.verified
                          ? "HR verified"
                          : "Not verified"}
                    </span>
                    {canEdit && (
                      <button
                        className="people-link"
                        aria-label={"Edit " + q.title}
                        onClick={() => setModal({ qualification: q })}
                      >
                        Edit
                      </button>
                    )}
                  </article>
                ))}
              </div>
              {!selected.qualifications.length && (
                <div className="people-empty">
                  <GraduationCap size={30} />
                  <h3>No qualifications recorded yet</h3>
                  <p>
                    Add the title, awarding institution and relevant validity
                    dates.
                  </p>
                </div>
              )}
              <p className="people-footnote">
                Verification is an HR-recorded assertion. It is not a live TSC
                lookup or an independently checked credential. Certificate file
                storage is not connected.
              </p>
            </article>
          )}
          {tab === "Attendance" && (
            <article className="people-panel">
              <div className="people-panel-toolbar">
                <div>
                  <h3>A clear record of the working day</h3>
                  <p>
                    Nairobi time · event-based records, not a payroll timesheet.
                  </p>
                </div>
                <div className="people-attendance-actions">
                  <input
                    type="date"
                    aria-label="Attendance date"
                    value={attendanceDay}
                    onChange={(e) => setAttendanceDay(e.target.value)}
                  />
                  <button
                    className="people-secondary"
                    onClick={exportAttendance}
                  >
                    <Download size={15} />
                    CSV
                  </button>
                </div>
              </div>
              <div className="people-attendance-stats">
                <div>
                  <span>First clock-in</span>
                  <b>
                    {time(
                      [...events].reverse().find((e) => e.direction === "IN")
                        ?.occurred_at,
                    )}
                  </b>
                </div>
                <div>
                  <span>Latest clock-out</span>
                  <b>
                    {time(
                      events.find((e) => e.direction === "OUT")?.occurred_at,
                    )}
                  </b>
                </div>
                <div>
                  <span>Recorded hours</span>
                  <b>
                    {hours(selected.attendance, attendanceDay)}
                    <small> hrs</small>
                  </b>
                </div>
                <div>
                  <span>Current state</span>
                  <b className="people-state">
                    {selected.last_direction === "IN"
                      ? "Clocked in"
                      : "Clocked out"}
                  </b>
                </div>
              </div>
              <div className="people-table-wrap">
                <table className="people-table">
                  <thead>
                    <tr>
                      {["Time (EAT)", "Event", "Source / device", "Reason"].map(
                        (h) => (
                          <th key={h}>{h}</th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <b>{time(e.occurred_at)}</b>
                          <small>{date(e.occurred_at)}</small>
                        </td>
                        <td>
                          <span
                            className={
                              "people-badge " +
                              (e.direction === "IN" ? "positive" : "neutral")
                            }
                          >
                            Clock {e.direction.toLowerCase()}
                          </span>
                        </td>
                        <td>
                          {e.source}
                          <small>
                            {e.device_name || "No device attribution"}
                          </small>
                        </td>
                        <td>{e.reason || "Authenticated device event"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!events.length && (
                <div className="people-empty">
                  <Clock3 size={28} />
                  <h3>No events on this date</h3>
                  <p>
                    Select another day or record a manual event with a reason.
                  </p>
                </div>
              )}
              <div className="people-device-notice">
                <Fingerprint size={18} />
                <p>
                  Fingerprint and door terminals connect through the
                  authenticated device-event API. CCTV requires a separate
                  vendor identity service. No fingerprint templates, faces or
                  video are collected by this section.
                </p>
              </div>
              <p className="people-footnote">
                Latest 300 events shown. Open clock-ins count up to now in this
                view; missing clock-outs need review. Breaks, shifts, lateness,
                overtime, payroll and attendance correction approvals are
                separate workflows.
              </p>
            </article>
          )}
          {tab === "Health" && (
            <HealthProfile
              employee={selected}
              user={user}
              api={api}
              offline={offline}
            />
          )}
          {tab === "Activity" && (
            <article className="people-panel">
              <div className="people-panel-title">
                <Activity size={18} />
                <h3>Profile activity</h3>
              </div>
              {selected.activity.map((a) => (
                <div className="people-activity-item" key={a.id}>
                  <span>
                    <CheckCheck size={15} />
                  </span>
                  <div>
                    <b>{a.action}</b>
                    <small>
                      {a.name || "Authenticated device"} · {date(a.created_at)}{" "}
                      · {time(a.created_at)}
                    </small>
                  </div>
                </div>
              ))}
              {!selected.activity.length && (
                <p className="people-empty">No recorded activity yet.</p>
              )}
            </article>
          )}
        </>
      )}
      {modal && (
        <div className="people-modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="people-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Employee management form"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="people-dialog-close"
              autoFocus
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
            {error && (
              <div className="people-alert" role="alert">
                {error}
              </div>
            )}
            {(modal === "add" || modal.add) && (
              <>
                <span className="people-eyebrow">A NEW CHAPTER</span>
                <h2>Welcome a colleague.</h2>
                <p>Place this employee in the right school or central team.</p>
                <AssignmentForm
                  schools={schools}
                  centralAllowed={canCentral}
                  initial={
                    modal.add || {
                      placement:
                        schoolFilter !== "all" ? schoolFilter : undefined,
                      category:
                        category !== "All staff groups" ? category : "Teaching",
                    }
                  }
                  busy={busy}
                  onSubmit={createEmployee}
                />
              </>
            )}
            {modal === "edit" && (
              <>
                <span className="people-eyebrow">EMPLOYEE PROFILE</span>
                <h2>Every detail matters.</h2>
                <p>
                  Archiving disables the linked account and removes device
                  enrollments on the connected server.
                </p>
                <PeopleForm
                  busy={busy}
                  label="Save changes"
                  initial={{
                    ...emptyProfile,
                    ...selected,
                    placement: placementValue(selected),
                    start_date: selected.start_date?.slice(0, 10),
                    contract_end: selected.contract_end?.slice(0, 10) || "",
                  }}
                  fields={[
                    ["name", "Full name"],
                    ["email", "Work email", "email"],
                    ["title", "Job title"],
                    ["department", "Department"],
                    [
                      "placement",
                      "School / office",
                      "select",
                      [
                        ...schools.map((s) => [String(s.id), s.name]),
                        ...(canCentral
                          ? [["head-office", "Head Office & Group Leadership"]]
                          : []),
                      ],
                    ],
                    [
                      "staff_category",
                      "Staff group",
                      "select",
                      staffCategories.map((c) => [c, categoryLabel(c)]),
                    ],
                    ["curriculum", "Curriculum"],
                    [
                      "status",
                      "Employment status",
                      "select",
                      ["Active", "Probation", "On leave", "Archived"].map(
                        (v) => [v, v],
                      ),
                    ],
                    [
                      "employment_type",
                      "Employment type",
                      "select",
                      ["Permanent", "Fixed-term", "Casual", "Consultant"].map(
                        (v) => [v, v],
                      ),
                    ],
                    ["start_date", "Employment start", "date"],
                    ["contract_end", "Contract end (optional)", "date?"],
                    ["phone", "Phone (optional)", "text?"],
                    ["location", "Campus / location (optional)", "text?"],
                    ["manager", "Reporting manager (optional)", "text?"],
                    ["tsc_number", "TSC registration (optional)", "text?"],
                    ["emergency_name", "Emergency contact (optional)", "text?"],
                    ["emergency_phone", "Emergency phone (optional)", "text?"],
                    [
                      "bio",
                      "Professional introduction (optional)",
                      "textarea?",
                    ],
                  ]}
                  onSubmit={(d) =>
                    mutate(
                      () =>
                        api("/employees/" + selected.id, {
                          method: "PATCH",
                          body: JSON.stringify({
                            ...Object.fromEntries(
                              Object.entries(d).filter(
                                ([key]) => key !== "placement",
                              ),
                            ),
                            school_id:
                              d.placement === "head-office"
                                ? null
                                : Number(d.placement),
                            org_scope:
                              d.placement === "head-office"
                                ? "Head office"
                                : "School",
                            contract_end: d.contract_end || null,
                          }),
                        }),
                      "Profile updated",
                    )
                  }
                />
              </>
            )}
            {(modal === "qualification" || modal.qualification) && (
              <>
                <span className="people-eyebrow">PROFESSIONAL READINESS</span>
                <h2>Record a qualification.</h2>
                <PeopleForm
                  busy={busy}
                  label="Save qualification"
                  initial={
                    modal.qualification
                      ? {
                          ...modal.qualification,
                          awarded_on: modal.qualification.awarded_on?.slice(
                            0,
                            10,
                          ),
                          expires_on:
                            modal.qualification.expires_on?.slice(0, 10) || "",
                          verified: String(modal.qualification.verified),
                        }
                      : {}
                  }
                  fields={[
                    ["title", "Qualification title"],
                    ["issuer", "Awarding institution"],
                    [
                      "category",
                      "Category",
                      "select",
                      [
                        "Academic",
                        "Professional",
                        "TSC",
                        "Safeguarding",
                        "Other",
                      ].map((v) => [v, v]),
                    ],
                    ["awarded_on", "Award date", "date"],
                    ["expires_on", "Expiry date (optional)", "date?"],
                    [
                      "verified",
                      "HR verification",
                      "select",
                      [
                        ["false", "Not yet verified"],
                        ["true", "Verified by HR"],
                      ],
                    ],
                  ]}
                  onSubmit={(d) =>
                    mutate(
                      () =>
                        api(
                          "/employees/" +
                            selected.id +
                            "/qualifications" +
                            (modal.qualification
                              ? "/" + modal.qualification.id
                              : ""),
                          {
                            method: modal.qualification ? "PATCH" : "POST",
                            body: JSON.stringify({
                              ...d,
                              verified: d.verified === "true",
                              expires_on: d.expires_on || null,
                            }),
                          },
                        ),
                      "Qualification recorded",
                    )
                  }
                />
              </>
            )}
            {modal === "attendance" && (
              <>
                <span className="people-eyebrow">MANUAL ATTENDANCE RECORD</span>
                <h2>Record time, responsibly.</h2>
                <p>
                  This is an HR-entered event with a required reason—not a
                  fingerprint or CCTV scan. All times use Nairobi (UTC+3).
                </p>
                <PeopleForm
                  busy={busy}
                  label="Save attendance event"
                  initial={{
                    occurred_at: new Intl.DateTimeFormat("sv-SE", {
                      timeZone: tz,
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    })
                      .format(new Date())
                      .replace(" ", "T"),
                  }}
                  fields={[
                    [
                      "direction",
                      "Event",
                      "select",
                      [
                        ["IN", "Clock in"],
                        ["OUT", "Clock out"],
                      ],
                    ],
                    ["occurred_at", "Event time (Nairobi)", "datetime-local"],
                    ["reason", "Reason for manual entry", "textarea"],
                  ]}
                  onSubmit={(d) =>
                    mutate(
                      () =>
                        api("/employees/" + selected.id + "/attendance", {
                          method: "POST",
                          body: JSON.stringify({
                            ...d,
                            occurred_at: new Date(
                              d.occurred_at + "+03:00",
                            ).toISOString(),
                            event_id: eventId(),
                          }),
                        }),
                      "Attendance event saved",
                    )
                  }
                />
              </>
            )}
            {modal === "device" && (
              <>
                <span className="people-eyebrow">ATTENDANCE CONNECTION</span>
                <h2>Register a device.</h2>
                <p>
                  Registration issues credentials for your vendor adapter. It
                  does not connect or discover hardware.
                </p>
                <PeopleForm
                  busy={busy}
                  label="Register device"
                  fields={[
                    ["name", "Device name"],
                    [
                      "school_id",
                      "School section",
                      "select",
                      schools.map((s) => [s.id, s.name]),
                    ],
                    [
                      "kind",
                      "Device category",
                      "select",
                      [
                        "Fingerprint terminal",
                        "Door access",
                        "CCTV vendor identity",
                      ].map((v) => [v, v]),
                    ],
                  ]}
                  onSubmit={async (d) => {
                    const r = await mutate(
                      () =>
                        api("/devices", {
                          method: "POST",
                          body: JSON.stringify(d),
                        }),
                      "Device registered",
                    );
                    if (r) setToken(r.token);
                  }}
                />
              </>
            )}
            {modal.enroll && (
              <>
                <span className="people-eyebrow">{modal.enroll.name}</span>
                <h2>Map an employee.</h2>
                <p>
                  Use the vendor’s pseudonymous employee reference. Do not enter
                  fingerprint templates, face data or video.
                </p>
                <PeopleForm
                  busy={busy}
                  label="Save enrollment"
                  fields={[
                    [
                      "employee_id",
                      "Employee",
                      "select",
                      list
                        .filter(
                          (e) =>
                            e.school_id === Number(modal.enroll.school_id) &&
                            e.status !== "Archived",
                        )
                        .map((e) => [e.id, e.name]),
                    ],
                    ["external_ref", "Vendor employee reference"],
                  ]}
                  onSubmit={(d) =>
                    mutate(
                      () =>
                        api("/devices/" + modal.enroll.id + "/enrollments", {
                          method: "POST",
                          body: JSON.stringify(d),
                        }),
                      "Enrollment recorded",
                    )
                  }
                />
              </>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
function BuildingIcon(props) {
  return <BriefcaseBusiness {...props} />;
}
function Details({ data }) {
  return (
    <dl className="people-details">
      {data.map(([label, value]) => (
        <React.Fragment key={label}>
          <dt>{label}</dt>
          <dd>{value || "Not recorded"}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
function PeopleForm({ fields, initial = {}, onSubmit, label, busy }) {
  return (
    <form
      className="people-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(Object.fromEntries(new FormData(e.currentTarget)));
      }}
    >
      <div>
        {fields.map(([name, title, type = "text", options]) => {
          const optional = type.endsWith("?");
          type = type.replace("?", "");
          return (
            <label
              className={"people-field " + (type === "textarea" ? "wide" : "")}
              key={name}
            >
              {title}
              {type === "select" ? (
                <select
                  aria-label={title}
                  name={name}
                  required
                  defaultValue={initial[name] ?? options[0]?.[0]}
                >
                  {options.map(([value, text]) => (
                    <option key={value} value={value}>
                      {text}
                    </option>
                  ))}
                </select>
              ) : type === "textarea" ? (
                <textarea
                  name={name}
                  required={!optional}
                  defaultValue={initial[name] || ""}
                  minLength={optional ? undefined : 5}
                  maxLength={1000}
                  rows={3}
                />
              ) : (
                <input
                  name={name}
                  required={!optional}
                  defaultValue={initial[name] || ""}
                  type={type}
                  maxLength={name === "name" ? 100 : 150}
                  step={type === "datetime-local" ? "1" : undefined}
                />
              )}
            </label>
          );
        })}
      </div>
      <button className="people-primary people-submit" disabled={busy}>
        {busy ? "Saving…" : label}
        <ArrowUpRight size={16} />
      </button>
    </form>
  );
}
export function EmployeePreview() {
  return (
    <div className="hr-demo-shell">
      <header className="hr-demo-header">
        <a href="#" className="hr-demo-brand">
          <BrandMark />
          <span>
            <b>KISC PeopleHub</b>
            <small>KITENGELA INTERNATIONAL SCHOOLS · PEOPLE & CULTURE</small>
          </span>
        </a>
        <ThemeToggle />
      </header>
      <main>
        <Employees
          offline
          user={{ id: 1, name: "Demo HR administrator", role: "super_admin" }}
          schools={demoSchools}
          api={demoPeopleApi}
        />
      </main>
      <footer>
        Independent KISC concept · Fictional data only · No real device
        connection · White, green & black HR workspace
      </footer>
    </div>
  );
}
