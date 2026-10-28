import React, { useEffect, useState } from "react";
import {
  HeartPulse,
  ShieldCheck,
  LockKeyhole,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
const fields = [
  ["allergies", "Allergies & sensitivities"],
  ["health_conditions", "Relevant health conditions"],
  ["medications", "Medication / support notes"],
  ["workplace_adjustments", "Workplace adjustments"],
  ["emergency_instructions", "Emergency support instructions"],
  ["health_contact", "Authorized health contact"],
];
export default function HealthProfile({ employee, user, api, offline }) {
  const [data, setData] = useState(null),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const edit = ["super_admin", "hr"].includes(user.role);
  async function load() {
    setData(await api("/employees/" + employee.id + "/health"));
  }
  useEffect(() => {
    setData(null);
    setError("");
    load().catch((e) => setError(e.message));
  }, [employee.id]);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const d = Object.fromEntries(new FormData(e.currentTarget));
    delete d.confirm;
    try {
      await api("/employees/" + employee.id + "/health", {
        method: "PUT",
        body: JSON.stringify({ version: data.version, profile: d }),
      });
      await load();
      setEditing(false);
      setMessage("Confidential health profile saved.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="people-panel health-panel">
      <div className="health-heading">
        <span className="health-icon">
          <HeartPulse size={26} />
        </span>
        <div>
          <span className="people-eyebrow">
            HIGHLY CONFIDENTIAL · NEVER PUBLISHABLE
          </span>
          <h3>Health & workplace support</h3>
          <p>
            Only central HR and this employee can access the connected health
            profile.
          </p>
        </div>
        {edit && data && !editing && (
          <button
            className="people-secondary"
            onClick={() => {
              setEditing(true);
              setMessage("");
            }}
          >
            Update health profile
          </button>
        )}
      </div>
      <div className="health-boundary">
        <LockKeyhole size={18} />
        <p>
          {offline
            ? "Fictional demonstration only. This HTML file is not secure medical storage. Demo entries may be saved in your browser; never enter real health information."
            : "Health fields are encrypted in the database and retrieved separately from the directory. Share only the minimum information needed for authorized workplace support."}
        </p>
      </div>
      {error && (
        <div className="people-alert" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="people-success" role="status">
          <Check size={16} />
          {message}
        </div>
      )}
      {!data && !error && (
        <p className="people-empty">Loading confidential profile…</p>
      )}
      {data &&
        (editing ? (
          <form className="health-form" onSubmit={save}>
            <div className="health-field-grid">
              {fields.map(([name, label]) => (
                <label className="people-field" key={name}>
                  {label}
                  <textarea
                    name={name}
                    aria-label={label}
                    maxLength={1200}
                    defaultValue={data[name]}
                    rows={3}
                  />
                </label>
              ))}
              <label className="people-field">
                Last reviewed
                <input
                  name="reviewed_on"
                  type="date"
                  aria-label="Last reviewed"
                  required
                  defaultValue={
                    data.reviewed_on ||
                    new Intl.DateTimeFormat("en-CA", {
                      timeZone: "Africa/Nairobi",
                    }).format(new Date())
                  }
                />
              </label>
              <label className="people-field">
                Source & authorized support purpose
                <textarea
                  name="source_note"
                  aria-label="Source & authorized support purpose"
                  required
                  minLength={5}
                  maxLength={500}
                  defaultValue={data.source_note}
                  rows={3}
                />
              </label>
            </div>
            <label className="hub-confirm">
              <input type="checkbox" required name="confirm" />I confirm an
              authorized workplace-support purpose and that this is the minimum
              necessary information.
            </label>
            <div className="health-form-actions">
              <button className="people-primary" disabled={busy}>
                {busy ? "Saving…" : "Save confidential profile"}
              </button>
              <button
                type="button"
                className="people-secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="health-field-grid">
              {fields.map(([key, title]) => (
                <section className="health-detail" key={key}>
                  <span>{title}</span>
                  <p>{data[key] || "Not recorded"}</p>
                </section>
              ))}
            </div>
            <div className="health-review">
              <ShieldCheck size={16} />
              <span>
                Last reviewed:{" "}
                {data.reviewed_on?.slice(0, 10) || "Not yet reviewed"} · Version{" "}
                {data.version}
              </span>
            </div>
            {data.source_note && (
              <div className="health-detail">
                <span>Source & authorized support purpose</span>
                <p>{data.source_note}</p>
              </div>
            )}
            <p className="people-footnote">
              This is a workplace-support record, not medical advice or a
              diagnosis tool. No health fields are available to the
              reports/minutes publishing workflow.
            </p>
          </>
        ))}
    </article>
  );
}
