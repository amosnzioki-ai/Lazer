import { z } from "zod";
import { randomBytes, createHash } from "node:crypto";
import { scoped } from "./policy.js";
import { organizationSeeds } from "../src/organization.js";
const editors = ["super_admin", "hr", "school_admin"];
const readers = [...editors, "principal", "manager"];
const digest = (t) => createHash("sha256").update(t).digest("hex");
const fail = (status, message) => Object.assign(new Error(message), { status });
const idSchema = z.coerce.number().int().positive();
export async function seedPeople(db, demo) {
  if (!demo) return;
  const employees = (
    await db.query(
      "SELECT * FROM employees WHERE staff_id ~ '^KISC-00[0-9]{2}$' ORDER BY id",
    )
  ).rows;
  for (const [e, i] of employees.map((e, i) => [e, i])) {
    if (!e.details_initialized) {
      await db.query(
        "UPDATE employees SET phone=$2,location=$3,manager='Head of School',employment_type=$4,tsc_number=$5,bio=$6,start_date=$7,details_initialized=true WHERE id=$1",
        [
          e.id,
          "DEMO-PHONE-" + String(i + 1).padStart(3, "0"),
          i % 7 === 5 ? "Athi River" : i % 7 === 6 ? "Syokimau" : "Kitengela",
          i % 5 === 0 ? "Fixed-term" : "Permanent",
          e.department === "Academics"
            ? "DEMO-TSC-" + String(i + 1).padStart(4, "0")
            : "",
          "Fictional staff profile for demonstrating KISC PeopleHub. No real personnel information.",
          "2022-01-10",
        ],
      );
      await db.query(
        "INSERT INTO qualifications(employee_id,title,issuer,category,awarded_on,expires_on,verified) VALUES($1,$2,'Demonstration University','Academic','2020-12-01',null,true),($1,'Safeguarding awareness','Demo Training Centre','Safeguarding','2026-01-12','2027-01-12',true) ON CONFLICT DO NOTHING",
        [
          e.id,
          e.department === "Academics"
            ? "Bachelor of Education"
            : "Professional diploma",
        ],
      );
    }
  }
  for (const e of organizationSeeds) {
    await db.query(
      "INSERT INTO employees(staff_id,name,email,title,department,school_id,curriculum,org_scope,staff_category,bio,details_initialized) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'Fictional organizational demonstration profile.',true) ON CONFLICT DO NOTHING",
      [
        "KISC-DEMO-" + e.key,
        e.name,
        e.name.toLowerCase().replaceAll(" ", ".") + "@example.test",
        e.title,
        e.department,
        e.school_id,
        e.org_scope === "Head office"
          ? "Not applicable"
          : e.school_id === 1 || e.school_id === 7
            ? "Cambridge / Pearson"
            : "CBE",
        e.org_scope,
        e.staff_category,
      ],
    );
  }
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
  }).format(new Date());
  for (const [e, i] of employees.slice(0, 9).map((e, i) => [e, i])) {
    const start = new Date(
      day + "T07:" + String(20 + i * 3).padStart(2, "0") + ":00+03:00",
    );
    if (start < new Date())
      await db.query(
        "INSERT INTO attendance_events(employee_id,direction,occurred_at,source,event_ref) VALUES($1,'IN',$2,'Demo seed',$3) ON CONFLICT DO NOTHING",
        [e.id, start, "demo-seed-" + day + "-" + e.id + "-in"],
      );
    if (i < 3) {
      const end = new Date(day + "T10:00:00+03:00");
      if (end < new Date())
        await db.query(
          "INSERT INTO attendance_events(employee_id,direction,occurred_at,source,event_ref) VALUES($1,'OUT',$2,'Demo seed',$3) ON CONFLICT DO NOTHING",
          [e.id, end, "demo-seed-" + day + "-" + e.id + "-out"],
        );
    }
  }
}
async function employeeFor(db, user, id, edit = false) {
  if (edit && !editors.includes(user.role))
    throw fail(403, "HR editing permission required.");
  if (!edit && !readers.includes(user.role) && user.employee_id !== id)
    throw fail(403, "Personnel profile access denied.");
  const e = (
    await db.query(
      "SELECT e.*,coalesce(s.name,'KISC Head Office') AS school FROM employees e LEFT JOIN schools s ON s.id=e.school_id WHERE e.id=$1",
      [id],
    )
  ).rows[0];
  if (!e) throw fail(404, "Employee not found.");
  if (scoped(user) && e.school_id !== user.school_id)
    throw fail(403, "This employee is outside your school.");
  return e;
}
export async function writeAttendance(
  db,
  {
    employeeId,
    direction,
    occurredAt,
    source,
    reason = "",
    deviceId = null,
    eventRef,
    userId = null,
  },
) {
  const c = await db.connect();
  try {
    await c.query("BEGIN");
    const e = (
      await c.query("SELECT id,status FROM employees WHERE id=$1 FOR UPDATE", [
        employeeId,
      ])
    ).rows[0];
    if (!e || e.status === "Archived")
      throw fail(409, "Employee is unavailable or archived.");
    const existing = (
      await c.query("SELECT * FROM attendance_events WHERE event_ref=$1", [
        eventRef,
      ])
    ).rows[0];
    if (existing) {
      if (
        existing.employee_id !== employeeId ||
        existing.direction !== direction ||
        new Date(existing.occurred_at).getTime() !==
          new Date(occurredAt).getTime() ||
        existing.device_id !== deviceId
      )
        throw fail(409, "Event reference already used for another event.");
      await c.query("COMMIT");
      return { event: existing, duplicate: true };
    }
    const last = (
      await c.query(
        "SELECT * FROM attendance_events WHERE employee_id=$1 ORDER BY occurred_at DESC,id DESC LIMIT 1",
        [employeeId],
      )
    ).rows[0];
    if (
      new Date(occurredAt).getTime() > Date.now() + 300000 ||
      new Date(occurredAt).getTime() < Date.now() - 31 * 86400000
    )
      throw fail(
        400,
        "Event must be within the last 31 days and not more than 5 minutes ahead.",
      );
    if ((!last && direction === "OUT") || last?.direction === direction)
      throw fail(
        409,
        direction === "IN"
          ? "Already clocked in. Record a clock-out first."
          : "No open clock-in exists.",
      );
    if (last && new Date(occurredAt) <= new Date(last.occurred_at))
      throw fail(409, "Event time must follow the previous attendance event.");
    const r = await c.query(
      "INSERT INTO attendance_events(employee_id,direction,occurred_at,source,reason,device_id,event_ref,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [
        employeeId,
        direction,
        occurredAt,
        source,
        reason,
        deviceId,
        eventRef,
        userId,
      ],
    );
    await c.query("INSERT INTO audit(user_id,action,entity) VALUES($1,$2,$3)", [
      userId,
      "Attendance " + direction + " via " + source,
      String(employeeId),
    ]);
    await c.query("COMMIT");
    return { event: r.rows[0], duplicate: false };
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
export function registerDeviceFeed(app, db) {
  app.post("/api/integrations/attendance", async (req, res) => {
    const token = req.get("authorization")?.replace(/^Bearer /, "");
    if (!token)
      return res.status(401).json({ error: "Device credentials required." });
    const device = (
      await db.query(
        "SELECT * FROM attendance_devices WHERE token_hash=$1 AND active=true",
        [digest(token)],
      )
    ).rows[0];
    if (!device)
      return res
        .status(401)
        .json({ error: "Device credentials invalid or revoked." });
    const d = z
      .object({
        external_ref: z.string().min(1).max(100),
        event_id: z.string().min(1).max(100),
        direction: z.enum(["IN", "OUT"]),
        occurred_at: z.iso.datetime({ offset: true }),
      })
      .strict()
      .parse(req.body);
    const binding = (
      await db.query(
        "SELECT b.employee_id FROM device_enrollments b JOIN employees e ON e.id=b.employee_id WHERE b.device_id=$1 AND b.external_ref=$2 AND e.school_id=$3",
        [device.id, d.external_ref, device.school_id],
      )
    ).rows[0];
    if (!binding)
      return res
        .status(403)
        .json({ error: "No authorized employee enrollment for this device." });
    const r = await writeAttendance(db, {
      employeeId: binding.employee_id,
      direction: d.direction,
      occurredAt: d.occurred_at,
      source: device.kind,
      deviceId: device.id,
      eventRef: "device:" + device.id + ":" + d.event_id,
    });
    res.status(r.duplicate ? 200 : 201).json(r);
  });
}
export function registerPeopleRoutes(app, db, audit) {
  app.get("/api/employees", async (req, res) => {
    if (
      !readers.includes(req.user.role) &&
      req.user.role !== "finance" &&
      req.user.role !== "employee"
    )
      return res
        .status(403)
        .json({ error: "Employee directory access denied." });
    res.json(
      (
        await db.query(
          `SELECT e.id,e.staff_id,e.name,e.email,e.title,e.department,e.school_id,e.status,e.start_date,e.curriculum,coalesce(s.name,'KISC Head Office') AS school,e.org_scope,e.staff_category,e.employment_type,coalesce(a.direction,'OUT') AS last_direction,a.occurred_at AS last_seen,(SELECT count(*)::int FROM qualifications q WHERE q.employee_id=e.id) AS qualification_count FROM employees e LEFT JOIN schools s ON s.id=e.school_id LEFT JOIN LATERAL(SELECT direction,occurred_at FROM attendance_events a WHERE a.employee_id=e.id ORDER BY occurred_at DESC,id DESC LIMIT 1)a ON true WHERE ($1::int IS NULL OR e.school_id=$1) AND ($2::int IS NULL OR e.id=$2) ORDER BY e.name`,
          [
            scoped(req.user) ? req.user.school_id : null,
            req.user.role === "employee" ? req.user.employee_id : null,
          ],
        )
      ).rows,
    );
  });
  app.get("/api/employees/:id", async (req, res) => {
    const id = idSchema.parse(req.params.id),
      e = await employeeFor(db, req.user, id);
    const [quals, events, activity] = await Promise.all([
      db.query(
        "SELECT * FROM qualifications WHERE employee_id=$1 ORDER BY awarded_on DESC",
        [id],
      ),
      db.query(
        "SELECT a.*,d.name AS device_name FROM attendance_events a LEFT JOIN attendance_devices d ON d.id=a.device_id WHERE employee_id=$1 ORDER BY occurred_at DESC,a.id DESC LIMIT 300",
        [id],
      ),
      db.query(
        "SELECT a.id,a.action,a.created_at,u.name FROM audit a LEFT JOIN users u ON u.id=a.user_id WHERE a.entity=$1 AND (a.action LIKE 'Employee:%' OR a.action LIKE 'Qualification:%' OR a.action LIKE 'Attendance %') ORDER BY a.id DESC LIMIT 40",
        [String(id)],
      ),
    ]);
    await audit(req.user.id, "Employee: viewed profile", String(id));
    res.json({
      ...e,
      last_direction: events.rows[0]?.direction || "OUT",
      last_seen: events.rows[0]?.occurred_at || null,
      qualifications: quals.rows,
      attendance: events.rows,
      activity: activity.rows,
    });
  });
  const profile = z.object({
    name: z.string().trim().min(3).max(100),
    email: z.email(),
    title: z.string().min(2).max(100),
    department: z.string().min(2).max(80),
    school_id: idSchema.nullable(),
    org_scope: z.enum(["School", "Head office"]).default("School"),
    staff_category: z.enum(["Teaching", "Support", "Leadership"]).optional(),
    phone: z.string().max(40),
    location: z.string().max(100),
    employment_type: z.enum([
      "Permanent",
      "Fixed-term",
      "Casual",
      "Consultant",
    ]),
    manager: z.string().max(100),
    emergency_name: z.string().max(100),
    emergency_phone: z.string().max(40),
    tsc_number: z.string().max(60),
    bio: z.string().max(1000),
    start_date: z.iso.date(),
    contract_end: z.iso.date().nullable(),
    status: z.enum(["Active", "Probation", "On leave", "Archived"]),
    curriculum: z.string().min(2).max(80),
  });
  app.patch("/api/employees/:id", async (req, res) => {
    const id = idSchema.parse(req.params.id);
    await employeeFor(db, req.user, id, true);
    const d = profile.parse(req.body);
    if (d.org_scope === "Head office" && d.school_id !== null)
      throw fail(400, "Head office staff must have no school assignment.");
    if (d.org_scope === "School" && d.school_id === null)
      throw fail(400, "Select the employee school.");
    if (
      d.org_scope === "Head office" &&
      !["super_admin", "hr"].includes(req.user.role)
    )
      throw fail(403, "Only central HR can assign head office staff.");

    if (scoped(req.user) && d.school_id !== req.user.school_id)
      throw fail(403, "School transfer requires central HR.");
    if (d.contract_end && d.contract_end < d.start_date)
      throw fail(400, "Contract end cannot precede employment start.");
    const c = await db.connect();
    try {
      await c.query("BEGIN");
      const keys = Object.keys(d).filter((k) => d[k] !== undefined);
      const result = await c.query(
        "UPDATE employees SET " +
          keys.map((key, i) => key + "=$" + (i + 2)).join(",") +
          " WHERE id=$1 RETURNING id",
        [id, ...keys.map((k) => d[k])],
      );
      if (d.status === "Archived") {
        await c.query("UPDATE users SET active=false WHERE employee_id=$1", [
          id,
        ]);
        await c.query(
          "DELETE FROM sessions WHERE user_id IN(SELECT id FROM users WHERE employee_id=$1)",
          [id],
        );
        await c.query("DELETE FROM device_enrollments WHERE employee_id=$1", [
          id,
        ]);
      }
      await c.query(
        "INSERT INTO audit(user_id,action,entity) VALUES($1,$2,$3)",
        [req.user.id, "Employee: updated profile", String(id)],
      );
      await c.query("COMMIT");
      res.json(result.rows[0]);
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  });
  app.post("/api/employees/:id/qualifications", async (req, res) => {
    const id = idSchema.parse(req.params.id);
    await employeeFor(db, req.user, id, true);
    const d = z
      .object({
        title: z.string().min(3).max(150),
        issuer: z.string().min(3).max(150),
        category: z.enum([
          "Academic",
          "Professional",
          "TSC",
          "Safeguarding",
          "Other",
        ]),
        awarded_on: z.iso.date(),
        expires_on: z.iso.date().nullable(),
        verified: z.boolean(),
      })
      .parse(req.body);
    if (d.expires_on && d.expires_on < d.awarded_on)
      throw fail(400, "Expiry cannot precede award date.");
    const r = await db.query(
      "INSERT INTO qualifications(employee_id,title,issuer,category,awarded_on,expires_on,verified) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [
        id,
        d.title,
        d.issuer,
        d.category,
        d.awarded_on,
        d.expires_on,
        d.verified,
      ],
    );
    await audit(req.user.id, "Qualification: added " + d.category, String(id));
    res.status(201).json(r.rows[0]);
  });
  app.patch(
    "/api/employees/:id/qualifications/:qualificationId",
    async (req, res) => {
      const id = idSchema.parse(req.params.id);
      await employeeFor(db, req.user, id, true);
      const d = z
        .object({
          title: z.string().min(3).max(150),
          issuer: z.string().min(3).max(150),
          category: z.enum([
            "Academic",
            "Professional",
            "TSC",
            "Safeguarding",
            "Other",
          ]),
          awarded_on: z.iso.date(),
          expires_on: z.iso.date().nullable(),
          verified: z.boolean(),
        })
        .parse(req.body);
      if (d.expires_on && d.expires_on < d.awarded_on)
        throw fail(400, "Expiry cannot precede award date.");
      const r = await db.query(
        "UPDATE qualifications SET title=$1,issuer=$2,category=$3,awarded_on=$4,expires_on=$5,verified=$6 WHERE id=$7 AND employee_id=$8 RETURNING *",
        [
          d.title,
          d.issuer,
          d.category,
          d.awarded_on,
          d.expires_on,
          d.verified,
          idSchema.parse(req.params.qualificationId),
          id,
        ],
      );
      if (!r.rowCount)
        throw fail(404, "Qualification not found for this employee.");
      await audit(
        req.user.id,
        "Qualification: updated " + d.category,
        String(id),
      );
      res.json(r.rows[0]);
    },
  );
  app.post("/api/employees/:id/attendance", async (req, res) => {
    const id = idSchema.parse(req.params.id);
    await employeeFor(db, req.user, id, true);
    const d = z
      .object({
        direction: z.enum(["IN", "OUT"]),
        occurred_at: z.iso.datetime({ offset: true }),
        reason: z.string().min(5).max(300),
        event_id: z.string().min(8).max(100),
      })
      .strict()
      .parse(req.body);
    const r = await writeAttendance(db, {
      employeeId: id,
      direction: d.direction,
      occurredAt: d.occurred_at,
      source: "HR manual",
      reason: d.reason,
      eventRef: "manual:" + d.event_id,
      userId: req.user.id,
    });
    res.status(r.duplicate ? 200 : 201).json(r);
  });
  app.get("/api/devices", async (req, res) => {
    if (!editors.includes(req.user.role))
      throw fail(403, "HR device management permission required.");
    res.json(
      (
        await db.query(
          "SELECT d.id,d.name,d.school_id,d.kind,d.active,d.created_at,max(a.created_at) AS last_event,count(DISTINCT b.employee_id)::int AS enrolled FROM attendance_devices d LEFT JOIN device_enrollments b ON b.device_id=d.id LEFT JOIN attendance_events a ON a.device_id=d.id WHERE ($1::int IS NULL OR d.school_id=$1) GROUP BY d.id ORDER BY d.id",
          [scoped(req.user) ? req.user.school_id : null],
        )
      ).rows,
    );
  });
  app.post("/api/devices", async (req, res) => {
    if (!editors.includes(req.user.role))
      throw fail(403, "HR device management permission required.");
    const d = z
      .object({
        name: z.string().min(3).max(100),
        school_id: idSchema,
        kind: z.enum([
          "Fingerprint terminal",
          "Door access",
          "CCTV vendor identity",
        ]),
      })
      .parse(req.body);
    if (scoped(req.user) && d.school_id !== req.user.school_id)
      throw fail(403, "Device school access denied.");
    const token = randomBytes(32).toString("hex");
    const r = await db.query(
      "INSERT INTO attendance_devices(name,school_id,kind,token_hash) VALUES($1,$2,$3,$4) RETURNING id,name,school_id,kind,active",
      [d.name, d.school_id, d.kind, digest(token)],
    );
    await audit(req.user.id, "Device: registered", String(r.rows[0].id));
    res.status(201).json({ ...r.rows[0], token });
  });
  app.post("/api/devices/:id/enrollments", async (req, res) => {
    if (!editors.includes(req.user.role))
      throw fail(403, "HR device management permission required.");
    const id = idSchema.parse(req.params.id);
    const d = z
      .object({
        employee_id: idSchema,
        external_ref: z.string().min(1).max(100),
      })
      .parse(req.body);
    const e = await employeeFor(db, req.user, d.employee_id, true);
    const device = (
      await db.query("SELECT * FROM attendance_devices WHERE id=$1", [id])
    ).rows[0];
    if (!device || device.school_id !== e.school_id)
      throw fail(403, "Employee and device must belong to the same school.");
    await db.query(
      "INSERT INTO device_enrollments(device_id,external_ref,employee_id) VALUES($1,$2,$3)",
      [id, d.external_ref, d.employee_id],
    );
    await audit(req.user.id, "Device: enrolled employee", String(e.id));
    res.status(201).json({ ok: true });
  });
  app.patch("/api/devices/:id", async (req, res) => {
    if (!editors.includes(req.user.role))
      throw fail(403, "HR device management permission required.");
    const id = idSchema.parse(req.params.id),
      active = z.boolean().parse(req.body.active);
    const r = await db.query(
      "UPDATE attendance_devices SET active=$1 WHERE id=$2 AND ($3::int IS NULL OR school_id=$3) RETURNING id,active",
      [active, id, scoped(req.user) ? req.user.school_id : null],
    );
    if (!r.rowCount) throw fail(404, "Device not found in your scope.");
    await audit(
      req.user.id,
      "Device: " + (active ? "enabled" : "revoked"),
      String(id),
    );
    res.json(r.rows[0]);
  });
}
