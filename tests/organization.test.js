import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
async function login(role) {
  const r = await fetch("http://127.0.0.1:3001/api/login", {
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
    const r = await fetch("http://127.0.0.1:3001/api" + path, {
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
test("School teams and central leadership are separate, assignable and school-scoped", async () => {
  const admin = await login("super_admin"),
    local = await login("school_admin"),
    enko = await login("enko");
  const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  let id;
  try {
    const all = (await admin("/employees")).data;
    const central = all.filter((e) => e.org_scope === "Head office");
    assert.ok(central.length >= 6);
    assert.ok(central.every((e) => e.school_id === null));
    for (let school = 1; school <= 7; school++) {
      const team = all.filter(
        (e) => e.org_scope === "School" && e.school_id === school,
      );
      for (const c of ["Teaching", "Support", "Leadership"])
        assert.ok(
          team.some((e) => e.staff_category === c),
          "Missing " + c + " in school " + school,
        );
    }
    const localList = (await local("/employees")).data;
    assert.ok(
      localList.every((e) => e.school_id === 1 && e.org_scope === "School"),
    );
    assert.equal((await local("/employees/" + central[0].id)).status, 403);
    const data = {
      name: "Central Integration Colleague",
      email: "central-test-" + Date.now() + "@example.test",
      title: "Group HR Advisor",
      department: "Human Resources",
      school_id: null,
      org_scope: "Head office",
      staff_category: "Support",
      curriculum: "Not applicable",
    };
    assert.equal((await local("/employees", "POST", data)).status, 403);
    assert.equal(
      (await admin("/employees", "POST", { ...data, school_id: 1 })).status,
      400,
    );
    assert.equal(
      (await admin("/employees", "POST", { ...data, org_scope: "School" }))
        .status,
      400,
    );
    const created = await admin("/employees", "POST", data);
    assert.equal(created.status, 201);
    id = created.data.id;
    const e = (await admin("/employees/" + id)).data;
    assert.equal(e.school, "KISC Head Office");
    assert.equal(e.staff_category, "Support");
    assert.equal((await local("/employees/" + id)).status, 403);
    assert.equal((await enko("/employees/" + id)).status, 403);
    const reports = (await enko("/reports")).data;
    assert.ok(
      reports.some((r) => r.name === "KISC Head Office" && r.employees >= 7),
    );
    assert.ok(
      !(await local("/reports")).data.some(
        (r) => r.name === "KISC Head Office",
      ),
    );
    const profile = {
      name: e.name,
      email: e.email,
      title: e.title,
      department: "Executive Leadership",
      school_id: null,
      org_scope: "Head office",
      staff_category: "Leadership",
      curriculum: e.curriculum,
      phone: "",
      location: "Central office",
      employment_type: "Permanent",
      manager: "Group CEO",
      emergency_name: "",
      emergency_phone: "",
      tsc_number: "",
      bio: "Fictional integration profile",
      start_date: "2024-01-01",
      contract_end: null,
      status: "Active",
    };
    assert.equal(
      (await admin("/employees/" + id, "PATCH", profile)).status,
      200,
    );
    assert.equal(
      (await admin("/employees/" + id)).data.staff_category,
      "Leadership",
    );
    assert.equal(
      (
        await local("/employees/" + id, "PATCH", {
          ...profile,
          school_id: 1,
          org_scope: "School",
        })
      ).status,
      403,
    );
  } finally {
    if (id) await db.query("DELETE FROM employees WHERE id=$1", [id]);
    await db.end();
  }
});
