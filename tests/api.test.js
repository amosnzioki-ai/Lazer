import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
const base = process.env.TEST_URL || "http://127.0.0.1:3001";
async function client(role) {
  const r = await fetch(base + "/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: role + "@example.test",
      password: process.env.SEED_PASSWORD,
    }),
  });
  assert.equal(r.status, 200);
  const cookie = r.headers.get("set-cookie").split(";")[0];
  return async (path, method = "GET", body) => {
    const response = await fetch(base + "/api" + path, {
      method,
      headers: {
        Cookie: cookie,
        "Content-Type": "application/json",
        "X-PeopleHub-Request": "1",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, data: await response.json() };
  };
}
test("API health checks a real database connection", async () => {
  assert.equal((await fetch(base + "/api/health")).status, 200);
});
test("Unauthenticated personnel access fails", async () => {
  assert.equal((await fetch(base + "/api/employees")).status, 401);
});
test("School administrators only see their school", async () => {
  const c = await client("school_admin");
  const r = await c("/employees");
  assert.ok(r.data.length > 0);
  assert.ok(r.data.every((e) => e.school_id === 1));
  assert.equal(
    (
      await c("/employees", "POST", {
        name: "Forbidden Test",
        email: "forbidden@example.test",
        title: "Teacher",
        department: "Academics",
        school_id: 2,
        curriculum: "CBE",
      })
    ).status,
    403,
  );
});
test("Enko sees aggregate counts but cannot inspect personnel or cases", async () => {
  const c = await client("enko");
  assert.equal((await c("/reports")).status, 200);
  for (const p of ["/employees", "leave", "records", "users", "audit"])
    assert.equal((await c(p.startsWith("/") ? p : "/" + p)).status, 403);
});
test("Employees see only their own profile and cannot approve or file management cases", async () => {
  const c = await client("employee");
  const ownDirectory = await c("/employees");
  assert.equal(ownDirectory.status, 200);
  assert.ok(ownDirectory.data.every((e) => e.id === 1));
  assert.equal(
    (await c("/leave/1", "PATCH", { status: "Approved" })).status,
    403,
  );
  assert.equal(
    (
      await c("/records", "POST", {
        module: "Grievances",
        title: "Forbidden case",
        school_id: 1,
        due_date: "2027-01-02",
        details: "Private",
      })
    ).status,
    403,
  );
  const r = await c("/leave");
  assert.ok(r.data.every((l) => l.employee_id === 1));
});
test("Persistent employee creation rejects duplicates and invalid data", async () => {
  const c = await client("super_admin"),
    db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const email = "integration-" + Date.now() + "@example.test";
  try {
    const data = {
      name: "Integration Test",
      email,
      title: "Teacher",
      department: "Academics",
      school_id: 1,
      curriculum: "CBE",
    };
    assert.equal((await c("/employees", "POST", data)).status, 201);
    assert.ok((await c("/employees")).data.some((e) => e.email === email));
    assert.equal((await c("/employees", "POST", data)).status, 409);
    assert.equal(
      (await c("/employees", "POST", { ...data, email: "not-an-email" }))
        .status,
      400,
    );
  } finally {
    await db.query("DELETE FROM employees WHERE email=$1", [email]);
    await db.end();
  }
});
test("Leave creates, persists, approves once, and records an audit event", async () => {
  const employee = await client("employee"),
    admin = await client("super_admin"),
    db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  let id;
  try {
    const r = await employee("/leave", "POST", {
      employee_id: 1,
      type: "Annual leave",
      start_date: "2027-02-01",
      end_date: "2027-02-02",
      reason: "Integration test request",
    });
    assert.equal(r.status, 201);
    id = r.data.id;
    assert.equal(r.data.days, 2);
    assert.equal(
      (await admin("/leave/" + id, "PATCH", { status: "Approved" })).status,
      200,
    );
    assert.equal(
      (await admin("/leave/" + id, "PATCH", { status: "Rejected" })).status,
      409,
    );
    const a = await admin("/audit");
    assert.ok(
      a.data.some(
        (e) => e.entity === String(id) && e.action === "Approved leave",
      ),
    );
  } finally {
    if (id) await db.query("DELETE FROM leave_requests WHERE id=$1", [id]);
    await db.end();
  }
});
test("HR register creates persisted records", async () => {
  const c = await client("super_admin"),
    db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  let id;
  try {
    const r = await c("/records", "POST", {
      module: "Training",
      title: "Integration safeguarding training",
      school_id: 1,
      due_date: "2027-02-01",
      details: "Fictional integration test",
    });
    assert.equal(r.status, 201);
    id = r.data.id;
    assert.ok((await c("/records")).data.some((r) => r.id === id));
    assert.equal(
      (await c("/records/" + id, "PATCH", { status: "Completed" })).status,
      200,
    );
    assert.equal(
      (await c("/records/" + id, "PATCH", { status: "In progress" })).status,
      409,
    );
  } finally {
    if (id) await db.query("DELETE FROM records WHERE id=$1", [id]);
    await db.end();
  }
});

test("Cross-origin login attempts are rejected", async () => {
  const r = await fetch(base + "/api/login", {
    method: "POST",
    headers: {
      Origin: "https://untrusted.example",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "super_admin@example.test",
      password: process.env.SEED_PASSWORD,
    }),
  });
  assert.equal(r.status, 403);
});
