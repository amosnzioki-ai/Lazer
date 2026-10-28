import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
const base = "http://127.0.0.1:3001";
async function login(role) {
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
test("Profile and attendance/device lifecycle enforce scope, sequencing, idempotency and revocation", async () => {
  const admin = await login("super_admin"),
    school = await login("school_admin"),
    self = await login("employee"),
    enko = await login("enko");
  const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  let employee, other, device;
  try {
    const create = async (suffix, school_id) => {
      const r = await admin("/employees", "POST", {
        name: "People Integration " + suffix,
        email: "people-" + suffix + "-" + Date.now() + "@example.test",
        title: "Teacher",
        department: "Academics",
        school_id,
        curriculum: "CBE",
      });
      assert.equal(r.status, 201);
      return r.data;
    };
    employee = await create("one", 1);
    other = await create("two", 2);
    assert.equal((await school("/employees/" + other.id)).status, 403);
    assert.equal((await self("/employees/" + employee.id)).status, 403);
    assert.equal((await enko("/employees/" + employee.id)).status, 403);
    assert.equal((await self("/employees/1")).status, 200);
    const e = (await admin("/employees/" + employee.id)).data;
    const profile = {
      name: e.name,
      email: e.email,
      title: e.title,
      department: e.department,
      school_id: e.school_id,
      phone: "DEMO-EDITED",
      location: "Kitengela",
      employment_type: "Permanent",
      manager: "Demo Manager",
      emergency_name: "Demo Contact",
      emergency_phone: "DEMO-ONLY",
      tsc_number: "DEMO-TSC",
      bio: "Fictional integration profile",
      start_date: "2022-01-01",
      contract_end: null,
      status: "Active",
      curriculum: "CBE",
    };
    assert.equal(
      (await admin("/employees/" + employee.id, "PATCH", profile)).status,
      200,
    );
    assert.equal(
      (await admin("/employees/" + employee.id)).data.phone,
      "DEMO-EDITED",
    );
    assert.equal((await self("/employees/1", "PATCH", profile)).status, 403);
    const q = {
      title: "Integration qualification",
      issuer: "Demo University",
      category: "Academic",
      awarded_on: "2021-01-01",
      expires_on: null,
      verified: true,
    };
    assert.equal(
      (await admin("/employees/" + employee.id + "/qualifications", "POST", q))
        .status,
      201,
    );
    assert.equal(
      (
        await admin("/employees/" + employee.id + "/qualifications", "POST", {
          ...q,
          title: "Invalid dates",
          expires_on: "2020-01-01",
        })
      ).status,
      400,
    );
    const current = (await admin("/employees/" + employee.id)).data;
    const qualification = current.qualifications[0];
    assert.equal(
      (
        await admin(
          "/employees/" + employee.id + "/qualifications/" + qualification.id,
          "PATCH",
          { ...q, verified: false },
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await school(
          "/employees/" + other.id + "/qualifications/" + qualification.id,
          "PATCH",
          q,
        )
      ).status,
      403,
    );
    const reg = await admin("/devices", "POST", {
      name: "Integration terminal",
      school_id: 1,
      kind: "Fingerprint terminal",
    });
    assert.equal(reg.status, 201);
    device = reg.data;
    assert.ok(device.token);
    assert.equal(
      (
        await school("/devices", "POST", {
          name: "Forbidden terminal",
          school_id: 2,
          kind: "Door access",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await admin("/devices/" + device.id + "/enrollments", "POST", {
          employee_id: other.id,
          external_ref: "other",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await admin("/devices/" + device.id + "/enrollments", "POST", {
          employee_id: employee.id,
          external_ref: "test-employee",
        })
      ).status,
      201,
    );
    const send = async (body, token = device.token) => {
      const r = await fetch(base + "/api/integrations/attendance", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      return { status: r.status, data: await r.json() };
    };
    const event = {
      external_ref: "test-employee",
      event_id: "first-in",
      direction: "IN",
      occurred_at: new Date(Date.now() - 3600000).toISOString(),
    };
    assert.equal((await send(event, "invalid")).status, 401);
    assert.equal(
      (await send({ ...event, external_ref: "unknown" })).status,
      403,
    );
    assert.equal(
      (await send({ ...event, direction: "OUT", event_id: "invalid-out" }))
        .status,
      409,
    );
    assert.equal((await send(event)).status, 201);
    assert.equal((await send(event)).status, 200);
    assert.equal(
      (await send({ ...event, event_id: "duplicate-in" })).status,
      409,
    );
    assert.equal(
      (
        await send({
          ...event,
          event_id: "future",
          occurred_at: new Date(Date.now() + 3600000).toISOString(),
        })
      ).status,
      400,
    );
    const out = {
      ...event,
      event_id: "out",
      direction: "OUT",
      occurred_at: new Date(Date.now() - 1800000).toISOString(),
    };
    assert.equal((await send(out)).status, 201);
    assert.equal(
      (await admin("/employees/" + employee.id)).data.attendance.length,
      2,
    );
    assert.equal(
      (
        await self("/employees/1/attendance", "POST", {
          direction: "IN",
          occurred_at: new Date().toISOString(),
          reason: "Forbidden change",
          event_id: "test-forbidden",
        })
      ).status,
      403,
    );
    const listed = await admin("/devices");
    assert.ok(!JSON.stringify(listed.data).includes(device.token));
    assert.ok(!JSON.stringify(listed.data).includes("token_hash"));
    assert.equal(
      (await admin("/devices/" + device.id, "PATCH", { active: false })).status,
      200,
    );
    assert.equal(
      (await send({ ...out, event_id: "after-revoke" })).status,
      401,
    );
    assert.equal(
      (
        await admin("/employees/" + employee.id, "PATCH", {
          ...profile,
          status: "Archived",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await db.query(
          "SELECT * FROM device_enrollments WHERE employee_id=$1",
          [employee.id],
        )
      ).rowCount,
      0,
    );
  } finally {
    if (device) {
      await db.query("DELETE FROM attendance_events WHERE device_id=$1", [
        device.id,
      ]);
      await db.query("DELETE FROM device_enrollments WHERE device_id=$1", [
        device.id,
      ]);
      await db.query("DELETE FROM attendance_devices WHERE id=$1", [device.id]);
    }
    for (const e of [employee, other])
      if (e) {
        await db.query("DELETE FROM attendance_events WHERE employee_id=$1", [
          e.id,
        ]);
        await db.query("DELETE FROM qualifications WHERE employee_id=$1", [
          e.id,
        ]);
        await db.query("DELETE FROM employees WHERE id=$1", [e.id]);
      }
    await db.end();
  }
});
