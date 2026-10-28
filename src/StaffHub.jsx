import React, { useEffect, useState } from "react";
import {
  FileText,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  Megaphone,
  BookOpen,
  ArrowUpRight,
  Plus,
  Search,
  LockKeyhole,
  ShieldCheck,
  X,
  Send,
  Eye,
  ArrowLeft,
  Flag,
  RefreshCw,
  Download,
} from "lucide-react";
import { hubCategories } from "./hub-model.js";
import "./wellbeing-hub.css";
const icons = {
  Report: FileText,
  Minutes: ClipboardList,
  Meeting: CalendarDays,
  Action: CheckCheck,
  Decision: Flag,
  Notice: Megaphone,
  Policy: BookOpen,
};
const monthKey = (d) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
  }).format(new Date(d));
const todayKey = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(
    new Date(),
  );
const admins = ["super_admin", "hr", "school_admin"];
const central = ["super_admin", "hr"];
const date = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Africa/Nairobi",
      })
    : "Not scheduled";
export default function StaffHub({ api, user, schools, offline = false }) {
  const [records, setRecords] = useState([]),
    [category, setCategory] = useState("Report"),
    [query, setQuery] = useState(""),
    [preview, setPreview] = useState(false),
    [modal, setModal] = useState(null),
    [active, setActive] = useState(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [month, setMonth] = useState("");
  const admin = admins.includes(user.role),
    editing = admin && !preview;
  const canManage = (r) =>
    editing && (central.includes(user.role) || r.school_id === user.school_id);
  async function load() {
    const rows = await api("/hub");
    setRecords(rows);
    if (active) setActive(rows.find((r) => r.id === active.id) || null);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const handle = (e) => {
      if (e.key === "Escape") setModal(null);
      if (e.key === "Tab") {
        const elements = [
          ...document.querySelectorAll(
            ".hub-dialog button,.hub-dialog input,.hub-dialog select,.hub-dialog textarea",
          ),
        ].filter((n) => !n.disabled);
        if (e.shiftKey && document.activeElement === elements[0]) {
          e.preventDefault();
          elements.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === elements.at(-1)) {
          e.preventDefault();
          elements[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [modal]);
  async function run(fn, text) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
      await load();
      setModal(null);
      setMessage(text);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const readable = records.filter((r) => editing || r.state === "Published");
  const list = readable.filter(
    (r) =>
      r.category === category &&
      [r.title, r.body, r.owner]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!month ||
        category !== "Meeting" ||
        (r.starts_at && monthKey(r.starts_at) === month)),
  );
  const schoolName = (r) =>
    r.school_id === null
      ? "All authorized KISC staff"
      : schools.find((s) => s.id === r.school_id)?.name || "Assigned school";
  function switchCategory(c) {
    setCategory(c);
    setActive(null);
    setQuery("");
    setMessage("");
    setError("");
  }
  async function download(r) {
    try {
      await api("/hub/" + r.id + "/download", {
        method: "POST",
        body: JSON.stringify({ version: r.version }),
      });
    } catch (e) {
      setError(e.message);
      return;
    }
    const body = [
      r.category + ": " + r.title,
      "Status: " + r.state + " · Version " + r.version,
      "Audience: " + schoolName(r),
      "",
      r.body,
      "",
      r.owner ? "Owner / chair: " + r.owner : "",
      r.starts_at
        ? "Meeting: " +
          new Date(r.starts_at).toLocaleString("en-KE", {
            timeZone: "Africa/Nairobi",
          }) +
          " (Nairobi)"
        : "",
      r.due_on ? "Due: " + date(r.due_on) : "",
    ]
      .filter((v) => v !== null)
      .join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "peoplehub-" +
      r.category.toLowerCase() +
      "-" +
      r.id +
      "-v" +
      r.version +
      ".txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="people-workspace staff-hub">
      <div className="hub-intro">
        <div>
          <span className="people-eyebrow">KISC KNOWLEDGE & COLLABORATION</span>
          <h2>
            Good conversations.
            <br />
            <em>Clear next steps.</em>
          </h2>
          <p>
            Reports, minutes and the shared knowledge that moves your teams
            forward.
          </p>
        </div>
        <span className="hub-access-note">
          <ShieldCheck size={19} />
          <b>Staff-only publishing.</b>
          <small>Health profiles are never included.</small>
        </span>
      </div>
      {offline && (
        <div className="people-demo-strip">
          <LockKeyhole size={15} />
          Fictional offline demonstration · Preview modes are not authentication
          · No Internet publication
        </div>
      )}
      <div className="hub-mode-row">
        {admin ? (
          <div className="hub-view-switch">
            <button
              aria-pressed={!preview}
              onClick={() => {
                setPreview(false);
                setActive(null);
              }}
            >
              Admin workspace
            </button>
            <button
              aria-pressed={preview}
              onClick={() => {
                setPreview(true);
                setActive(null);
              }}
            >
              <Eye size={14} />
              Published staff preview
            </button>
          </div>
        ) : (
          <span className="hub-staff-label">
            Published for your staff audience
          </span>
        )}
        <button
          className="people-secondary"
          aria-label="Refresh communications"
          onClick={() => run(async () => {}, "Records refreshed")}
        >
          <RefreshCw size={14} />
        </button>
      </div>
      {error && (
        <div role="alert" className="people-alert">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="people-success">
          <CheckCheck size={15} />
          {message}
        </div>
      )}
      <div className="hub-layout">
        <nav
          className="hub-category-nav"
          aria-label="Reports and collaboration sections"
        >
          {hubCategories.map(([c, label]) => {
            const Icon = icons[c];
            return (
              <button
                key={c}
                className={category === c ? "active" : ""}
                onClick={() => switchCategory(c)}
              >
                <Icon size={17} />
                <span>{label}</span>
                <i>{readable.filter((r) => r.category === c).length}</i>
              </button>
            );
          })}
          <div className="hub-nav-note">
            <LockKeyhole size={19} />
            <b>Private by default.</b>
            <p>
              An admin reviews a record before publishing it to its staff
              audience.
            </p>
          </div>
        </nav>
        <div className="hub-main-area">
          {active ? (
            <>
              <button className="people-back" onClick={() => setActive(null)}>
                <ArrowLeft size={15} />
                Back to{" "}
                {hubCategories
                  .find((c) => c[0] === category)?.[1]
                  .toLowerCase()}
              </button>
              <article className="hub-document">
                <div className="hub-document-meta">
                  <span className="people-eyebrow">
                    {active.category.toUpperCase()} · VERSION {active.version}
                  </span>
                  <span
                    className={
                      "people-badge " +
                      (active.state === "Published" ? "positive" : "neutral")
                    }
                  >
                    {active.state}
                  </span>
                </div>
                <h3>{active.title}</h3>
                <p className="hub-document-audience">
                  <ShieldCheck size={13} />
                  {schoolName(active)} <span>·</span>
                  {active.classification}
                </p>
                {active.category === "Meeting" && (
                  <div className="hub-meeting-info">
                    <CalendarDays size={20} />
                    <div>
                      <b>
                        {active.starts_at
                          ? new Date(active.starts_at).toLocaleString("en-KE", {
                              timeZone: "Africa/Nairobi",
                            })
                          : "Meeting time not recorded"}
                      </b>
                      <span>
                        Nairobi time · {active.venue || "Venue not recorded"}
                      </span>
                    </div>
                  </div>
                )}
                <div className="hub-document-body">{active.body}</div>
                {["Action", "Decision"].includes(active.category) && (
                  <div className="hub-action-details">
                    <span>
                      Owner: <b>{active.owner || "Unassigned"}</b>
                    </span>
                    <span>
                      Due: <b>{date(active.due_on)}</b>
                    </span>
                    <span>
                      Status: <b>{active.workflow_state}</b>
                    </span>
                  </div>
                )}
                <div className="hub-document-footer">
                  <span>
                    Updated {date(active.updated_at)} ·{" "}
                    {active.author || "HR administration"}
                  </span>
                  <button
                    className="people-link"
                    onClick={() => download(active)}
                  >
                    <Download size={13} />
                    Download text
                  </button>
                </div>
                {active.category === "Policy" &&
                  active.state === "Published" && (
                    <div className="hub-policy-ack">
                      <BookOpen size={21} />
                      <div>
                        <b>
                          {active.acknowledged
                            ? "You have acknowledged this version."
                            : "Read this version before acknowledging."}
                        </b>
                        <p>
                          {canManage(active)
                            ? `${active.acknowledgement_count || 0} acknowledgements recorded for version ${active.version}.`
                            : "Your acknowledgement is recorded against your account and this document version."}
                        </p>
                      </div>
                      <button
                        disabled={busy || active.acknowledged}
                        className="people-primary"
                        onClick={() =>
                          run(
                            () =>
                              api("/hub/" + active.id + "/acknowledge", {
                                method: "POST",
                                body: JSON.stringify({
                                  version: active.version,
                                }),
                              }),
                            "Policy acknowledgement recorded",
                          )
                        }
                      >
                        {active.acknowledged
                          ? "Acknowledged"
                          : "I have read this version"}
                      </button>
                    </div>
                  )}
                {canManage(active) && (
                  <div className="hub-document-actions">
                    <button
                      className="people-secondary"
                      onClick={() => setModal({ edit: active })}
                    >
                      Edit record
                    </button>
                    {active.state === "Draft" ? (
                      <button
                        className="people-primary"
                        onClick={() => setModal({ publish: active })}
                      >
                        <Send size={14} />
                        Review & publish to staff
                      </button>
                    ) : (
                      <button
                        className="people-secondary"
                        disabled={busy}
                        onClick={() =>
                          run(
                            () =>
                              api("/hub/" + active.id + "/unpublish", {
                                method: "POST",
                                body: JSON.stringify({
                                  version: active.version,
                                }),
                              }),
                            "Record withdrawn to draft",
                          )
                        }
                      >
                        Withdraw to draft
                      </button>
                    )}
                  </div>
                )}
                <p className="people-footnote">
                  Editing a published record returns it to draft. Policies
                  require a new acknowledgement after the version changes.
                  Downloads are text copies, not certified or digitally signed
                  documents.
                </p>
              </article>
            </>
          ) : (
            <>
              <div className="hub-category-heading">
                <div>
                  <span className="people-eyebrow">
                    {editing ? "ADMIN CONTROLLED" : "APPROVED STAFF VIEW"}
                  </span>
                  <h3>{hubCategories.find((c) => c[0] === category)?.[1]}</h3>
                  <p>{hubCategories.find((c) => c[0] === category)?.[2]}</p>
                </div>
                {editing && (
                  <button
                    className="people-primary"
                    onClick={() => setModal("new")}
                  >
                    <Plus size={15} />
                    New {category.toLowerCase()}
                  </button>
                )}
              </div>
              <div className="hub-search-row">
                <label className="people-search">
                  <Search size={15} />
                  <input
                    aria-label="Search communications"
                    placeholder="Search titles, content or owners…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                {category === "Meeting" && (
                  <>
                    <input
                      className="hub-month"
                      aria-label="Filter meeting month"
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                    />
                    {month && (
                      <button
                        className="people-link"
                        onClick={() => setMonth("")}
                      >
                        All dates
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="hub-record-list">
                {list.map((r) => {
                  const Icon = icons[r.category],
                    overdue =
                      r.category === "Action" &&
                      r.workflow_state !== "Completed" &&
                      r.due_on &&
                      r.due_on.slice(0, 10) < todayKey();
                  return (
                    <article key={r.id} className="hub-record-card">
                      <span className="hub-record-icon">
                        <Icon size={22} />
                      </span>
                      <div className="hub-record-copy">
                        <span>
                          {schoolName(r)} · v{r.version}
                        </span>
                        <button onClick={() => setActive(r)}>
                          {r.title}
                          <ArrowUpRight size={14} />
                        </button>
                        <p>
                          {r.body.slice(0, 135)}
                          {r.body.length > 135 ? "…" : ""}
                        </p>
                        <div className="hub-record-tags">
                          {r.category === "Meeting" && (
                            <span>
                              <CalendarDays size={12} />
                              {date(r.starts_at)} · {r.venue || "Venue pending"}
                            </span>
                          )}
                          {r.owner && <span>{r.owner}</span>}
                          {r.due_on && (
                            <span className={overdue ? "overdue" : ""}>
                              {overdue ? "Overdue · " : ""}Due {date(r.due_on)}
                            </span>
                          )}
                          {r.category === "Action" && (
                            <span>{r.workflow_state}</span>
                          )}
                          {r.category === "Policy" && (
                            <span>
                              {r.acknowledged
                                ? "Acknowledged"
                                : "Acknowledgement available after publication"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="hub-record-state">
                        <span
                          className={
                            "people-badge " +
                            (r.state === "Published" ? "positive" : "neutral")
                          }
                        >
                          {r.state}
                        </span>
                        <small>{r.classification}</small>
                      </div>
                    </article>
                  );
                })}
              </div>
              {!list.length && (
                <div className="people-empty">
                  <FileText size={29} />
                  <h3>No {category.toLowerCase()} records in this view</h3>
                  <p>
                    {editing
                      ? "Create a draft, review its content, then publish it to the appropriate staff audience."
                      : "Only published records for your audience are shown here."}
                  </p>
                </div>
              )}
              <div className="hub-publication-note">
                <LockKeyhole size={17} />
                <p>
                  {editing
                    ? "New records start as confidential drafts. Publishing requires a Staff-ready classification and an explicit content/privacy review."
                    : "Drafts, withdrawn records and confidential health profiles are not part of the staff noticeboard."}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      {modal && (
        <div className="people-modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="people-dialog hub-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Staff communication form"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="people-dialog-close"
              aria-label="Close communication dialog"
              onClick={() => setModal(null)}
            >
              <X size={19} />
            </button>
            {error && (
              <div className="people-alert" role="alert">
                {error}
              </div>
            )}
            {modal.publish ? (
              <>
                <span className="people-eyebrow">
                  CONTROLLED STAFF PUBLICATION
                </span>
                <h2>Review before you share.</h2>
                <p>
                  <b>{modal.publish.title}</b>
                  <br />
                  Audience: {schoolName(modal.publish)}
                </p>
                <div className="hub-publication-note">
                  <ShieldCheck size={22} />
                  <p>
                    Publish only an approved staff-safe version. Remove private
                    personnel, medical, grievance and safeguarding case details.
                    This publishes within the authenticated staff workspace, not
                    on the open Internet.
                  </p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(
                      () =>
                        api("/hub/" + modal.publish.id + "/publish", {
                          method: "POST",
                          body: JSON.stringify({
                            version: modal.publish.version,
                            reviewed: true,
                          }),
                        }),
                      "Published to authorized staff",
                    );
                  }}
                >
                  {modal.publish.classification !== "Staff-ready" && (
                    <div className="people-alert">
                      This is classified Confidential. Edit it and select
                      Staff-ready before publishing.
                    </div>
                  )}
                  <label className="hub-confirm">
                    <input
                      required
                      type="checkbox"
                      aria-label="I have reviewed this record for staff sharing"
                    />
                    I have reviewed the content and confirmed it is appropriate
                    for the selected staff audience.
                  </label>
                  <button
                    className="people-primary people-submit"
                    disabled={
                      busy || modal.publish.classification !== "Staff-ready"
                    }
                  >
                    <Send size={15} />
                    Publish to authorized staff
                  </button>
                </form>
              </>
            ) : (
              <>
                <span className="people-eyebrow">PRIVATE DRAFT FIRST</span>
                <h2>
                  {modal.edit ? "Update the record." : "Capture what matters."}
                </h2>
                <p>
                  Published edits return to draft. Keep sensitive personnel and
                  health information out of this workspace.
                </p>
                <HubForm
                  category={category}
                  existing={modal.edit}
                  schools={schools}
                  user={user}
                  busy={busy}
                  onSubmit={(d) =>
                    run(
                      () =>
                        api("/hub" + (modal.edit ? "/" + modal.edit.id : ""), {
                          method: modal.edit ? "PATCH" : "POST",
                          body: JSON.stringify({
                            ...d,
                            ...(modal.edit
                              ? { version: modal.edit.version }
                              : {}),
                          }),
                        }),
                      modal.edit
                        ? "Updated and returned to draft"
                        : "Draft created",
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
function HubForm({ category, existing, schools, user, onSubmit, busy }) {
  const [kind, setKind] = useState(existing?.category || category);
  const localDate = existing?.starts_at
    ? new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Africa/Nairobi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(new Date(existing.starts_at))
        .replace(" ", "T")
    : "";
  return (
    <form
      className="people-form"
      onSubmit={(e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.currentTarget));
        onSubmit({
          category: kind,
          title: d.title,
          body: d.body,
          school_id: d.school_id === "all" ? null : Number(d.school_id),
          classification: d.classification,
          due_on: d.due_on || null,
          starts_at: d.starts_at
            ? new Date(d.starts_at + "+03:00").toISOString()
            : null,
          venue: d.venue || "",
          owner: d.owner || "",
          workflow_state: d.workflow_state || "Open",
        });
      }}
    >
      <div>
        <label className="people-field">
          Record type
          <select
            aria-label="Record type"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {hubCategories.map(([c, label]) => (
              <option key={c} value={c}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="people-field">
          Audience scope
          <select
            name="school_id"
            aria-label="Audience scope"
            defaultValue={
              existing?.school_id ??
              (central.includes(user.role) ? "all" : user.school_id)
            }
          >
            {central.includes(user.role) && (
              <option value="all">All authorized KISC staff</option>
            )}
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="people-field wide">
          Title
          <input
            name="title"
            aria-label="Communication title"
            required
            minLength={4}
            maxLength={180}
            defaultValue={existing?.title || ""}
          />
        </label>
        <label className="people-field wide">
          Content / minutes
          <textarea
            name="body"
            aria-label="Content / minutes"
            rows={7}
            required
            minLength={10}
            maxLength={10000}
            defaultValue={existing?.body || ""}
            placeholder={
              kind === "Minutes"
                ? "Agenda:\nAttendees (only if appropriate for the chosen audience):\nDiscussion:\nDecisions:\nActions and owners:"
                : "Write a clear staff-safe summary. Sensitive personnel and health details belong in their restricted records."
            }
          />
        </label>
        <label className="people-field">
          Content classification
          <select
            name="classification"
            aria-label="Content classification"
            defaultValue={existing?.classification || "Confidential"}
          >
            <option>Confidential</option>
            <option>Staff-ready</option>
          </select>
        </label>
        {["Meeting", "Minutes"].includes(kind) && (
          <label className="people-field">
            Meeting time (Nairobi)
            <input
              name="starts_at"
              aria-label="Meeting time (Nairobi)"
              type="datetime-local"
              required={kind === "Meeting"}
              defaultValue={localDate}
            />
          </label>
        )}
        {["Meeting", "Minutes"].includes(kind) && (
          <label className="people-field">
            Venue / meeting link
            <input
              name="venue"
              maxLength={160}
              defaultValue={existing?.venue || ""}
            />
          </label>
        )}
        {["Action", "Decision", "Meeting", "Minutes"].includes(kind) && (
          <label className="people-field">
            Owner / chair
            <input
              name="owner"
              aria-label="Owner / chair"
              maxLength={100}
              defaultValue={existing?.owner || ""}
            />
          </label>
        )}
        {["Action", "Decision"].includes(kind) && (
          <label className="people-field">
            Due date
            <input
              name="due_on"
              aria-label="Due date"
              type="date"
              defaultValue={existing?.due_on?.slice(0, 10) || ""}
            />
          </label>
        )}
        {kind === "Action" && (
          <label className="people-field">
            Action progress
            <select
              name="workflow_state"
              aria-label="Action progress"
              defaultValue={existing?.workflow_state || "Open"}
            >
              <option>Open</option>
              <option>In progress</option>
              <option>Completed</option>
            </select>
          </label>
        )}
      </div>
      <button className="people-primary people-submit" disabled={busy}>
        {busy ? "Saving…" : "Save private draft"}
        <ArrowUpRight size={15} />
      </button>
    </form>
  );
}
