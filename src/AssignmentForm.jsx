import React, { useState } from "react";
import { ArrowUpRight, Building2, Users } from "lucide-react";
import { staffCategories, categoryLabel } from "./organization.js";
export default function AssignmentForm({
  schools,
  centralAllowed,
  initial = {},
  busy,
  onSubmit,
}) {
  const [placement, setPlacement] = useState(
      initial.placement || String(schools[0]?.id || ""),
    ),
    [category, setCategory] = useState(initial.category || "Teaching");
  const head = placement === "head-office";
  return (
    <form
      className="people-form assignment-form"
      onSubmit={(e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.currentTarget));
        onSubmit({
          ...d,
          school_id: head ? null : Number(placement),
          org_scope: head ? "Head office" : "School",
          staff_category: category,
        });
      }}
    >
      <div className="assignment-destination">
        <span className="people-eyebrow">
          1. CHOOSE WHERE THIS COLLEAGUE BELONGS
        </span>
        <label className="people-field">
          Office / school section
          <select
            aria-label="Office / school section"
            value={placement}
            onChange={(e) => {
              setPlacement(e.target.value);
              if (e.target.value === "head-office" && category === "Teaching")
                setCategory("Leadership");
            }}
            required
          >
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            {centralAllowed && (
              <option value="head-office">
                KISC Head Office & Group Leadership
              </option>
            )}
          </select>
        </label>
        <label className="people-field">
          Staff group
          <select
            aria-label="Staff group"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {staffCategories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <p>
          <Building2 size={14} />
          {head
            ? "Head office · overall KISC responsibility"
            : schools.find((s) => s.id === Number(placement))?.name}
          <span> / </span>
          {categoryLabel(category)}
        </p>
      </div>
      <div className="assignment-details">
        <span className="people-eyebrow">2. ADD THE EMPLOYEE DETAILS</span>
        <label className="people-field">
          Full name
          <input
            name="name"
            required
            minLength={3}
            maxLength={100}
            autoComplete="name"
          />
        </label>
        <label className="people-field">
          Work email
          <input
            name="email"
            type="email"
            required
            maxLength={150}
            autoComplete="email"
          />
        </label>
        <label className="people-field">
          Job title
          <input
            name="title"
            required
            minLength={2}
            maxLength={100}
            placeholder={
              head
                ? "e.g. Group HR Coordinator"
                : "e.g. Teacher, Driver, School Administrator"
            }
          />
        </label>
        <label className="people-field">
          Department
          <input
            name="department"
            aria-label="Department"
            required
            minLength={2}
            maxLength={80}
            list="assignment-departments"
            placeholder="Select or type a department"
          />
          <datalist id="assignment-departments">
            {[
              "Academics",
              "School Leadership",
              "Executive Leadership",
              "Human Resources",
              "Finance",
              "Administration",
              "ICT Services",
              "Transport",
              "Facilities",
              "Staff Welfare",
              "Boarding Operations",
              "Catering",
              "Security",
            ].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </datalist>
        </label>
        <label className="people-field">
          Curriculum / applicability
          <select
            key={head ? "central" : "school"}
            name="curriculum"
            defaultValue={head ? "Not applicable" : "CBE"}
          >
            {["CBE", "Cambridge / Pearson", "Other", "Not applicable"].map(
              (c) => (
                <option key={c}>{c}</option>
              ),
            )}
          </select>
        </label>
      </div>
      <p className="assignment-help">
        <Users size={15} />
        Staff grouping organizes the directory. It does not grant system
        permissions.
      </p>
      <button className="people-primary people-submit" disabled={busy}>
        {busy ? "Adding colleague…" : "Create employee"}
        <ArrowUpRight size={16} />
      </button>
    </form>
  );
}
