import { sampleHubRecords } from "./hub-model.js";
import { organizationSeeds } from "./organization.js";
// Offline, fictional demonstration adapter. This does not connect to hardware or a database.
export const demoSchools = [
  "International School",
  "Main Primary Kitengela",
  "Junior School",
  "Senior Girls",
  "Senior Boys",
  "Athi River",
  "Syokimau",
].map((name, i) => ({
  id: i + 1,
  name,
  campus: i === 5 ? "Athi River" : i === 6 ? "Syokimau" : "Kitengela",
}));
const names = [
  "Amara Wanjiku",
  "Daniel Otieno",
  "Grace Mutua",
  "James Kamau",
  "Faith Njeri",
  "Peter Mwangi",
  "Sarah Achieng",
  "Brian Kiptoo",
  "Mercy Wambui",
  "David Kariuki",
  "Esther Muthoni",
  "Kevin Ouma",
  "Ruth Chebet",
  "Joseph Musyoka",
  "Lilian Adhiambo",
  "Samuel Maina",
  "Naomi Wairimu",
  "Eric Kimani",
  "Alice Nyambura",
  "Moses Kibet",
  "Joyce Muli",
];
export function eventId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
const key = "peoplehub-employee-demo-v1";
const day = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Nairobi",
}).format(new Date());
function fresh() {
  return {
    employees: names.map((name, i) => ({
      id: i + 1,
      staff_id: "KISC-" + String(i + 1).padStart(4, "0"),
      name,
      email: name.toLowerCase().replace(" ", ".") + "@example.test",
      title: [
        "Mathematics Teacher",
        "English Teacher",
        "HR Officer",
        "Science Teacher",
        "Finance Officer",
        "School Principal",
        "ICT Specialist",
      ][i % 7],
      department: [
        "Academics",
        "Academics",
        "Human Resources",
        "Academics",
        "Finance",
        "Leadership",
        "Operations",
      ][i % 7],
      school_id: (i % 7) + 1,
      school: demoSchools[i % 7].name,
      org_scope: "School",
      staff_category:
        i % 7 === 0 || i % 7 === 1 || i % 7 === 3
          ? "Teaching"
          : i % 7 === 5
            ? "Leadership"
            : "Support",
      status: i === 8 ? "Probation" : i === 11 ? "On leave" : "Active",
      start_date: "2022-01-10",
      curriculum: i % 7 === 0 || i % 7 === 6 ? "Cambridge / Pearson" : "CBE",
      phone: "DEMO-PHONE-" + String(i + 1).padStart(3, "0"),
      location: demoSchools[i % 7].campus,
      employment_type: i % 5 === 0 ? "Fixed-term" : "Permanent",
      manager: "Head of School",
      emergency_name: "Demo emergency contact",
      emergency_phone: "Demo contact only",
      tsc_number: i % 7 < 2 || i % 7 === 3 ? "DEMO-TSC-" + (i + 1) : "",
      bio: "Fictional employee profile. No real personal information is included.",
      contract_end: null,
      qualifications: [
        {
          id: 100 + i * 2,
          title:
            i % 7 < 2 || i % 7 === 3
              ? "Bachelor of Education"
              : "Professional diploma",
          issuer: "Demonstration University",
          category: "Academic",
          awarded_on: "2020-12-01",
          expires_on: null,
          verified: true,
        },
        {
          id: 101 + i * 2,
          title: "Safeguarding awareness",
          issuer: "Demo Training Centre",
          category: "Safeguarding",
          awarded_on: "2026-01-12",
          expires_on: "2027-01-12",
          verified: true,
        },
      ],
      attendance:
        i < 9 && new Date(day + "T07:30:00+03:00") < new Date()
          ? [
              {
                id: "seed-" + i,
                direction: "IN",
                occurred_at: new Date(day + "T07:30:00+03:00").toISOString(),
                source: "Offline demo",
                reason: "Fictional demonstration event",
                event_ref: "seed-" + i,
              },
              ...(i < 3 && new Date(day + "T10:00:00+03:00") < new Date()
                ? [
                    {
                      id: "seed-out-" + i,
                      direction: "OUT",
                      occurred_at: new Date(
                        day + "T10:00:00+03:00",
                      ).toISOString(),
                      source: "Offline demo",
                      reason: "Fictional demonstration event",
                    },
                  ]
                : []),
            ]
          : [],
      activity: [],
    })),
    devices: [],
  };
}
let state;
try {
  state = JSON.parse(localStorage.getItem(key));
} catch {}
if (!state?.employees) state = fresh();
for (const e of state.employees) {
  e.org_scope ||= "School";
  e.staff_category ||=
    e.department === "Academics"
      ? "Teaching"
      : e.department === "Leadership"
        ? "Leadership"
        : "Support";
}
for (const seed of organizationSeeds) {
  if (!state.employees.some((e) => e.staff_id === "KISC-DEMO-" + seed.key)) {
    const base = fresh().employees[0];
    state.employees.push({
      ...base,
      ...seed,
      id: Math.max(...state.employees.map((e) => e.id)) + 1,
      staff_id: "KISC-DEMO-" + seed.key,
      email: seed.name.toLowerCase().replaceAll(" ", ".") + "@example.test",
      school:
        seed.org_scope === "Head office"
          ? "KISC Head Office"
          : demoSchools.find((s) => s.id === seed.school_id).name,
      curriculum:
        seed.org_scope === "Head office" ? "Not applicable" : base.curriculum,
      tsc_number: "",
      manager:
        seed.org_scope === "Head office"
          ? "Central office leadership (demo)"
          : "Head of School",
      location:
        seed.org_scope === "Head office"
          ? "Central office (demo)"
          : demoSchools.find((s) => s.id === seed.school_id).campus,
      attendance: [],
      activity: [],
      qualifications: [],
    });
  }
}
state.health ||= {};
state.hub ||= sampleHubRecords();
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {}
}
const summary = (e) => {
  const last = [...e.attendance].sort(
    (a, b) => new Date(b.occurred_at) - new Date(a.occurred_at),
  )[0];
  return {
    ...e,
    attendance: [...e.attendance].sort(
      (a, b) => new Date(b.occurred_at) - new Date(a.occurred_at),
    ),
    qualification_count: e.qualifications.length,
    last_direction: last?.direction || "OUT",
    last_seen: last?.occurred_at || null,
  };
};
const log = (e, action) =>
  e.activity.unshift({
    id: eventId(),
    name: "Demo HR administrator",
    action,
    created_at: new Date().toISOString(),
  });
export async function demoPeopleApi(path, options = {}) {
  const method = options.method || "GET",
    data = options.body ? JSON.parse(options.body) : {};
  if (data.school_id) data.school_id = Number(data.school_id);
  if (data.org_scope === "Head office") {
    data.school_id = null;
    data.school = "KISC Head Office";
  } else if (data.school_id) {
    data.school_id = Number(data.school_id);
    data.school = demoSchools.find((s) => s.id === data.school_id)?.name;
  }
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "hub") {
    if (parts.length === 1) {
      if (method === "GET") return structuredClone(state.hub);
      const r = {
        ...data,
        id: Math.max(0, ...state.hub.map((r) => r.id)) + 1,
        state: "Draft",
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: "Demo HR administrator",
        acknowledged: false,
        acknowledgement_count: 0,
      };
      state.hub.unshift(r);
      save();
      return r;
    }
    const r = state.hub.find((r) => r.id === Number(parts[1]));
    if (!r) throw Error("Record not found.");
    if (r.version !== data.version)
      throw Error("Record changed. Refresh before saving.");
    if (parts[2] === "download") return { ok: true };
    if (parts[2] === "publish") {
      if (r.classification !== "Staff-ready" || data.reviewed !== true)
        throw Error(
          "Mark the record Staff-ready and complete the publication review.",
        );
      r.state = "Published";
      r.published_at = new Date().toISOString();
    } else if (parts[2] === "unpublish") {
      r.state = "Draft";
      r.version++;
      r.published_at = null;
    } else if (parts[2] === "acknowledge") {
      if (r.state !== "Published" || r.category !== "Policy")
        throw Error("Only published policies can be acknowledged.");
      if (!r.acknowledged) {
        r.acknowledged = true;
        r.acknowledgement_count++;
      }
    } else if (method === "PATCH") {
      Object.assign(r, data);
      r.version++;
      r.state = "Draft";
      r.acknowledged = false;
      r.acknowledgement_count = 0;
    }
    r.updated_at = new Date().toISOString();
    save();
    return structuredClone(r);
  }
  if (parts[0] === "employees" && parts[2] === "health") {
    const empty = {
      allergies: "",
      health_conditions: "",
      medications: "",
      workplace_adjustments: "",
      emergency_instructions: "",
      health_contact: "",
      reviewed_on: "",
      source_note: "",
      version: 0,
    };
    const old = state.health[parts[1]] || empty;
    if (method === "GET") return structuredClone(old);
    if (data.version !== old.version)
      throw Error("Health profile changed. Reload before saving.");
    if (data.profile.reviewed_on > day)
      throw Error("Review date cannot be in the future.");
    state.health[parts[1]] = {
      ...data.profile,
      version: old.version + 1,
      updated_at: new Date().toISOString(),
    };
    save();
    return { ok: true };
  }

  if (parts[0] === "employees") {
    if (parts.length === 1) {
      if (method === "POST") {
        if (state.employees.some((e) => e.email === data.email))
          throw Error("That work email is already registered.");
        const e = {
          ...fresh().employees[0],
          ...data,
          id: Math.max(...state.employees.map((e) => e.id)) + 1,
          staff_id: "KISC-DEMO-" + Date.now().toString().slice(-6),
          phone: "",
          bio: "",
          tsc_number: "",
          emergency_name: "",
          emergency_phone: "",
          qualifications: [],
          attendance: [],
          activity: [],
          start_date: day,
        };
        state.employees.push(e);
        save();
        return summary(e);
      }
      return state.employees
        .map(summary)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    const e = state.employees.find((e) => e.id === Number(parts[1]));
    if (!e) throw Error("Employee not found.");
    if (parts.length === 2) {
      if (method === "PATCH") {
        if (
          state.employees.some(
            (other) => other.id !== e.id && other.email === data.email,
          )
        )
          throw Error("That work email is already registered.");
        if (data.contract_end && data.contract_end < data.start_date)
          throw Error("Contract end cannot precede employment start.");
        Object.assign(e, data);
        e.school =
          data.org_scope === "Head office"
            ? "KISC Head Office"
            : demoSchools.find((s) => s.id === Number(data.school_id))?.name;
        log(e, "Employee: updated profile");
        save();
      }
      return structuredClone(summary(e));
    }
    if (parts[2] === "qualifications") {
      if (data.expires_on && data.expires_on < data.awarded_on)
        throw Error("Expiry cannot precede award date.");
      if (parts[3]) {
        const q = e.qualifications.find((q) => q.id === Number(parts[3]));
        if (!q) throw Error("Qualification not found.");
        Object.assign(q, data);
        log(e, "Qualification: updated " + data.category);
        save();
        return q;
      }
      if (
        e.qualifications.some(
          (q) => q.title === data.title && q.issuer === data.issuer,
        )
      )
        throw Error("This qualification already exists.");
      const q = { ...data, id: Date.now() };
      e.qualifications.unshift(q);
      log(e, "Qualification: added " + data.category);
      save();
      return q;
    }
    if (parts[2] === "attendance") {
      if (e.status === "Archived")
        throw Error("Archived employees cannot clock in or out.");
      const t = new Date(data.occurred_at);
      if (
        t > new Date(Date.now() + 300000) ||
        t < new Date(Date.now() - 31 * 86400000)
      )
        throw Error(
          "Use a timestamp within the last 31 days and no more than 5 minutes ahead.",
        );
      const last = [...e.attendance].sort(
        (a, b) => new Date(b.occurred_at) - new Date(a.occurred_at),
      )[0];
      if (
        (!last && data.direction === "OUT") ||
        last?.direction === data.direction
      )
        throw Error(
          data.direction === "IN"
            ? "Already clocked in."
            : "No open clock-in exists.",
        );
      if (last && t <= new Date(last.occurred_at))
        throw Error("Event time must follow the previous event.");
      const event = {
        ...data,
        id: eventId(),
        source: "Offline demo · manual",
      };
      e.attendance.push(event);
      log(e, "Attendance " + data.direction + " via offline demo");
      save();
      return { event };
    }
  }
  if (parts[0] === "devices") {
    if (method === "GET") return structuredClone(state.devices);
    if (parts.length === 1) {
      const d = { ...data, id: Date.now(), active: true, enrolled: 0 };
      state.devices.push(d);
      save();
      return { ...d, token: "DEMONSTRATION ONLY — not a device credential" };
    }
    const d = state.devices.find((d) => d.id === Number(parts[1]));
    if (!d) throw Error("Device not found.");
    if (parts[2] === "enrollments") {
      const e = state.employees.find((e) => e.id === Number(data.employee_id));
      if (e?.school_id !== Number(d.school_id))
        throw Error("Employee and device must belong to the same school.");
      d.bindings ||= [];
      if (
        d.bindings.some(
          (b) =>
            b.external_ref === data.external_ref ||
            b.employee_id === Number(data.employee_id),
        )
      )
        throw Error("This enrollment already exists.");
      d.bindings.push(data);
      d.enrolled = d.bindings.length;
      save();
      return { ok: true };
    }
    d.active = data.active;
    save();
    return d;
  }
  throw Error("This operation is not available in the offline preview.");
}
