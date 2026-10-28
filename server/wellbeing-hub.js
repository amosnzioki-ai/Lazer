import { sampleHubRecords } from "../src/hub-model.js";
import { z } from "zod";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
const admins = ["super_admin", "hr", "school_admin"];
const central = ["super_admin", "hr"];
const error = (status, message) =>
  Object.assign(new Error(message), { status });
const key = () => {
  const value = process.env.HEALTH_DATA_KEY;
  if (!/^[a-f0-9]{64}$/i.test(value || ""))
    throw error(503, "Health profile encryption is not configured.");
  return Buffer.from(value, "hex");
};
export function encryptHealth(data) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);
  return JSON.stringify({
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    body: body.toString("base64"),
  });
}
export function decryptHealth(data) {
  const encoded = JSON.parse(data),
    cipher = createDecipheriv(
      "aes-256-gcm",
      key(),
      Buffer.from(encoded.iv, "base64"),
    );
  cipher.setAuthTag(Buffer.from(encoded.tag, "base64"));
  return JSON.parse(
    Buffer.concat([
      cipher.update(Buffer.from(encoded.body, "base64")),
      cipher.final(),
    ]).toString("utf8"),
  );
}
const isAdmin = (u) => admins.includes(u.role);
const scope = (u, r) =>
  central.includes(u.role) ||
  (u.role === "school_admin" &&
    u.school_id !== null &&
    r.school_id === u.school_id);
const staffCan = (u, r) =>
  [
    "super_admin",
    "hr",
    "school_admin",
    "principal",
    "manager",
    "finance",
    "recruiter",
    "employee",
  ].includes(u.role) &&
  r.state === "Published" &&
  (r.school_id === null || r.school_id === u.school_id);
const canRead = (u, r) => scope(u, r) || staffCan(u, r);
const text = z.string().trim().max(1200);
const healthSchema = z
  .object({
    allergies: text,
    health_conditions: text,
    medications: text,
    workplace_adjustments: text,
    emergency_instructions: text,
    health_contact: text,
    reviewed_on: z.iso.date(),
    source_note: z.string().trim().min(5).max(500),
  })
  .strict();
const categories = [
  "Report",
  "Minutes",
  "Meeting",
  "Action",
  "Decision",
  "Notice",
  "Policy",
];
const recordSchema = z
  .object({
    category: z.enum(categories),
    title: z.string().trim().min(4).max(180),
    body: z.string().trim().min(10).max(10000),
    school_id: z.coerce.number().int().min(1).max(7).nullable(),
    classification: z.enum(["Confidential", "Staff-ready"]),
    due_on: z.iso.date().nullable(),
    starts_at: z.iso.datetime({ offset: true }).nullable(),
    venue: z.string().max(160),
    owner: z.string().max(100),
    workflow_state: z.enum(["Open", "In progress", "Completed"]),
  })
  .strict();
export function registerWellbeingHub(app, db) {
  app.get("/api/employees/:id/health", async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    if (!central.includes(req.user.role) && req.user.employee_id !== id)
      throw error(
        403,
        "Health profiles are restricted to central HR and the employee concerned.",
      );
    const employee = (
      await db.query("SELECT id FROM employees WHERE id=$1", [id])
    ).rows[0];
    if (!employee) throw error(404, "Employee not found.");
    const r = (
      await db.query("SELECT * FROM employee_health WHERE employee_id=$1", [id])
    ).rows[0];
    await db.query(
      "INSERT INTO audit(user_id,action,entity) VALUES($1,$2,$3)",
      [req.user.id, "Health profile: viewed confidential record", String(id)],
    );
    res.set("Cache-Control", "no-store");
    res.json(
      r
        ? {
            ...decryptHealth(r.payload),
            version: r.version,
            updated_at: r.updated_at,
          }
        : {
            allergies: "",
            health_conditions: "",
            medications: "",
            workplace_adjustments: "",
            emergency_instructions: "",
            health_contact: "",
            reviewed_on: "",
            source_note: "",
            version: 0,
          },
    );
  });
  app.put("/api/employees/:id/health", async (req, res) => {
    if (!central.includes(req.user.role))
      throw error(403, "Only central HR can update health profiles.");
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = z
      .object({ version: z.number().int().min(0), profile: healthSchema })
      .strict()
      .parse(req.body);
    if (
      body.profile.reviewed_on >
      new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(
        new Date(),
      )
    )
      throw error(400, "Review date cannot be in the future.");
    const c = await db.connect();
    try {
      await c.query("BEGIN");
      const e = (
        await c.query("SELECT id FROM employees WHERE id=$1 FOR UPDATE", [id])
      ).rows[0];
      if (!e) throw error(404, "Employee not found.");
      const old = (
        await c.query(
          "SELECT version FROM employee_health WHERE employee_id=$1",
          [id],
        )
      ).rows[0];
      if ((old?.version || 0) !== body.version)
        throw error(409, "Health profile changed. Reload before saving.");
      const payload = encryptHealth(body.profile);
      await c.query(
        "INSERT INTO employee_health(employee_id,payload,version,updated_by) VALUES($1,$2,1,$3) ON CONFLICT(employee_id) DO UPDATE SET payload=$2,version=employee_health.version+1,updated_by=$3,updated_at=now()",
        [id, payload, req.user.id],
      );
      await c.query(
        "INSERT INTO audit(user_id,action,entity) VALUES($1,$2,$3)",
        [
          req.user.id,
          "Health profile: updated confidential record",
          String(id),
        ],
      );
      await c.query("COMMIT");
      res.set("Cache-Control", "no-store");
      res.json({ ok: true });
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  });
  app.get("/api/hub", async (req, res) => {
    if (req.user.role === "enko")
      throw error(
        403,
        "Group oversight does not include the staff communications workspace.",
      );
    const rows = (
      await db.query(
        "SELECT h.*,u.name AS author,EXISTS(SELECT 1 FROM hub_acknowledgements a WHERE a.record_id=h.id AND a.user_id=$1 AND a.version=h.version) AS acknowledged,(SELECT count(*)::int FROM hub_acknowledgements a WHERE a.record_id=h.id AND a.version=h.version) AS acknowledgement_count FROM hub_records h LEFT JOIN users u ON u.id=h.created_by ORDER BY h.updated_at DESC,h.id DESC",
        [req.user.id],
      )
    ).rows.filter((r) => canRead(req.user, r));
    res.set("Cache-Control", "no-store");
    res.json(
      rows.map((r) => {
        if (!scope(req.user, r)) {
          delete r.created_by;
          delete r.acknowledgement_count;
        }
        return r;
      }),
    );
  });
  app.get("/api/hub/:id", async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id),
      r = (await db.query("SELECT * FROM hub_records WHERE id=$1", [id]))
        .rows[0];
    if (!r || !canRead(req.user, r))
      throw error(404, "Record is not available in your staff audience.");
    await db.query(
      "INSERT INTO audit(user_id,action,entity) VALUES($1,$2,$3)",
      [req.user.id, "Hub: viewed " + r.category, String(id)],
    );
    res.set("Cache-Control", "no-store");
    res.json(r);
  });
  app.post("/api/hub/:id/download", async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id),
      d = z
        .object({ version: z.number().int().positive() })
        .strict()
        .parse(req.body),
      r = (await db.query("SELECT * FROM hub_records WHERE id=$1", [id]))
        .rows[0];
    if (!r || !canRead(req.user, r))
      throw error(404, "Record is not available in your staff audience.");
    if (r.version !== d.version)
      throw error(409, "Record changed. Reload before downloading.");
    await db.query(
      "INSERT INTO audit(user_id,action,entity) VALUES($1,$2,$3)",
      [
        req.user.id,
        "Hub: downloaded " + r.category + " version " + r.version,
        String(id),
      ],
    );
    res.json({ ok: true });
  });
  app.post("/api/hub", async (req, res) => {
    if (!isAdmin(req.user))
      throw error(403, "Administrator permission required.");
    const d = recordSchema.parse(req.body);
    if (d.category === "Meeting" && !d.starts_at)
      throw error(400, "A scheduled meeting needs a start time.");
    if (!central.includes(req.user.role) && d.school_id !== req.user.school_id)
      throw error(
        403,
        "School administrators can create records only for their school.",
      );
    const c = await db.connect();
    try {
      await c.query("BEGIN");
      const r = (
        await c.query(
          "INSERT INTO hub_records(category,title,body,school_id,classification,due_on,starts_at,venue,owner,workflow_state,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *",
          [
            d.category,
            d.title,
            d.body,
            d.school_id,
            d.classification,
            d.due_on,
            d.starts_at,
            d.venue,
            d.owner,
            d.workflow_state,
            req.user.id,
          ],
        )
      ).rows[0];
      await c.query(
        "INSERT INTO audit(user_id,action,entity) VALUES($1,$2,$3)",
        [req.user.id, "Hub: created draft " + d.category, String(r.id)],
      );
      await c.query("COMMIT");
      res.status(201).json(r);
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  });
  app.patch("/api/hub/:id", async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const { version, ...data } = z
      .object({ version: z.number().int().positive(), ...recordSchema.shape })
      .strict()
      .parse(req.body);
    const d = recordSchema.parse(data);
    if (d.category === "Meeting" && !d.starts_at)
      throw error(400, "A scheduled meeting needs a start time.");
    const c = await db.connect();
    try {
      await c.query("BEGIN");
      const old = (
        await c.query("SELECT * FROM hub_records WHERE id=$1 FOR UPDATE", [id])
      ).rows[0];
      if (!old || !scope(req.user, old))
        throw error(403, "Record editing permission denied.");
      if (
        !central.includes(req.user.role) &&
        d.school_id !== req.user.school_id
      )
        throw error(403, "Cannot move a record outside your school.");
      if (old.version !== version)
        throw error(409, "Record changed. Refresh before saving.");
      const r = (
        await c.query(
          "UPDATE hub_records SET category=$2,title=$3,body=$4,school_id=$5,classification=$6,due_on=$7,starts_at=$8,venue=$9,owner=$10,workflow_state=$11,state='Draft',version=version+1,published_by=null,published_at=null,updated_at=now() WHERE id=$1 RETURNING *",
          [
            id,
            d.category,
            d.title,
            d.body,
            d.school_id,
            d.classification,
            d.due_on,
            d.starts_at,
            d.venue,
            d.owner,
            d.workflow_state,
          ],
        )
      ).rows[0];
      await c.query(
        "INSERT INTO audit(user_id,action,entity) VALUES($1,$2,$3)",
        [req.user.id, "Hub: edited and returned to draft", String(id)],
      );
      await c.query("COMMIT");
      res.json(r);
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  });
  for (const action of ["publish", "unpublish"])
    app.post("/api/hub/:id/" + action, async (req, res) => {
      const id = z.coerce.number().int().positive().parse(req.params.id),
        d = z
          .object({
            version: z.number().int().positive(),
            reviewed: z.boolean().optional(),
          })
          .strict()
          .parse(req.body);
      const c = await db.connect();
      try {
        await c.query("BEGIN");
        const old = (
          await c.query("SELECT * FROM hub_records WHERE id=$1 FOR UPDATE", [
            id,
          ])
        ).rows[0];
        if (!old || !scope(req.user, old))
          throw error(403, "Publication permission denied.");
        if (old.version !== d.version)
          throw error(409, "Record changed. Refresh before publishing.");
        if (
          action === "publish" &&
          (old.classification !== "Staff-ready" || d.reviewed !== true)
        )
          throw error(
            400,
            "Mark the record Staff-ready and confirm a privacy review before publishing.",
          );
        if (old.state === (action === "publish" ? "Published" : "Draft"))
          throw error(409, "Record is already in that state.");
        const r = (
          await c.query(
            action === "publish"
              ? "UPDATE hub_records SET state='Published',published_by=$2,published_at=now(),updated_at=now() WHERE id=$1 RETURNING *"
              : "UPDATE hub_records SET state='Draft',version=version+1,published_by=null,published_at=null,updated_at=now() WHERE id=$1 RETURNING *",
            [id, ...(action === "publish" ? [req.user.id] : [])],
          )
        ).rows[0];
        await c.query(
          "INSERT INTO audit(user_id,action,entity) VALUES($1,$2,$3)",
          [req.user.id, "Hub: " + action + " " + old.category, String(id)],
        );
        await c.query("COMMIT");
        res.json(r);
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    });
  app.post("/api/hub/:id/acknowledge", async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id),
      d = z
        .object({ version: z.number().int().positive() })
        .strict()
        .parse(req.body);
    const c = await db.connect();
    try {
      await c.query("BEGIN");
      const record = (
        await c.query("SELECT * FROM hub_records WHERE id=$1 FOR SHARE", [id])
      ).rows[0];
      if (
        !record ||
        record.category !== "Policy" ||
        !staffCan(req.user, record)
      )
        throw error(403, "This published policy is not available to you.");
      if (record.version !== d.version)
        throw error(409, "Policy changed. Read the latest version.");
      await c.query(
        "INSERT INTO hub_acknowledgements(record_id,user_id,version) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
        [id, req.user.id, d.version],
      );
      await c.query(
        "INSERT INTO audit(user_id,action,entity) VALUES($1,$2,$3)",
        [
          req.user.id,
          "Hub: acknowledged policy version " + d.version,
          String(id),
        ],
      );
      await c.query("COMMIT");
      res.json({ ok: true });
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  });
}

export async function seedHub(db, demo) {
  if (!demo) return;
  const creator = (
    await db.query(
      "SELECT id FROM users WHERE role='super_admin' ORDER BY id LIMIT 1",
    )
  ).rows[0];
  for (const r of sampleHubRecords())
    await db.query(
      "INSERT INTO hub_records(category,title,body,classification,state,school_id,due_on,starts_at,venue,owner,workflow_state,created_by,published_by,published_at,seed_key) VALUES($1,$2,$3,$4,$5,null,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT DO NOTHING",
      [
        r.category,
        r.title,
        r.body,
        r.classification,
        r.state,
        r.due_on,
        r.starts_at,
        r.venue,
        r.owner,
        r.workflow_state,
        creator?.id || null,
        r.state === "Published" ? creator?.id || null : null,
        r.state === "Published" ? new Date() : null,
        r.seed_key,
      ],
    );
}
