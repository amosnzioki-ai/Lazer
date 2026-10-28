import test from "node:test";
import assert from "node:assert/strict";
import { permits, scoped, weekdays } from "../server/policy.js";
test("Enko cannot read personnel, private HR or audit records", () => {
  for (const r of ["employees", "leave", "records", "audit", "settings"])
    assert.equal(permits({ role: "enko" }, r), false);
  assert.equal(permits({ role: "enko" }, "reports"), true);
});
test("Employee cannot read workforce, manage settings or approve through permission set", () => {
  for (const r of ["employees", "settings", "audit", "reports"])
    assert.equal(permits({ role: "employee" }, r), false);
  assert.equal(scoped({ role: "employee" }), true);
});
test("School roles require school scoping", () => {
  for (const role of ["school_admin", "principal", "manager"])
    assert.equal(scoped({ role }), true);
});
test("Unknown roles fail closed", () =>
  assert.equal(permits({ role: "invented" }, "employees"), false));
test("Weekday duration excludes a complete weekend", () => {
  assert.equal(weekdays("2026-10-23", "2026-10-26"), 2);
  assert.equal(weekdays("2026-10-24", "2026-10-25"), 0);
  assert.equal(weekdays("2026-10-26", "2026-10-26"), 1);
});
