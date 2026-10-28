import StaffHub from "./StaffHub.jsx";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BriefcaseBusiness,
  Wallet,
  GraduationCap,
  ChartNoAxesCombined,
  Settings,
  ShieldCheck,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Plus,
  Menu,
  LogOut,
  Check,
  X,
  Download,
  Building2,
  FileText,
  HeartHandshake,
  ArrowRight,
  Globe2,
  CheckCheck,
  Sun,
} from "lucide-react";
import "./style.css";
import Website from "./Website.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import Employees, { EmployeePreview } from "./Employees.jsx";
async function api(path, options = {}) {
  const r = await fetch("/api" + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-PeopleHub-Request": "1",
      ...options.headers,
    },
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "Request failed");
  return data;
}
const nav = [
  ["Overview", LayoutDashboard, "home"],
  ["People", Users, "employees"],
  ["Recruitment", BriefcaseBusiness, "Recruitment"],
  ["Leave & attendance", CalendarDays, "leave"],
  ["Payroll & benefits", Wallet, "payroll"],
  ["Performance & growth", GraduationCap, "Performance"],
  ["Documents & contracts", FileText, "Contracts"],
  ["Employee relations", HeartHandshake, "Welfare"],
  ["Reports & insights", ChartNoAxesCombined, "reports"],
  ["Reports & meetings", FileText, "hub"],
];
const operational = [
  "Recruitment",
  "Onboarding",
  "Attendance",
  "Shifts",
  "Teacher cover",
  "Contracts",
  "Training",
  "Qualifications",
  "Performance",
  "Probation",
  "Promotions",
  "Transfers",
  "Benefits",
  "Welfare",
  "Grievances",
  "Disciplinary",
  "Assets",
  "Offboarding",
  "Helpdesk",
  "Announcements",
  "Documents",
];
const initials = (n) =>
  n
    ?.split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
const date = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
function App() {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [page, setPage] = useState("home"),
    [school, setSchool] = useState("all"),
    [schools, setSchools] = useState([]),
    [employees, setEmployees] = useState([]),
    [leave, setLeave] = useState([]),
    [records, setRecords] = useState([]),
    [reports, setReports] = useState([]),
    [audit, setAudit] = useState([]),
    [accounts, setAccounts] = useState([]),
    [query, setQuery] = useState(""),
    [modal, setModal] = useState(null),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [collapsed, setCollapsed] = useState(window.innerWidth < 900),
    [busy, setBusy] = useState(false);
  async function load(u = user) {
    if (!u) return;
    const jobs = [["/schools", setSchools]];
    if (u.permissions.includes("employees") || u.role === "employee")
      jobs.push(["/employees", setEmployees]);
    if (u.permissions.includes("leave")) jobs.push(["/leave", setLeave]);
    if (u.permissions.includes("records")) jobs.push(["/records", setRecords]);
    if (u.permissions.includes("reports")) jobs.push(["/reports", setReports]);
    if (u.permissions.includes("audit")) jobs.push(["/audit", setAudit]);
    if (u.permissions.includes("settings")) jobs.push(["/users", setAccounts]);
    await Promise.all(jobs.map(async ([url, set]) => set(await api(url))));
  }
  useEffect(() => {
    api("/me")
      .then(async (u) => {
        setUser(u);
        await load(u);
      })
      .catch(() => {})
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
    const handle = (e) => {
      if (e.key === "Escape") setModal(null);
      if (e.key === "Tab") {
        const nodes = [
          ...document.querySelectorAll(
            "[role=dialog] button,[role=dialog] input,[role=dialog] select,[role=dialog] textarea",
          ),
        ].filter((n) => !n.disabled);
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [modal]);
  function go(p) {
    setPage(p);
    setQuery("");
    setError("");
  }
  const allowed = (p) =>
    p === "home" ||
    (p === "hub" && user.role !== "enko") ||
    p === "schools" ||
    (p === "employees" &&
      (user.permissions.includes("employees") || user.role === "employee")) ||
    (p === "leave" && user.permissions.includes("leave")) ||
    (p === "reports" && user.permissions.includes("reports")) ||
    (p === "settings" && user.permissions.includes("settings")) ||
    (p === "audit" && user.permissions.includes("audit")) ||
    (p === "payroll" && ["super_admin", "hr", "finance"].includes(user.role)) ||
    (operational.includes(p) &&
      user.permissions.includes("records") &&
      (user.role !== "employee" || p === "Helpdesk") &&
      (user.role !== "recruiter" || p === "Recruitment") &&
      (user.role !== "finance" || p === "Benefits") &&
      (!["Welfare", "Grievances", "Disciplinary"].includes(p) ||
        ["super_admin", "hr"].includes(user.role)));
  const filter = (items) =>
    items.filter(
      (x) =>
        (school === "all" || String(x.school_id) === school) &&
        JSON.stringify(x).toLowerCase().includes(query.toLowerCase()),
    );
  const people = filter(employees),
    requests = filter(leave),
    items = filter(records).filter((x) => x.module === page);
  const visibleSchools = schools.filter(
    (s) => school === "all" || String(s.id) === school,
  );
  const pending = filter(leave).filter((l) => l.status === "Pending");
  async function act(fn, message) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
      setNotice(message);
      setModal(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function exportRows(rows, name) {
    if (!rows.length) return setNotice("There are no records to export.");
    const cols = Object.keys(rows[0]);
    const escape = (v) => '"' + String(v ?? "").replaceAll('"', '""') + '"';
    const content = [
      cols.join(","),
      ...rows.map((r) =>
        cols
          .map((c) => escape(/^[=+@-]/.test(String(r[c])) ? "'" + r[c] : r[c]))
          .join(","),
      ),
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    a.download = name + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
    setNotice(
      "CSV exported. Sensitive exports need production audit hardening.",
    );
  }
  if (loading) return <div className="loading">Preparing your workspace…</div>;
  if (!user)
    return (
      <Login
        onLogin={async () => {
          try {
            const u = await api("/me");
            setUser(u);
            await load(u);
          } catch (e) {
            setError(e.message);
          }
        }}
      />
    );
  const title =
    page === "home"
      ? "People overview"
      : page === "employees"
        ? "Our people"
        : page === "leave"
          ? "Leave & attendance"
          : page === "hub"
            ? "Reports & meetings"
            : page === "reports"
              ? "Reports & insights"
              : page === "schools"
                ? "Our seven schools"
                : page === "settings"
                  ? "Control centre"
                  : page === "audit"
                    ? "Audit trail"
                    : page === "payroll"
                      ? "Payroll & benefits"
                      : page;
  return (
    <div className={"app " + (collapsed ? "collapsed" : "")}>
      <aside>
        <button
          className="sidebar-close icon-button"
          aria-label="Close navigation"
          onClick={() => setCollapsed(true)}
        >
          <X size={18} />
        </button>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          <span className="crest">
            K<span>✦</span>
          </span>
          <span>
            <strong>
              KISC <em>PeopleHub</em>
            </strong>
            <small>ONE CONNECTED WORKFORCE</small>
          </span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">
            <Building2 size={19} />
          </span>
          <div>
            <b>KISC Head Office</b>
            <small>{user.role.replaceAll("_", " ")} workspace</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav>
          {nav
            .filter((x) => allowed(x[2]))
            .map(([label, Icon, p]) => (
              <button
                key={p}
                aria-label={label}
                title={label}
                className={page === p ? "selected" : ""}
                onClick={() => go(p)}
              >
                <Icon size={19} />
                <span>{label}</span>
                {p === "leave" && pending.length > 0 && <i>{pending.length}</i>}
              </button>
            ))}
        </nav>
        <p className="nav-caption">ORGANIZATION</p>
        <nav>
          <button
            aria-label="Schools & campuses"
            title="Schools & campuses"
            className={page === "schools" ? "selected" : ""}
            onClick={() => go("schools")}
          >
            <Building2 size={19} />
            <span>Schools & campuses</span>
          </button>
          {allowed("settings") && (
            <button
              aria-label="Administration"
              title="Administration"
              className={page === "settings" ? "selected" : ""}
              onClick={() => go("settings")}
            >
              <Settings size={19} />
              <span>Administration</span>
            </button>
          )}
          {allowed("audit") && (
            <button
              aria-label="Audit trail"
              title="Audit trail"
              onClick={() => go("audit")}
              className={page === "audit" ? "selected" : ""}
            >
              <ShieldCheck size={19} />
              <span>Audit trail</span>
            </button>
          )}
        </nav>
        <div className="side-bottom">
          <div className="help-card">
            <span>Here for your people.</span>
            <p>
              One team. Seven schools.
              <br />
              Endless possibilities.
            </p>
            <button onClick={() => go("Helpdesk")}>
              Contact HR <ArrowUpRight size={15} />
            </button>
          </div>
          <button
            aria-label="Sign out securely"
            title="Sign out securely"
            className="side-user"
            onClick={() =>
              act(async () => {
                await api("/logout", { method: "POST" });
                setUser(null);
              }, "Signed out")
            }
          >
            <span className="avatar maroon">{initials(user.name)}</span>
            <span>
              <b>{user.name}</b>
              <small>Sign out securely</small>
            </span>
            <LogOut size={17} />
          </button>
          <div className="enko">
            Part of the <b>enko</b> education network
          </div>
        </div>
      </aside>
      <div className="main">
        <header>
          <div className="breadcrumbs">
            <button
              aria-label="Toggle sidebar"
              className="icon-button"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu size={19} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <b>{title}</b>
          </div>
          <div className="top-actions">
            <ThemeToggle />
            <span className="today">
              {new Date().toLocaleDateString("en-KE", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <button
              className="icon-button notification"
              aria-label="View notifications"
              onClick={() => setModal("notifications")}
            >
              <Bell size={20} />
              <i />
            </button>
            <span className="divider" />
            <span className="avatar maroon">{initials(user.name)}</span>
          </div>
        </header>
        <main>
          <div className="demo-banner">
            <ShieldCheck size={14} /> Development workspace · Fictional data
            only · Not approved for live HR or payroll
          </div>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                KISC PEOPLEHUB <span>/</span>{" "}
                {page === "home" ? "DASHBOARD" : "WORKSPACE"}
              </div>
              <h1>
                {page === "home"
                  ? `Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${user.name.split(" ")[0]}`
                  : title}
                {page === "home" && <Sun className="sun" size={26} />}
              </h1>
              <p>
                {page === "home"
                  ? "A little clarity for your day. Here’s what’s happening across your schools."
                  : "Connected people. Clear processes. A better working day."}
              </p>
            </div>
            <div className="heading-actions">
              <label className="school-select">
                <Building2 size={16} />
                <select
                  aria-label="Filter school"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                >
                  <option value="all">All KISC schools</option>
                  {schools.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              {page === "home" && allowed("reports") && (
                <button className="outline" onClick={() => go("reports")}>
                  <ChartNoAxesCombined size={16} /> View reports
                </button>
              )}
            </div>
          </div>
          {error && (
            <div role="alert" className="error">
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          )}
          {page === "home" && (
            <>
              <section className="welcome">
                <div>
                  <span className="pill">
                    <span /> YOUR PEOPLE, CONNECTED
                  </span>
                  <h2>
                    Seven schools.
                    <br />
                    <span>One extraordinary team.</span>
                  </h2>
                  <p>
                    Supporting the people who make a difference,
                    <br />
                    every single day.
                  </p>
                  <button
                    onClick={() =>
                      go(allowed("employees") ? "employees" : "schools")
                    }
                  >
                    Explore your workforce <ArrowRight size={17} />
                  </button>
                </div>
                <div className="welcome-art">
                  <div className="orbit o1" />
                  <div className="orbit o2" />
                  <div className="orbit o3" />
                  <span className="art-center">
                    <Building2 size={44} />
                    <b>KISC</b>
                    <small>PeopleHub</small>
                  </span>
                  <span className="art-tag t1">
                    <span className="dot green" /> 7 school sections
                  </span>
                  <span className="art-tag t2">
                    <Globe2 size={16} /> One connected community
                  </span>
                  <span className="art-avatar a1">AW</span>
                  <span className="art-avatar a2">DO</span>
                  <span className="art-avatar a3">GM</span>
                  <span className="art-spark">✦</span>
                </div>
              </section>
              <section className="stats">
                {[
                  [
                    Users,
                    "Total employees",
                    people.length ||
                      reports
                        .filter(
                          (r) =>
                            school === "all" ||
                            schools.find((s) => s.name === r.name)?.id ===
                              Number(school),
                        )
                        .reduce((a, r) => a + r.employees, 0),
                    "Across your authorized schools",
                    "maroon",
                  ],
                  [
                    Building2,
                    "School sections",
                    visibleSchools.length,
                    "Connected across 3 campuses",
                    "gold",
                  ],
                  [
                    CalendarDays,
                    "Pending leave",
                    pending.length,
                    "Requests awaiting a decision",
                    "green",
                  ],
                  [
                    BriefcaseBusiness,
                    "Open HR tasks",
                    filter(records).filter((r) => r.status === "Open").length,
                    "Keep your people moving forward",
                    "blue",
                  ],
                ].map(([Icon, label, value, sub, color]) => (
                  <article className="stat" key={label}>
                    <div>
                      <span>{label}</span>
                      <span className={"stat-icon " + color}>
                        <Icon size={19} />
                      </span>
                    </div>
                    <strong>{value}</strong>
                    <small>{sub}</small>
                  </article>
                ))}
              </section>
              <section className="dashboard-grid">
                <article className="card workforce">
                  <CardHead
                    title="Workforce across schools"
                    subtitle="A connected view of your KISC community"
                    action="Explore schools"
                    onAction={() => go("schools")}
                  />
                  <div className="chart-legend">
                    <span className="dot maroon" /> Employees{" "}
                    <small>Fictional demonstration headcount</small>
                  </div>
                  <div className="bar-chart">
                    {visibleSchools.map((s, i) => (
                      <div className="bar-col" key={s.id}>
                        <b>{s.headcount}</b>
                        <div
                          className={"bar " + (i === 0 ? "highlight" : "")}
                          style={{ height: Math.max(12, s.headcount * 32) }}
                        />
                        <span>
                          {s.name
                            .replace(" School", "")
                            .replace(" Kitengela", "")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="card-foot">
                    <span className="dot green" /> One master record for every
                    employee <span>7 sections · 3 campuses</span>
                  </div>
                </article>
                <article className="card attention">
                  <CardHead
                    title="Needs your attention"
                    subtitle="The important things, all in one place"
                  />
                  <div className="attention-list">
                    {[
                      [
                        CalendarDays,
                        "Leave requests",
                        `${pending.length} requests waiting for review`,
                        "leave",
                        "gold",
                      ],
                      [
                        FileText,
                        "Contracts & renewals",
                        "Review upcoming renewal tasks",
                        "Contracts",
                        "maroon",
                      ],
                      [
                        ShieldCheck,
                        "Qualifications & training",
                        "Keep credentials up to date",
                        "Qualifications",
                        "green",
                      ],
                    ]
                      .filter((x) => allowed(x[3]))
                      .map(([Icon, t, s, p, c]) => (
                        <button key={t} onClick={() => go(p)}>
                          <span className={"task-icon " + c}>
                            <Icon size={20} />
                          </span>
                          <span>
                            <b>{t}</b>
                            <small>{s}</small>
                          </span>
                          <ChevronRight size={17} />
                        </button>
                      ))}
                  </div>
                  <div className="gentle-note">
                    <CheckCheck size={17} />
                    <span>A clear overview. A calmer working day.</span>
                  </div>
                </article>
              </section>
              <section className="dashboard-grid lower">
                <article className="card">
                  <CardHead
                    title="People, at a glance"
                    subtitle="The faces behind our shared purpose"
                    action={allowed("employees") ? "View directory" : null}
                    onAction={() => go("employees")}
                  />
                  <Table
                    heads={["Employee", "School", "Status"]}
                    rows={people
                      .slice(0, 4)
                      .map((e) => [
                        <Person employee={e} />,
                        e.school,
                        <Badge>Active</Badge>,
                      ])}
                  />
                  {!people.length && (
                    <Empty text="Your role has no access to the employee directory." />
                  )}
                </article>
                <article className="card">
                  <CardHead
                    title="Your HR toolkit"
                    subtitle="Everyday actions. One click away."
                  />
                  <div className="quick-grid">
                    {[
                      [Plus, "Add employee", "employee", "employees"],
                      [CalendarDays, "Request leave", "leave", "leave"],
                      [
                        BriefcaseBusiness,
                        "Recruit a colleague",
                        "record",
                        "Recruitment",
                      ],
                      [ChartNoAxesCombined, "Run a report", null, "reports"],
                    ]
                      .filter(
                        (x) =>
                          allowed(x[3]) &&
                          (x[2] !== "employee" ||
                            ["super_admin", "hr", "school_admin"].includes(
                              user.role,
                            )),
                      )
                      .map(([Icon, label, m, p]) => (
                        <button
                          key={label}
                          onClick={() => {
                            if (m) {
                              go(p);
                              setModal(m);
                            } else go(p);
                          }}
                        >
                          <Icon size={20} />
                          <span>{label}</span>
                          <ArrowUpRight size={14} />
                        </button>
                      ))}
                  </div>
                  <div className="announcement">
                    <span>THE PEOPLEHUB PROMISE</span>
                    <p>
                      Less paperwork.
                      <br />
                      <b>More time for your people.</b>
                    </p>
                  </div>
                </article>
              </section>
            </>
          )}
          {page === "hub" && (
            <StaffHub api={api} user={user} schools={schools} />
          )}
          {page === "employees" && (
            <Employees
              user={user}
              schools={schools}
              api={api}
              school={school}
              onChanged={() => load().catch((e) => setError(e.message))}
            />
          )}
          {page === "leave" && (
            <article className="card">
              <div className="toolbar">
                <SearchBox value={query} onChange={setQuery} />
                <span>{requests.length} requests</span>
                <button className="primary" onClick={() => setModal("leave")}>
                  <Plus size={16} /> Request leave
                </button>
              </div>
              <div className="inline-note">
                Weekday duration only. Holiday calendars, accruals, balances and
                multi-level policy approval are scheduled for Phase 2.
              </div>
              <Table
                heads={[
                  "Employee",
                  "Leave type",
                  "Dates",
                  "Days",
                  "Status",
                  "Decision",
                ]}
                rows={requests.map((l) => [
                  <div>
                    <b>{l.name}</b>
                    <small className="block muted">{l.school}</small>
                  </div>,
                  l.type,
                  `${date(l.start_date)} – ${date(l.end_date)}`,
                  l.days,
                  <Badge>{l.status}</Badge>,
                  l.status === "Pending" &&
                  [
                    "super_admin",
                    "hr",
                    "school_admin",
                    "principal",
                    "manager",
                  ].includes(user.role) ? (
                    <div className="decision">
                      <button
                        disabled={busy}
                        onClick={() =>
                          act(
                            () =>
                              api("/leave/" + l.id, {
                                method: "PATCH",
                                body: JSON.stringify({ status: "Approved" }),
                              }),
                            "Leave approved",
                          )
                        }
                      >
                        <Check size={15} />
                        Approve
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          act(
                            () =>
                              api("/leave/" + l.id, {
                                method: "PATCH",
                                body: JSON.stringify({ status: "Rejected" }),
                              }),
                            "Leave rejected",
                          )
                        }
                      >
                        <X size={15} />
                        Reject
                      </button>
                    </div>
                  ) : (
                    "—"
                  ),
                ])}
              />
              {!requests.length && <Empty />}
              <div className="module-links">
                {["Attendance", "Shifts", "Teacher cover"].map((m) => (
                  <button className="outline" onClick={() => go(m)} key={m}>
                    {m}
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            </article>
          )}
          {operational.includes(page) && (
            <>
              <div className="module-links">
                {operational.filter(allowed).map((m) => (
                  <button
                    key={m}
                    className={"chip " + (page === m ? "active" : "")}
                    onClick={() => go(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <article className="card">
                <div className="toolbar">
                  <SearchBox value={query} onChange={setQuery} />
                  <button
                    className="primary"
                    onClick={() => setModal("record")}
                  >
                    <Plus size={16} /> New {page.toLowerCase()} record
                  </button>
                </div>
                <div className="inline-note">
                  Phase 1 record register: create and review tracked tasks.
                  Specialized workflows and integrations are listed in the
                  roadmap.
                </div>
                <Table
                  heads={["Record", "School", "Due date", "Status", "Details"]}
                  rows={items.map((r) => [
                    r.title,
                    r.school,
                    date(r.due_date),
                    <Badge>{r.status}</Badge>,
                    <button
                      className="text-button"
                      onClick={() => setModal({ record: r })}
                    >
                      View details <ArrowUpRight size={13} />
                    </button>,
                  ])}
                />
                {!items.length && (
                  <Empty
                    text={`No ${page.toLowerCase()} records yet. Create your first record to get started.`}
                  />
                )}
              </article>
            </>
          )}
          {page === "schools" && (
            <div className="school-grid">
              {schools.map((s, i) => (
                <article key={s.id} className="card school-card">
                  <span
                    className={
                      "task-icon " + ["maroon", "gold", "green"][i % 3]
                    }
                  >
                    <Building2 />
                  </span>
                  <h2>{s.name}</h2>
                  <p>{s.campus} campus</p>
                  <span className="chip">{s.curriculum}</span>
                  <hr />
                  <div>
                    <b>{s.headcount} employees</b>
                    <button
                      className="text-button"
                      onClick={() => {
                        setSchool(String(s.id));
                        go(allowed("employees") ? "employees" : "reports");
                      }}
                    >
                      Explore <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {page === "reports" && (
            <article className="card">
              <CardHead
                title="Workforce distribution"
                subtitle="Scoped by your role and school permissions"
                action="Export CSV"
                onAction={() =>
                  exportRows(
                    reports.filter(
                      (r) =>
                        school === "all" ||
                        schools.find((s) => s.name === r.name)?.id ===
                          Number(school),
                    ),
                    "kisc-workforce",
                  )
                }
              />
              <Table
                heads={[
                  "School section",
                  "Campus",
                  "Employees",
                  "Academic staff",
                ]}
                rows={reports
                  .filter(
                    (r) =>
                      school === "all" ||
                      schools.find((s) => s.name === r.name)?.id ===
                        Number(school),
                  )
                  .map((r) => [r.name, r.campus, r.employees, r.teachers])}
              />
            </article>
          )}
          {page === "audit" && (
            <article className="card">
              <CardHead
                title="Activity log"
                subtitle="Persisted server-side records of sign-ins, creation and leave decisions"
              />
              <Table
                heads={["Time", "User", "Action", "Entity"]}
                rows={audit.map((a) => [
                  new Date(a.created_at).toLocaleString(),
                  a.name,
                  a.action,
                  a.entity,
                ])}
              />
            </article>
          )}
          {page === "settings" && (
            <>
              <div className="settings-info card">
                <ShieldCheck size={28} />
                <div>
                  <h2>Super Admin Control Centre</h2>
                  <p>
                    Current capability: account visibility and fixed server-side
                    role permissions. Custom roles, account provisioning, policy
                    editing, MFA and infrastructure controls are planned—not
                    active.
                  </p>
                </div>
              </div>
              <article className="card">
                <CardHead
                  title="User accounts"
                  subtitle="Development accounts · invitation-based provisioning planned"
                />
                <Table
                  heads={["Name", "Email", "Role", "School scope", "Status"]}
                  rows={accounts.map((a) => [
                    a.name,
                    a.email,
                    a.role.replaceAll("_", " "),
                    schools.find((s) => s.id === a.school_id)?.name ||
                      "KISC-wide / role restricted",
                    <Badge>{a.active ? "Active" : "Disabled"}</Badge>,
                  ])}
                />
              </article>
              <div className="module-links">
                {[
                  "Organization setup",
                  "Granular permissions",
                  "Approval workflows",
                  "Notification templates",
                  "Integrations",
                  "Backups & retention",
                ].map((t) => (
                  <span className="chip" key={t}>
                    {t} · Planned
                  </span>
                ))}
              </div>
            </>
          )}
          {page === "payroll" && (
            <article className="card payroll-notice">
              <span className="task-icon gold">
                <Wallet size={28} />
              </span>
              <h2>Payroll needs a verified foundation.</h2>
              <p>
                Payroll processing is not enabled. No salary, tax, payslip or
                payment calculations are performed in this release.
              </p>
              <div className="payroll-rules">
                {[
                  "Versioned PAYE bands",
                  "NSSF contribution rules",
                  "SHIF configuration",
                  "Affordable Housing Levy",
                  "Independent approvals",
                  "Payslips & reconciliation",
                ].map((s) => (
                  <span className="chip" key={s}>
                    {s} · Planned
                  </span>
                ))}
              </div>
              <p>
                Production release requires finance-approved effective-dated
                statutory rules, calculation tests, payment integration and
                security review.
              </p>
              <button className="outline" onClick={() => go("Benefits")}>
                Open benefits register <ArrowRight size={16} />
              </button>
            </article>
          )}
          <footer>
            <span>
              © {new Date().getFullYear()} KISC PeopleHub <span>·</span> Built
              around your people.
            </span>
            <span>
              <span className="dot green" /> Development release 0.1{" "}
              <span>·</span> Staff-only platform
            </span>
          </footer>
        </main>
      </div>
      {notice && (
        <div role="status" className="toast">
          <CheckCheck size={18} />
          {notice}
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="PeopleHub form"
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="modal-close icon-button"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X />
            </button>
            {error && (
              <div role="alert" className="error">
                {error}
              </div>
            )}
            {modal === "employee" && (
              <>
                <h2>Welcome someone new</h2>
                <p className="muted">Create one master employee record.</p>
                <Form
                  busy={busy}
                  fields={[
                    ["name", "Full name"],
                    ["email", "Work email", "email"],
                    ["title", "Job title"],
                    ["department", "Department"],
                    [
                      "school_id",
                      "School",
                      "select",
                      schools.map((s) => [s.id, s.name]),
                    ],
                    [
                      "curriculum",
                      "Curriculum",
                      "select",
                      [
                        ["CBE", "CBE"],
                        ["Cambridge / Pearson", "Cambridge / Pearson"],
                        ["Other", "Other"],
                      ],
                    ],
                  ]}
                  onSubmit={(d) =>
                    act(
                      () =>
                        api("/employees", {
                          method: "POST",
                          body: JSON.stringify(d),
                        }),
                      "Employee added",
                    )
                  }
                  label="Create employee"
                />
              </>
            )}
            {modal === "leave" && (
              <>
                <h2>Request time away</h2>
                <p className="muted">Your request will be sent for review.</p>
                <Form
                  busy={busy}
                  fields={[
                    [
                      "employee_id",
                      "Employee",
                      "select",
                      user.role === "employee"
                        ? [[user.employee_id, user.name]]
                        : employees.map((e) => [e.id, e.name]),
                    ],
                    [
                      "type",
                      "Leave type",
                      "select",
                      [
                        "Annual leave",
                        "Sick leave",
                        "Study leave",
                        "Maternity leave",
                        "Paternity leave",
                        "Unpaid leave",
                      ].map((s) => [s, s]),
                    ],
                    ["start_date", "Start date", "date"],
                    ["end_date", "End date", "date"],
                    ["reason", "Reason", "textarea"],
                  ]}
                  onSubmit={(d) =>
                    act(
                      () =>
                        api("/leave", {
                          method: "POST",
                          body: JSON.stringify(d),
                        }),
                      "Leave request submitted",
                    )
                  }
                  label="Submit request"
                />
              </>
            )}
            {modal === "record" && (
              <>
                <h2>New {page.toLowerCase()} record</h2>
                <Form
                  busy={busy}
                  fields={[
                    ["title", "Title"],
                    [
                      "school_id",
                      "School",
                      "select",
                      schools.map((s) => [s.id, s.name]),
                    ],
                    ["due_date", "Due date", "date"],
                    ["details", "Details", "textarea"],
                  ]}
                  onSubmit={(d) =>
                    act(
                      () =>
                        api("/records", {
                          method: "POST",
                          body: JSON.stringify({ ...d, module: page }),
                        }),
                      "Record created",
                    )
                  }
                  label="Save record"
                />
              </>
            )}
            {modal === "notifications" && (
              <>
                <h2>Your attention centre</h2>
                <p className="muted">
                  Live items from your authorized workspace. Email and SMS
                  delivery are not connected.
                </p>
                {pending.length > 0 && (
                  <button
                    className="notification-row"
                    onClick={() => {
                      go("leave");
                      setModal(null);
                    }}
                  >
                    {pending.length} leave requests await review{" "}
                    <ArrowRight size={16} />
                  </button>
                )}
                {records
                  .filter((r) => r.status === "Open")
                  .slice(0, 5)
                  .map((r) => (
                    <div className="notification-row" key={r.id}>
                      <span>
                        {r.title}
                        <small className="block muted">
                          {r.module} · {date(r.due_date)}
                        </small>
                      </span>
                    </div>
                  ))}
                {!pending.length && !records.length && (
                  <Empty text="You're all caught up." />
                )}
              </>
            )}
            {modal.employee && (
              <>
                <Person employee={modal.employee} />
                <h2>Employee profile</h2>
                <dl>
                  {Object.entries(modal.employee)
                    .filter(([k]) => k !== "id")
                    .map(([k, v]) => (
                      <React.Fragment key={k}>
                        <dt>{k.replaceAll("_", " ")}</dt>
                        <dd>{String(v ?? "—")}</dd>
                      </React.Fragment>
                    ))}
                </dl>
              </>
            )}
            {modal.record && (
              <>
                <span className="eyebrow">{modal.record.module}</span>
                <h2>{modal.record.title}</h2>
                <Badge>{modal.record.status}</Badge>
                <p>{modal.record.details}</p>
                <p className="muted">
                  Due {date(modal.record.due_date)} · {modal.record.school}
                </p>
                {["Open", "In progress"].includes(modal.record.status) && (
                  <div className="module-links">
                    {["In progress", "Completed", "Cancelled"]
                      .filter((status) => status !== modal.record.status)
                      .map((status) => (
                        <button
                          className="outline"
                          disabled={busy}
                          key={status}
                          onClick={() =>
                            act(
                              () =>
                                api("/records/" + modal.record.id, {
                                  method: "PATCH",
                                  body: JSON.stringify({ status }),
                                }),
                              "Record updated",
                            )
                          }
                        >
                          {status === "Completed"
                            ? "Mark completed"
                            : status === "Cancelled"
                              ? "Cancel record"
                              : "Start task"}
                        </button>
                      ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function Login({ onLogin }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="login">
      <div className="login-story">
        <span className="brand">
          <span className="crest">
            K<span>✦</span>
          </span>
          <strong>KISC PeopleHub</strong>
        </span>
        <h1>
          Great schools
          <br />
          begin with
          <br />
          <em>great people.</em>
        </h1>
        <p>
          One team. Seven schools.
          <br />
          One connected workforce.
        </p>
        <span className="login-foot">
          KITENGELA INTERNATIONAL SCHOOLS · ENKO EDUCATION
        </span>
      </div>
      <div className="login-form">
        <div className="login-theme">
          <ThemeToggle />
        </div>
        <span className="eyebrow">YOUR PEOPLE, CONNECTED</span>
        <h1>Welcome to PeopleHub</h1>
        <p className="muted">Sign in to your KISC workspace.</p>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <Form
          busy={busy}
          fields={[
            ["email", "Email address", "email"],
            ["password", "Password", "password"],
          ]}
          label="Sign in securely"
          onSubmit={async (d) => {
            setBusy(true);
            try {
              await api("/login", { method: "POST", body: JSON.stringify(d) });
              await onLogin();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        />
        <div className="login-help">
          <ShieldCheck size={18} />
          <p>
            Development build. Use the local account and password configured
            during setup. Do not enter real employee data.
          </p>
        </div>
      </div>
    </div>
  );
}
function Form({ fields, onSubmit, label, busy }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(Object.fromEntries(new FormData(e.currentTarget)));
      }}
    >
      {fields.map(([name, title, type = "text", options]) => (
        <label className="field" key={name}>
          {title}
          {type === "select" ? (
            <select name={name} required>
              {options.map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          ) : type === "textarea" ? (
            <textarea
              name={name}
              required
              minLength={5}
              maxLength={3000}
              rows={4}
            />
          ) : (
            <input
              name={name}
              type={type}
              required
              maxLength={160}
              minLength={type === "password" ? 1 : undefined}
            />
          )}
        </label>
      ))}
      <button className="primary form-submit" disabled={busy}>
        {busy ? "Saving…" : label}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
function Person({ employee: e }) {
  return (
    <div className="person">
      <span className={"avatar tone" + (e.id % 5)}>{initials(e.name)}</span>
      <span>
        <b>{e.name}</b>
        <small>{e.title}</small>
      </span>
    </div>
  );
}
function Badge({ children }) {
  return (
    <span
      className={
        "badge " +
        (["Pending", "Open"].includes(children)
          ? "pending"
          : children === "Rejected"
            ? "rejected"
            : "")
      }
    >
      {children}
    </span>
  );
}
function Table({ heads, rows }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {heads.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function CardHead({ title, subtitle, action, onAction }) {
  return (
    <div className="card-head">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action && (
        <button className="text-button" onClick={onAction}>
          {action}
          <ArrowUpRight size={14} />
        </button>
      )}
    </div>
  );
}
function SearchBox({ value, onChange }) {
  return (
    <label className="search">
      <Search size={17} />
      <input
        aria-label="Search records"
        placeholder="Search by name, school, or keyword…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Empty({
  text = "No matching records found. Try another search or add a record.",
}) {
  return (
    <div className="empty">
      <Search size={28} />
      <p>{text}</p>
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  import.meta.env.VITE_HR_PREVIEW === "true" ? (
    <EmployeePreview />
  ) : window.location.pathname === "/app" &&
    import.meta.env.VITE_PUBLIC_SITE_ONLY !== "true" ? (
    <App />
  ) : (
    <Website />
  ),
);
