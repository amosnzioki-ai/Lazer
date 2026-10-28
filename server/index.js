import { registerWellbeingHub, seedHub } from "./wellbeing-hub.js";
import "dotenv/config";
import express from "express";
import pg from "pg";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { randomBytes, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { permits, scoped, weekdays, roles } from "./policy.js";
import {
  seedPeople,
  registerPeopleRoutes,
  registerDeviceFeed,
} from "./people.js";
const app = express(),
  db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const demo = process.env.DEMO_MODE === "true";
if (process.env.NODE_ENV === "production" && demo)
  throw Error("Demo mode is forbidden in production");
await db.query(
  await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
);
const schools = [
  ["International School", "Kitengela", "Cambridge / Pearson"],
  ["Main Primary Kitengela", "Kitengela", "CBE"],
  ["Junior School", "Kitengela", "CBE"],
  ["Senior Girls", "Kitengela", "CBE"],
  ["Senior Boys", "Kitengela", "CBE"],
  ["Athi River", "Athi River", "CBE"],
  ["Syokimau", "Syokimau", "Cambridge / Pearson"],
];
for (const s of schools)
  await db.query(
    "INSERT INTO schools(name,campus,curriculum) VALUES($1,$2,$3) ON CONFLICT(name) DO NOTHING",
    s,
  );
if (demo && !(await db.query("SELECT 1 FROM employees LIMIT 1")).rowCount) {
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
  for (let i = 0; i < names.length; i++)
    await db.query(
      "INSERT INTO employees(staff_id,name,email,title,department,school_id,curriculum) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [
        "KISC-" + String(i + 1).padStart(4, "0"),
        names[i],
        names[i].toLowerCase().replace(" ", ".") + "@example.test",
        [
          "Mathematics Teacher",
          "English Teacher",
          "HR Officer",
          "Science Teacher",
          "Finance Officer",
          "School Principal",
          "ICT Specialist",
        ][i % 7],
        [
          "Academics",
          "Academics",
          "Human Resources",
          "Academics",
          "Finance",
          "Leadership",
          "Operations",
        ][i % 7],
        (i % 7) + 1,
        schools[i % 7][2],
      ],
    );
  for (const [module, title, school] of [
    ["Recruitment", "Mathematics teacher · Cambridge", 1],
    ["Recruitment", "School nurse · Athi River", 6],
    ["Contracts", "Review fixed-term contract renewal", 2],
    ["Training", "Annual safeguarding refresher", 3],
    ["Qualifications", "TSC registration verification", 1],
    ["Onboarding", "New staff induction checklist", 4],
    ["Assets", "Laptop assignment · ICT department", 7],
    ["Performance", "Term 3 development review", 5],
    ["Helpdesk", "Update emergency contact details", 2],
  ])
    await db.query(
      "INSERT INTO records(module,title,school_id,due_date,details) VALUES($1,$2,$3,CURRENT_DATE+14,'Fictional demonstration record. Assign an owner and confirm supporting documentation.')",
      [module, title, school],
    );
  await db.query(
    "INSERT INTO leave_requests(employee_id,type,start_date,end_date,days,reason) VALUES(1,'Annual leave',CURRENT_DATE+3,CURRENT_DATE+3,1,'Personal appointment'),(3,'Study leave',CURRENT_DATE+7,CURRENT_DATE+8,2,'Professional development examination')",
  );
}
if (demo || !(await db.query("SELECT 1 FROM users LIMIT 1")).rowCount) {
  if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 12)
    throw Error("Set SEED_PASSWORD to at least 12 characters");
  const hash = await bcrypt.hash(process.env.SEED_PASSWORD, 12);
  const initialUsers = demo
    ? [
        ["super_admin", "Alex Morgan", null, null],
        ["school_admin", "School Administrator", 1, null],
        ["employee", "Amara Wanjiku", 1, 1],
        ["enko", "Enko Oversight", null, null],
        ["finance", "Finance Officer", null, null],
        ["recruiter", "Recruitment Officer", null, null],
        ["hr", "Head Office HR", null, null],
        ["principal", "School Principal", 1, null],
        ["manager", "Department Manager", 1, null],
      ]
    : [["super_admin", "Initial Administrator", null, null]];
  for (const [role, name, school, emp] of initialUsers)
    await db.query(
      "INSERT INTO users(email,password_hash,name,role,school_id,employee_id) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(email) DO NOTHING",
      [role + "@example.test", hash, name, role, school, emp],
    );
}
await seedPeople(db, demo);
await seedHub(db, demo);
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use("/api", (req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.get("origin")) {
    try {
      if (new URL(req.get("origin")).host !== req.get("host"))
        return res.status(403).json({ error: "Cross-origin request denied." });
    } catch {
      return res.status(403).json({ error: "Invalid request origin." });
    }
  }
  next();
});

app.use("/api", rateLimit({ windowMs: 60000, limit: 300 }));
const hash = (t) => createHash("sha256").update(t).digest("hex");
const audit = (u, a, e) =>
  db.query("INSERT INTO audit(user_id,action,entity) VALUES($1,$2,$3)", [
    u,
    a,
    e,
  ]);
app.get("/api/health", async (req, res) => {
  await db.query("SELECT 1");
  res.json({ status: "ok", demo });
});
app.post(
  "/api/login",
  rateLimit({ windowMs: 900000, limit: 20 }),
  async (req, res) => {
    const u = (
      await db.query("SELECT * FROM users WHERE email=$1 AND active=true", [
        String(req.body.email).toLowerCase(),
      ])
    ).rows[0];
    if (
      !u ||
      !(await bcrypt.compare(String(req.body.password), u.password_hash))
    )
      return res.status(401).json({ error: "Email or password is incorrect." });
    const token = randomBytes(32).toString("hex");
    await db.query(
      "INSERT INTO sessions VALUES($1,$2,now()+interval '8 hours')",
      [hash(token), u.id],
    );
    await audit(u.id, "Signed in", "session");
    res
      .cookie("session", token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 28800000,
      })
      .json({ ok: true });
  },
);
registerDeviceFeed(app, db);
app.use("/api", async (req, res, next) => {
  const u = (
    await db.query(
      "SELECT u.id,u.name,u.email,u.role,u.school_id,u.employee_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active=true",
      [hash(req.cookies.session || "")],
    )
  ).rows[0];
  if (!u) return res.status(401).json({ error: "Please sign in to continue." });
  req.user = u;
  if (
    !["GET", "HEAD"].includes(req.method) &&
    req.get("x-peoplehub-request") !== "1"
  )
    return res.status(403).json({ error: "Request validation failed." });
  next();
});
const allow = (r) => (req, res, next) =>
  permits(req.user, r)
    ? next()
    : res.status(403).json({ error: "Your role does not permit this action." });
app.get("/api/me", (req, res) =>
  res.json({ ...req.user, permissions: roles[req.user.role], demo }),
);
app.post("/api/logout", async (req, res) => {
  await db.query("DELETE FROM sessions WHERE token_hash=$1", [
    hash(req.cookies.session || ""),
  ]);
  res.clearCookie("session").json({ ok: true });
});
app.get("/api/schools", async (req, res) =>
  res.json(
    (
      await db.query(
        "SELECT s.*,count(e.id)::int AS headcount FROM schools s LEFT JOIN employees e ON e.school_id=s.id WHERE ($1::int IS NULL OR s.id=$1) GROUP BY s.id ORDER BY s.id",
        [scoped(req.user) ? req.user.school_id : null],
      )
    ).rows,
  ),
);
const employeeSchema = z.object({
  name: z.string().trim().min(3).max(100),
  email: z.email(),
  title: z.string().min(2).max(100),
  department: z.string().min(2).max(80),
  school_id: z.coerce.number().int().min(1).max(7).nullable(),
  org_scope: z.enum(["School", "Head office"]).default("School"),
  staff_category: z.enum(["Teaching", "Support", "Leadership"]).optional(),
  curriculum: z.string().min(2).max(80),
});
app.post("/api/employees", allow("employees"), async (req, res) => {
  if (!["super_admin", "hr", "school_admin"].includes(req.user.role))
    return res
      .status(403)
      .json({ error: "Employee creation requires HR access." });
  const d = employeeSchema.parse(req.body);
  if (d.org_scope === "School" && d.school_id === null)
    return res.status(400).json({ error: "Select a school for school staff." });
  if (d.org_scope === "Head office" && d.school_id !== null)
    return res
      .status(400)
      .json({ error: "Head office staff must have no school assignment." });
  if (
    d.org_scope === "Head office" &&
    !["super_admin", "hr"].includes(req.user.role)
  )
    return res
      .status(403)
      .json({ error: "Only central HR can create head office staff." });

  if (scoped(req.user) && d.school_id !== req.user.school_id)
    return res.status(403).json({ error: "School access denied." });
  const id = "KISC-" + randomBytes(4).toString("hex").toUpperCase();
  const r = await db.query(
    "INSERT INTO employees(staff_id,name,email,title,department,school_id,curriculum,org_scope,staff_category) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
    [
      id,
      d.name,
      d.email,
      d.title,
      d.department,
      d.school_id,
      d.curriculum,
      d.org_scope,
      d.staff_category ||
        (d.department === "Academics"
          ? "Teaching"
          : d.department === "Leadership"
            ? "Leadership"
            : "Support"),
    ],
  );
  await audit(req.user.id, "Created employee", id);
  res.status(201).json(r.rows[0]);
});
registerPeopleRoutes(app, db, audit);
registerWellbeingHub(app, db);
app.get("/api/leave", allow("leave"), async (req, res) =>
  res.json(
    (
      await db.query(
        "SELECT l.*,e.name,e.school_id,coalesce(s.name,'KISC Head Office') AS school FROM leave_requests l JOIN employees e ON e.id=l.employee_id LEFT JOIN schools s ON s.id=e.school_id WHERE ($1::int IS NULL OR e.school_id=$1) AND ($2::int IS NULL OR e.id=$2) ORDER BY l.created_at DESC",
        [
          scoped(req.user) ? req.user.school_id : null,
          req.user.role === "employee" ? req.user.employee_id : null,
        ],
      )
    ).rows,
  ),
);
app.post("/api/leave", allow("leave"), async (req, res) => {
  const d = z
    .object({
      employee_id: z.coerce.number().int().positive(),
      type: z.enum([
        "Annual leave",
        "Sick leave",
        "Study leave",
        "Maternity leave",
        "Paternity leave",
        "Unpaid leave",
      ]),
      start_date: z.iso.date(),
      end_date: z.iso.date(),
      reason: z.string().min(5).max(1000),
    })
    .parse(req.body);
  if (
    d.end_date < d.start_date ||
    weekdays(d.start_date, d.end_date) < 1 ||
    weekdays(d.start_date, d.end_date) > 260
  )
    return res
      .status(400)
      .json({ error: "Choose a valid date range with 1–260 working days." });
  const e = (
    await db.query("SELECT * FROM employees WHERE id=$1", [d.employee_id])
  ).rows[0];
  if (
    !e ||
    (scoped(req.user) && e.school_id !== req.user.school_id) ||
    (req.user.role === "employee" && e.id !== req.user.employee_id)
  )
    return res.status(403).json({ error: "Employee access denied." });
  const r = await db.query(
    "INSERT INTO leave_requests(employee_id,type,start_date,end_date,days,reason) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
    [
      d.employee_id,
      d.type,
      d.start_date,
      d.end_date,
      weekdays(d.start_date, d.end_date),
      d.reason,
    ],
  );
  await audit(req.user.id, "Requested leave", String(r.rows[0].id));
  res.status(201).json(r.rows[0]);
});
app.patch("/api/leave/:id", allow("leave"), async (req, res) => {
  if (
    !["super_admin", "hr", "school_admin", "principal", "manager"].includes(
      req.user.role,
    )
  )
    return res.status(403).json({ error: "Approval permission required." });
  const status = z.enum(["Approved", "Rejected"]).parse(req.body.status);
  const r = await db.query(
    "UPDATE leave_requests l SET status=$1,decided_by=$2 FROM employees e WHERE l.id=$3 AND e.id=l.employee_id AND l.status='Pending' AND ($4::int IS NULL OR e.school_id=$4) AND ($5::int IS NULL OR e.id<>$5) RETURNING l.*",
    [
      status,
      req.user.id,
      req.params.id,
      scoped(req.user) ? req.user.school_id : null,
      req.user.employee_id,
    ],
  );
  if (!r.rowCount)
    return res.status(409).json({
      error:
        "Request unavailable, already decided, or self-approval forbidden.",
    });
  await audit(req.user.id, status + " leave", req.params.id);
  res.json(r.rows[0]);
});
const modules = [
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
function allowedModules(user) {
  let allowed = modules;
  if (user.role === "employee") allowed = ["Helpdesk"];
  if (user.role === "recruiter") allowed = ["Recruitment"];
  if (user.role === "finance") allowed = ["Benefits"];
  if (!["super_admin", "hr"].includes(user.role))
    allowed = allowed.filter(
      (m) => !["Grievances", "Disciplinary", "Welfare"].includes(m),
    );
  return allowed;
}
app.get("/api/records", allow("records"), async (req, res) => {
  const allowed = allowedModules(req.user);
  res.json(
    (
      await db.query(
        "SELECT r.*,s.name AS school FROM records r LEFT JOIN schools s ON s.id=r.school_id WHERE r.module=ANY($1) AND ($2::int IS NULL OR r.school_id=$2) AND ($3::int IS NULL OR r.created_by=$3) ORDER BY r.created_at DESC",
        [
          allowed,
          scoped(req.user) ? req.user.school_id : null,
          req.user.role === "employee" ? req.user.id : null,
        ],
      )
    ).rows,
  );
});
app.post("/api/records", allow("records"), async (req, res) => {
  const d = z
    .object({
      module: z.enum(modules),
      title: z.string().trim().min(4).max(160),
      school_id: z.coerce.number().int().min(1).max(7),
      due_date: z.iso.date(),
      details: z.string().max(3000),
    })
    .parse(req.body);
  if (
    (scoped(req.user) && d.school_id !== req.user.school_id) ||
    (req.user.role === "employee" && d.module !== "Helpdesk") ||
    (req.user.role === "recruiter" && d.module !== "Recruitment") ||
    (req.user.role === "finance" && d.module !== "Benefits") ||
    (!["super_admin", "hr"].includes(req.user.role) &&
      ["Grievances", "Disciplinary", "Welfare"].includes(d.module))
  )
    return res.status(403).json({ error: "Module or school access denied." });
  const r = await db.query(
    "INSERT INTO records(module,title,school_id,due_date,details,created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
    [d.module, d.title, d.school_id, d.due_date, d.details, req.user.id],
  );
  await audit(req.user.id, "Created " + d.module, String(r.rows[0].id));
  res.status(201).json(r.rows[0]);
});
app.patch("/api/records/:id", allow("records"), async (req, res) => {
  const status = z
    .enum(["In progress", "Completed", "Cancelled"])
    .parse(req.body.status);
  const r = await db.query(
    "UPDATE records SET status=$1 WHERE id=$2 AND module=ANY($3) AND ($4::int IS NULL OR school_id=$4) AND ($5::int IS NULL OR created_by=$5) AND status IN ('Open','In progress') RETURNING *",
    [
      status,
      req.params.id,
      allowedModules(req.user),
      scoped(req.user) ? req.user.school_id : null,
      req.user.role === "employee" ? req.user.id : null,
    ],
  );
  if (!r.rowCount)
    return res.status(409).json({
      error: "Record unavailable, outside your scope, or already closed.",
    });
  await audit(
    req.user.id,
    "Updated " + r.rows[0].module + " to " + status,
    String(r.rows[0].id),
  );
  res.json(r.rows[0]);
});
app.get("/api/audit", allow("audit"), async (req, res) =>
  res.json(
    (
      await db.query(
        "SELECT a.*,u.name FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 200",
      )
    ).rows,
  ),
);
app.get("/api/reports", allow("reports"), async (req, res) => {
  const rows = (
    await db.query(
      "SELECT s.name,s.campus,count(e.id)::int AS employees,count(e.id) FILTER(WHERE e.staff_category='Teaching')::int AS teachers FROM schools s LEFT JOIN employees e ON e.school_id=s.id WHERE ($1::int IS NULL OR s.id=$1) GROUP BY s.id ORDER BY s.id",
      [scoped(req.user) ? req.user.school_id : null],
    )
  ).rows;
  if (!scoped(req.user)) {
    const central = (
      await db.query(
        "SELECT 'KISC Head Office' AS name,'Central office' AS campus,count(*)::int AS employees,count(*) FILTER(WHERE staff_category='Teaching')::int AS teachers FROM employees WHERE org_scope='Head office'",
      )
    ).rows[0];
    rows.push(central);
  }
  res.json(rows);
});
app.get("/api/users", allow("settings"), async (req, res) =>
  res.json(
    (
      await db.query(
        "SELECT id,name,email,role,school_id,active FROM users ORDER BY id",
      )
    ).rows,
  ),
);
app.use(express.static("dist"));
app.get("/app", (req, res) => res.sendFile("index.html", { root: "dist" }));
app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err instanceof z.ZodError)
    return res.status(400).json({
      error: err.issues
        .map((i) => i.path.join(".") + ": " + i.message)
        .join("; "),
    });
  if (err.code === "23503")
    return res
      .status(400)
      .json({ error: "The referenced school or employee does not exist." });
  if (err.code === "23505")
    return res.status(409).json({
      error: "That record already exists. Use a unique email or identifier.",
    });
  console.error("Request failed", err.code || err.name);
  res
    .status(500)
    .json({ error: "Unable to complete this request. Please try again." });
});
app.listen(process.env.PORT || 3001, "0.0.0.0", () =>
  console.log("PeopleHub API listening"),
);
