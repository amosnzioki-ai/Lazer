import React, { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Users,
  CalendarDays,
  Building2,
  ShieldCheck,
  ChartNoAxesCombined,
  HeartHandshake,
  Menu,
  X,
  Check,
  ChevronDown,
  MapPin,
  BriefcaseBusiness,
  FileText,
  Sparkles,
  GraduationCap,
  Download,
} from "lucide-react";
import "./website.css";
import ThemeToggle from "./ThemeToggle.jsx";
import BrandMark from "./BrandMark.jsx";
import { EmployeePreview } from "./Employees.jsx";
import "./business.css";
const publicOnly = import.meta.env.VITE_PUBLIC_SITE_ONLY === "true";
const workspaceUrl = publicOnly ? "#platform-preview" : "/app";
const schools = [
  "International School",
  "Main Primary Kitengela",
  "Junior School",
  "Senior Girls",
  "Senior Boys",
  "Athi River",
  "Syokimau",
];
const features = [
  {
    icon: Users,
    title: "People at the heart",
    description:
      "One clear home for every colleague, with employee profiles and a searchable staff directory.",
    status: "Available in the development app",
  },
  {
    icon: CalendarDays,
    title: "A little more breathing room",
    description:
      "Request time away and review leave decisions with a straightforward, connected process.",
    status: "Basic requests and decisions available",
  },
  {
    icon: Building2,
    title: "Seven schools. One picture.",
    description:
      "Bring your school sections together while keeping local teams focused on their own people.",
    status: "School-scoped access available",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Clarity to move forward",
    description:
      "See workforce distribution across the KISC community and export a simple staffing report.",
    status: "Workforce reporting available",
  },
  {
    icon: GraduationCap,
    title: "Room for everyone to grow",
    description:
      "A shared vision for professional development, qualifications and meaningful performance conversations.",
    status: "Specialist workflows in development",
  },
  {
    icon: ShieldCheck,
    title: "Trust, built thoughtfully",
    description:
      "Role-based access is part of the foundation. MFA, private files and independent security review are next.",
    status: "Security development in progress",
  },
];
const faqs = [
  [
    "What is KISC PeopleHub?",
    "PeopleHub is a proposed staff-only HR platform for Kitengela International Schools. This website introduces the project; the application is an early development release with fictional demonstration data. It is not an official or commissioned KISC product.",
  ],
  [
    "Who is it designed for?",
    "Employees, school leaders, managers, head office HR, finance and recruitment teams, with authorized aggregate oversight for Enko Education. Each role should only have the access needed for its work.",
  ],
  [
    "Does it include students or school fees?",
    "No. PeopleHub is exclusively for employee and HR management. It excludes students, parents, admissions, fees, grades and learner records.",
  ],
  [
    "Can the application be used for real HR work today?",
    "Not yet. Employee records, basic leave decisions and scoped task registers work in the development app. Production payroll, MFA, private file uploads, advanced approvals and security/compliance verification remain unfinished. Use fictional data only.",
  ],
  [
    "How do the schools and curricula fit together?",
    "The project models seven school sections across three physical campuses, with centralized KISC head office support. Cambridge/Pearson and Kenyan CBE are included in the design; final school names, curricula and reporting lines require confirmation by KISC.",
  ],
  [
    "Can this website run before the application is finished?",
    "Yes. This public website is static and does not need a database. The separate HR application needs a running backend and PostgreSQL. An online address still requires publishing the website to a hosting service.",
  ],
];
export default function Website() {
  const [open, setOpen] = useState(false),
    [view, setView] = useState("All schools"),
    [workspace, setWorkspace] = useState("Head office"),
    [showHR, setShowHR] = useState(false);
  const shown = view === "All schools" ? 21 : 3;
  if (showHR)
    return (
      <div>
        <div className="hr-demo-return">
          <button onClick={() => setShowHR(false)}>
            ← Back to the PeopleHub website
          </button>
          <span>INTERACTIVE EMPLOYEE & ATTENDANCE DEMO</span>
        </div>
        <EmployeePreview />
      </div>
    );
  return (
    <div className="website">
      <a className="web-skip" href="#main-content">
        Skip to content
      </a>
      <div className="web-announcement">
        <span className="web-live-dot" /> KISC PEOPLEHUB{" "}
        <span className="announcement-separator">·</span> The people behind the
        purpose <ArrowUpRight size={13} />
      </div>
      <header className="web-header">
        <a href="#" className="web-brand" aria-label="KISC PeopleHub home">
          <BrandMark />
          <span>
            <b>
              KISC<span>PeopleHub</span>
            </b>
            <small>YOUR PEOPLE, CONNECTED.</small>
          </span>
        </a>
        <nav
          className={open ? "web-links expanded" : "web-links"}
          aria-label="Main navigation"
        >
          <a href="#why-peoplehub" onClick={() => setOpen(false)}>
            Why PeopleHub
          </a>
          <a href="#features" onClick={() => setOpen(false)}>
            The platform
          </a>
          <a href="#schools" onClick={() => setOpen(false)}>
            Our school community
          </a>
          <a href="#questions" onClick={() => setOpen(false)}>
            FAQs
          </a>
        </nav>
        <ThemeToggle />
        <a
          href={workspaceUrl}
          onClick={
            publicOnly
              ? (e) => {
                  e.preventDefault();
                  setShowHR(true);
                  window.scrollTo(0, 0);
                }
              : undefined
          }
          className="web-login"
        >
          {publicOnly ? "Explore HR demo" : "Staff workspace"}{" "}
          <ArrowUpRight size={15} />
        </a>
        <button
          className="web-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      <main className="web-main" id="main-content">
        <section className="web-hero">
          <div className="web-hero-copy">
            <span className="web-eyebrow">
              <span /> THE WORKFORCE BEHIND THE EXCELLENCE.
            </span>
            <h1>
              Your people.
              <br />
              Their potential.
              <br />
              <em>One PeopleHub.</em>
            </h1>
            <p>
              A connected home for the people who power KISC. Bring HR, school
              teams and every colleague together—with clarity, care and purpose.
            </p>
            <div className="web-hero-actions">
              <a
                className="web-button web-button-maroon"
                href="#platform-preview"
              >
                Explore the platform <ArrowRight size={17} />
              </a>
              <a className="web-text-link" href="#why-peoplehub">
                Built for KISC <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="web-hero-trust">
              <span className="web-avatar-stack">
                <i>AW</i>
                <i>DO</i>
                <i>GM</i>
                <i>SK</i>
              </span>
              <span>
                One team. Seven schools.
                <br />
                <b>So much possibility.</b>
              </span>
            </div>
          </div>
          <div className="business-hero-scene">
            <div className="business-scene-label">
              <span /> THE PEOPLEHUB EXPERIENCE{" "}
              <small>ILLUSTRATIVE PREVIEW</small>
            </div>
            <div className="business-workspace">
              <div className="business-workspace-top">
                <BrandMark />
                <b>
                  PeopleHub<span> / Workspace</span>
                </b>
                <span className="business-preview-avatar">AM</span>
              </div>
              <div
                className="business-role-tabs"
                role="tablist"
                aria-label="Preview a workspace"
              >
                {["Head office", "School team", "My workspace"].map((w, i) => (
                  <button
                    key={w}
                    role="tab"
                    aria-selected={workspace === w}
                    tabIndex={workspace === w ? 0 : -1}
                    onClick={() => setWorkspace(w)}
                    onKeyDown={(e) => {
                      if (["ArrowRight", "ArrowLeft"].includes(e.key)) {
                        e.preventDefault();
                        const tabs = [
                          "Head office",
                          "School team",
                          "My workspace",
                        ];
                        const next = (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                        setWorkspace(tabs[next]);
                        e.currentTarget.parentElement
                          .querySelectorAll("button")
                          [next].focus();
                      }
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
              <div
                className="business-workspace-content"
                role="tabpanel"
                aria-label={workspace + " illustration"}
              >
                <span className="business-panel-eyebrow">
                  {workspace === "Head office"
                    ? "KISC HEAD OFFICE"
                    : workspace === "School team"
                      ? "INTERNATIONAL SCHOOL"
                      : "EMPLOYEE SELF-SERVICE"}
                </span>
                <h3>
                  {workspace === "Head office"
                    ? "A clear view. A stronger team."
                    : workspace === "School team"
                      ? "Your school. Your people."
                      : "Your working day, simplified."}
                </h3>
                <p>
                  {workspace === "Head office"
                    ? "Your workforce, connected across KISC."
                    : workspace === "School team"
                      ? "The people and priorities in your school."
                      : "Time away, HR support and your next step."}
                </p>
                <div className="business-metric-row">
                  <div>
                    <span>
                      {workspace === "My workspace"
                        ? "My profile"
                        : "People in view"}
                    </span>
                    <b>
                      {workspace === "Head office"
                        ? "21"
                        : workspace === "School team"
                          ? "3"
                          : "01"}
                    </b>
                    <small>
                      {workspace === "Head office"
                        ? "Across seven school sections"
                        : workspace === "School team"
                          ? "Within your school scope"
                          : "One master staff record"}
                    </small>
                  </div>
                  <div>
                    <span>
                      {workspace === "My workspace"
                        ? "HR services"
                        : "School sections"}
                    </span>
                    <b>
                      {workspace === "Head office"
                        ? "07"
                        : workspace === "School team"
                          ? "01"
                          : "24/7"}
                    </b>
                    <small>
                      {workspace === "My workspace"
                        ? "A vision for digital self-service"
                        : "One connected community"}
                    </small>
                  </div>
                </div>
                <div className="business-chart-head">
                  <b>
                    {workspace === "My workspace"
                      ? "Your people toolkit"
                      : "Workforce distribution"}
                  </b>
                  <span>Sample data</span>
                </div>
                {workspace === "My workspace" ? (
                  <div className="business-personal-grid">
                    <span>
                      <CalendarDays size={18} />
                      My leave
                    </span>
                    <span>
                      <FileText size={18} />
                      My records
                    </span>
                    <span>
                      <HeartHandshake size={18} />
                      HR support
                    </span>
                  </div>
                ) : (
                  <div className="business-staff-chart">
                    {(workspace === "Head office"
                      ? [53, 81, 65, 100, 72, 87, 59]
                      : [70]
                    ).map((height, i) => (
                      <div key={i}>
                        <i style={{ height: height + "px" }} />
                        <span>
                          {workspace === "Head office"
                            ? [
                                "INT",
                                "PRI",
                                "JNR",
                                "GIRLS",
                                "BOYS",
                                "ATHI",
                                "SYOK",
                              ][i]
                            : "INTERNATIONAL"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="business-activity">
                  <span className="business-check">
                    <Check size={13} />
                  </span>
                  <div>
                    <b>
                      {workspace === "My workspace"
                        ? "Less admin. More headspace."
                        : "Good decisions start with clarity."}
                    </b>
                    <small>Fictional preview · Development in progress</small>
                  </div>
                  <ArrowUpRight size={16} />
                </div>
              </div>
            </div>
            <div className="business-floating-note">
              <span>
                <ShieldCheck size={20} />
              </span>
              <div>
                <b>Purposeful access.</b>
                <small>The right view for every role.</small>
              </div>
            </div>
            <div className="business-scene-caption">
              <span>SEVEN SCHOOLS. ONE TEAM.</span>
              <span>PEOPLE FIRST. ALWAYS.</span>
            </div>
          </div>
        </section>
        <section className="web-facts" aria-label="Project scope">
          <div>
            <strong>07</strong>
            <span>
              school sections.
              <br />
              One shared purpose.
            </span>
          </div>
          <div>
            <strong>03</strong>
            <span>
              physical campuses.
              <br />A connected community.
            </span>
          </div>
          <div>
            <strong>01</strong>
            <span>
              central HR experience.
              <br />
              Designed around people.
            </span>
          </div>
          <div className="web-facts-signature">
            <span>A proposed platform for</span>
            <b>KITENGELA INTERNATIONAL SCHOOLS</b>
            <small>Part of the Enko Education network</small>
          </div>
        </section>
        <section className="web-section web-why" id="why-peoplehub">
          <div>
            <span className="web-eyebrow">
              ROOTED IN VALUES. POWERED BY PEOPLE.
            </span>
            <h2>
              Since 2009,
              <br />
              excellence has had
              <br />
              <em>a human side.</em>
            </h2>
          </div>
          <div className="web-why-copy">
            <p>
              KISC’s story is built on Christian values, international
              mindedness and a commitment to excellence. Behind that mission are
              dedicated educators, leaders and support teams.
            </p>
            <p>
              PeopleHub brings the same care to working life: helping every
              colleague feel supported, every team stay connected and every HR
              decision move forward with confidence.
            </p>
            <a className="web-text-link" href="#features">
              Explore a more connected way to work <ArrowRight size={16} />
            </a>
          </div>
        </section>
        <section className="web-section web-features" id="features">
          <div className="web-section-top">
            <div>
              <span className="web-eyebrow">DESIGNED FOR THE WAY YOU WORK</span>
              <h2>
                The everyday essentials.
                <br />
                <em>Exceptionally connected.</em>
              </h2>
            </div>
            <p>
              A clear foundation for everyday HR.
              <br />A considered roadmap for what comes next.
            </p>
          </div>
          <div className="web-feature-grid">
            {features.map(({ icon: Icon, title, description, status }, i) => (
              <article className="web-feature" key={title}>
                <div className="web-feature-top">
                  <span className={"web-feature-icon color-" + i}>
                    <Icon size={24} />
                  </span>
                  <span>0{i + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <small>
                  <span />
                  {status}
                </small>
              </article>
            ))}
          </div>
        </section>
        <section className="web-preview-section" id="platform-preview">
          <div className="web-preview-heading">
            <span className="web-eyebrow">FROM HEAD OFFICE TO EVERY TEAM</span>
            <h2>
              One workforce.
              <br />
              <em>A shared perspective.</em>
            </h2>
            <p>
              A glimpse of how one connected workspace
              <br />
              can bring your workforce into focus.
            </p>
            <a
              className="web-text-link"
              href={workspaceUrl}
              onClick={
                publicOnly
                  ? (e) => {
                      e.preventDefault();
                      setShowHR(true);
                      window.scrollTo(0, 0);
                    }
                  : undefined
              }
            >
              {publicOnly
                ? "Explore the project overview"
                : "Open the development workspace"}{" "}
              <ArrowUpRight size={16} />
            </a>
            <div className="web-preview-disclaimer">
              <ShieldCheck size={16} />
              <span>
                Illustrative preview with fictional data.
                <br />
                The application is still in development.
              </span>
            </div>
          </div>
          <div className="web-product-preview">
            <div className="web-preview-bar">
              <span className="web-window-dots">
                <i />
                <i />
                <i />
              </span>
              <span>PeopleHub · Workforce overview</span>
              <ShieldCheck size={13} />
            </div>
            <div className="web-preview-body">
              <div className="web-preview-title">
                <div>
                  <span>YOUR WORKFORCE, AT A GLANCE</span>
                  <h3>A little clarity for your day.</h3>
                </div>
                <select
                  aria-label="Preview school filter"
                  value={view}
                  onChange={(e) => setView(e.target.value)}
                >
                  <option>All schools</option>
                  {schools.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="web-preview-stats">
                <div>
                  <Users size={17} />
                  <span>People in this view</span>
                  <b>{shown}</b>
                </div>
                <div>
                  <Building2 size={17} />
                  <span>School sections</span>
                  <b>{view === "All schools" ? "7" : "1"}</b>
                </div>
                <div>
                  <CalendarDays size={17} />
                  <span>Shared purpose</span>
                  <b>One team</b>
                </div>
              </div>
              <div className="web-preview-chart">
                <div>
                  <b>
                    {view === "All schools" ? "A community, connected" : view}
                  </b>
                  <span>Illustrative workforce distribution</span>
                </div>
                <div className="web-mini-bars">
                  {(view === "All schools" ? schools : [view]).map((s, i) => (
                    <div key={s}>
                      <span>{view === "All schools" ? "3" : "3"}</span>
                      <i style={{ height: 75 + (i % 3) * 21 + "px" }} />
                      <small>
                        {s.replace(" Kitengela", "").replace(" School", "")}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="web-preview-note">
                <span />
                <b>People first.</b> Across every school, in every role.
              </div>
            </div>
          </div>
        </section>
        <section className="web-section web-schools" id="schools">
          <div className="web-section-top">
            <div>
              <span className="web-eyebrow">
                LOCAL TEAMS. SHARED STANDARDS.
              </span>
              <h2>
                Local identity.
                <br />
                <em>A shared horizon.</em>
              </h2>
            </div>
            <p>
              Seven school sections. Three campuses.
              <br />
              The same commitment to the people who make it all happen.
            </p>
          </div>
          <div className="web-campus-grid">
            {[
              [
                "01",
                "Kitengela",
                "A vibrant home for learning and collaboration.",
                [
                  "International School",
                  "Main Primary Kitengela",
                  "Junior School",
                  "Senior Girls",
                  "Senior Boys",
                ],
              ],
              [
                "02",
                "Athi River",
                "Part of one connected KISC community.",
                ["Athi River"],
              ],
              [
                "03",
                "Syokimau",
                "Different location. The same shared purpose.",
                ["Syokimau"],
              ],
            ].map(([n, name, desc, list]) => (
              <article className="web-campus" key={name}>
                <div className="web-campus-top">
                  <MapPin size={21} />
                  <span>CAMPUS {n}</span>
                </div>
                <h3>{name}</h3>
                <p>{desc}</p>
                <ul>
                  {list.map((s) => (
                    <li key={s}>
                      <span />
                      {s}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="web-schools-note">
            Proposed organizational structure. Final section names, campus
            assignments and curricula are subject to KISC confirmation.
          </p>
        </section>
        <section className="web-people-band">
          <span>For educators.</span>
          <span>For leaders.</span>
          <span>For every helping hand.</span>
          <b>
            For all of us. <Sparkles size={25} />
          </b>
        </section>
        <section className="web-section web-faq" id="questions">
          <div>
            <span className="web-eyebrow">A LITTLE MORE CLARITY</span>
            <h2>
              Good questions.
              <br />
              <em>Honest answers.</em>
            </h2>
            <p>
              This is the beginning of a thoughtful
              <br />
              HR experience, built step by step.
            </p>
            <a
              className="web-text-link"
              href="/peoplehub-overview.txt"
              download
            >
              <Download size={16} /> Download the project overview
            </a>
          </div>
          <div className="web-faq-list">
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <ChevronDown size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="web-final-cta">
          <div className="web-cta-mark">✦</div>
          <span className="web-eyebrow">ONE TEAM. SEVEN SCHOOLS.</span>
          <h2>
            Here for the people
            <br />
            who <em>make the difference.</em>
          </h2>
          <p>
            Discover the vision. Explore the workspace.
            <br />
            Help shape what comes next.
          </p>
          <a
            className="web-button web-button-gold"
            href={workspaceUrl}
            onClick={
              publicOnly
                ? (e) => {
                    e.preventDefault();
                    setShowHR(true);
                    window.scrollTo(0, 0);
                  }
                : undefined
            }
          >
            {publicOnly
              ? "Discover the platform preview"
              : "Explore the development app"}{" "}
            <ArrowUpRight size={17} />
          </a>
          <small>
            Fictional demonstration data only · Not ready for live HR use
          </small>
        </section>
      </main>
      <footer className="web-footer">
        <div className="web-footer-top">
          <div>
            <a href="#" className="web-brand">
              <BrandMark />
              <span>
                <b>
                  KISC<span>PeopleHub</span>
                </b>
                <small>YOUR PEOPLE, CONNECTED.</small>
              </span>
            </a>
            <p>
              A more connected working life.
              <br />
              Designed around the KISC community.
            </p>
          </div>
          <div>
            <span>EXPLORE</span>
            <a href="#features">The platform</a>
            <a href="#schools">School community</a>
            <a href="#questions">Frequently asked questions</a>
          </div>
          <div>
            <span>TAKE A LOOK</span>
            <a
              href={workspaceUrl}
              onClick={
                publicOnly
                  ? (e) => {
                      e.preventDefault();
                      setShowHR(true);
                      window.scrollTo(0, 0);
                    }
                  : undefined
              }
            >
              {publicOnly ? "Platform preview" : "Development workspace"}{" "}
              <ArrowUpRight size={12} />
            </a>
            <a href="/peoplehub-overview.txt" download>
              Project overview <Download size={12} />
            </a>
            <a href="#project-notice">Project & privacy notice</a>
          </div>
        </div>
        <div className="web-footer-bottom">
          <span>
            © {new Date().getFullYear()} KISC PeopleHub concept project.
          </span>
          <span>
            Made with people in mind. <span className="web-live-dot" />
          </span>
        </div>
        <p id="project-notice" className="web-project-notice">
          Independent concept for KISC consideration; not an official or
          commissioned KISC website. PeopleHub uses its own product wordmark
          inspired by the supplied KISC colour palette. This public site does
          not use analytics, contact forms or tracking cookies. Your theme
          preference is stored on your device when browser storage is available.
          Opening the development application uses authentication cookies when
          you sign in. Do not submit real personnel information. School and
          network references describe the proposed project scope.
        </p>
      </footer>
    </div>
  );
}
