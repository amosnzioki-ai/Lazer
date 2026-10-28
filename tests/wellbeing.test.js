import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
const base = "http://127.0.0.1:3001";
async function login(email) {
  const r = await fetch(base + "/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.includes("@") ? email : email + "@example.test",
      password: process.env.SEED_PASSWORD,
    }),
  });
  assert.equal(r.status, 200);
  const cookie = r.headers.get("set-cookie").split(";")[0];
  return async (path, method = "GET", body) => {
    const r = await fetch(base + "/api" + path, {
      method,
      headers: {
        Cookie: cookie,
        "Content-Type": "application/json",
        "X-PeopleHub-Request": "1",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, data: await r.json() };
  };
}
test("Health is encrypted, separately authorized and never part of published staff records", async () => {
  const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const admin = await login("super_admin"),
    school = await login("school_admin"),
    staff = await login("employee"),
    enko = await login("enko");
  const stamp = Date.now();
  let employee, user;
  const records = [];
  try {
    employee = (
      await admin("/employees", "POST", {
        name: "Health Integration Employee",
        email: "health-test-" + stamp + "@example.test",
        title: "Teacher",
        department: "Academics",
        school_id: 1,
        curriculum: "CBE",
      })
    ).data;
    const email = "health-owner-" + stamp + "@example.test";
    user = (
      await db.query(
        "INSERT INTO users(email,password_hash,name,role,school_id,employee_id) SELECT $1,password_hash,'Health test owner','employee',1,$2 FROM users WHERE role='super_admin' LIMIT 1 RETURNING id",
        [email, employee.id],
      )
    ).rows[0];
    const own = await login(email);
    assert.equal(
      (await school("/employees/" + employee.id + "/health")).status,
      403,
    );
    assert.equal(
      (await staff("/employees/" + employee.id + "/health")).status,
      403,
    );
    assert.equal(
      (await enko("/employees/" + employee.id + "/health")).status,
      403,
    );
    const health = {
      allergies: "FICTIONAL-PRIVATE-ALLERGY-" + stamp,
      health_conditions: "Fictional example only",
      medications: "",
      workplace_adjustments: "Demo ergonomic support",
      emergency_instructions: "Demo instructions only",
      health_contact: "Demo health contact",
      reviewed_on: new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Nairobi",
      }).format(new Date()),
      source_note: "Fictional occupational support test",
    };
    assert.equal(
      (
        await own("/employees/" + employee.id + "/health", "PUT", {
          version: 0,
          profile: health,
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await admin("/employees/" + employee.id + "/health", "PUT", {
          version: 0,
          profile: health,
        })
      ).status,
      200,
    );
    const encrypted = (
      await db.query(
        "SELECT payload FROM employee_health WHERE employee_id=$1",
        [employee.id],
      )
    ).rows[0].payload;
    assert.ok(!encrypted.includes(health.allergies));
    assert.ok(JSON.parse(encrypted).tag);
    const fetched = await own("/employees/" + employee.id + "/health");
    assert.equal(fetched.status, 200);
    assert.equal(fetched.data.allergies, health.allergies);
    assert.equal(
      (
        await admin("/employees/" + employee.id + "/health", "PUT", {
          version: 0,
          profile: health,
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await admin("/employees/" + employee.id + "/health", "PUT", {
          version: 1,
          profile: { ...health, publish: true },
        })
      ).status,
      400,
    );
    assert.ok(
      !JSON.stringify((await admin("/employees")).data).includes(
        health.allergies,
      ),
    );
    assert.ok(
      !JSON.stringify((await admin("/employees/" + employee.id)).data).includes(
        health.allergies,
      ),
    );
    assert.ok(
      !(
        await db.query("SELECT action FROM audit WHERE entity=$1", [
          String(employee.id),
        ])
      ).rows.some((a) => a.action.includes(health.allergies)),
    );
    const body = {
      category: "Minutes",
      title: "Wellbeing test minutes " + stamp,
      body: "A fictional staff-safe meeting summary without private health data.",
      school_id: 1,
      classification: "Confidential",
      due_on: null,
      starts_at: null,
      venue: "Demo room",
      owner: "Demo chair",
      workflow_state: "Open",
    };
    assert.equal((await staff("/hub", "POST", body)).status, 403);
    assert.equal(
      (await school("/hub", "POST", { ...body, school_id: null })).status,
      403,
    );
    assert.equal(
      (await admin("/hub", "POST", { ...body, category: "Meeting" })).status,
      400,
    );
    const created = await admin("/hub", "POST", body);
    assert.equal(created.status, 201);
    let record = created.data;
    records.push(record.id);
    assert.ok(!(await staff("/hub")).data.some((r) => r.id === record.id));
    assert.equal((await staff("/hub/" + record.id)).status, 404);
    assert.equal(
      (
        await admin("/hub/" + record.id + "/publish", "POST", {
          version: 1,
          reviewed: true,
        })
      ).status,
      400,
    );
    record = (
      await admin("/hub/" + record.id, "PATCH", {
        ...body,
        classification: "Staff-ready",
        version: 1,
      })
    ).data;
    assert.equal(record.state, "Draft");
    assert.equal(
      (
        await admin("/hub/" + record.id + "/publish", "POST", {
          version: record.version,
          reviewed: false,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await admin("/hub/" + record.id + "/publish", "POST", {
          version: record.version,
          reviewed: true,
        })
      ).status,
      200,
    );
    assert.equal((await staff("/hub/" + record.id)).status, 200);
    assert.ok((await staff("/hub")).data.some((r) => r.id === record.id));
    assert.equal(
      (
        await staff("/hub/" + record.id + "/unpublish", "POST", {
          version: record.version,
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await staff("/hub/" + record.id + "/download", "POST", {
          version: record.version,
        })
      ).status,
      200,
    );
    record = (
      await admin("/hub/" + record.id, "PATCH", {
        ...body,
        classification: "Staff-ready",
        title: body.title + " edited",
        version: record.version,
      })
    ).data;
    assert.equal(record.state, "Draft");
    assert.equal((await staff("/hub/" + record.id)).status, 404);
    assert.ok(!(await staff("/hub")).data.some((r) => r.id === record.id));
    assert.equal((await enko("/hub")).status, 403);
    const other = await admin("/hub", "POST", {
      ...body,
      school_id: 2,
      classification: "Staff-ready",
    });
    records.push(other.data.id);
    await admin("/hub/" + other.data.id + "/publish", "POST", {
      version: 1,
      reviewed: true,
    });
    assert.equal((await staff("/hub/" + other.data.id)).status, 404);
    assert.equal(
      (await school("/hub/" + other.data.id, "PATCH", { ...body, version: 1 }))
        .status,
      403,
    );
    const policy = await admin("/hub", "POST", {
      ...body,
      category: "Policy",
      classification: "Staff-ready",
      school_id: null,
      title: "Fictional acknowledgement test " + stamp,
    });
    records.push(policy.data.id);
    await admin("/hub/" + policy.data.id + "/publish", "POST", {
      version: 1,
      reviewed: true,
    });
    assert.equal(
      (
        await staff("/hub/" + policy.data.id + "/acknowledge", "POST", {
          version: 1,
          user_id: user.id,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await staff("/hub/" + policy.data.id + "/acknowledge", "POST", {
          version: 1,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await staff("/hub/" + policy.data.id + "/acknowledge", "POST", {
          version: 1,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await db.query(
          "SELECT * FROM hub_acknowledgements WHERE record_id=$1",
          [policy.data.id],
        )
      ).rowCount,
      1,
    );
    const revised = await admin("/hub/" + policy.data.id, "PATCH", {
      ...body,
      category: "Policy",
      classification: "Staff-ready",
      school_id: null,
      title: "Revised fictional policy " + stamp,
      version: 1,
    });
    await admin("/hub/" + policy.data.id + "/publish", "POST", {
      version: revised.data.version,
      reviewed: true,
    });
    assert.equal(
      (await staff("/hub")).data.find((r) => r.id === policy.data.id)
        .acknowledged,
      false,
    );
    assert.equal(
      (
        await staff("/hub/" + policy.data.id + "/acknowledge", "POST", {
          version: 1,
        })
      ).status,
      409,
    );
    assert.ok(
      !JSON.stringify((await staff("/hub")).data).includes(health.allergies),
    );
  } finally {
    for (const id of records) {
      await db.query("DELETE FROM hub_acknowledgements WHERE record_id=$1", [
        id,
      ]);
      await db.query("DELETE FROM hub_records WHERE id=$1", [id]);
    }
    if (user) {
      await db.query("DELETE FROM sessions WHERE user_id=$1", [user.id]);
      await db.query("DELETE FROM audit WHERE user_id=$1", [user.id]);
      await db.query("DELETE FROM users WHERE id=$1", [user.id]);
    }
    if (employee) {
      await db.query("DELETE FROM employee_health WHERE employee_id=$1", [
        employee.id,
      ]);
      await db.query("DELETE FROM employees WHERE id=$1", [employee.id]);
    }
    await db.end();
  }
});
