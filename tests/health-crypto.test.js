import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { encryptHealth, decryptHealth } from "../server/wellbeing-hub.js";
test("Health encryption round-trips, uses distinct nonces and rejects tampering", () => {
  const record = {
    allergies: "FICTIONAL TEST ONLY",
    workplace_adjustments: "Test",
  };
  const first = encryptHealth(record),
    second = encryptHealth(record);
  assert.deepEqual(decryptHealth(first), record);
  assert.notEqual(JSON.parse(first).iv, JSON.parse(second).iv);
  assert.ok(!first.includes(record.allergies));
  const tampered = JSON.parse(first),
    bytes = Buffer.from(tampered.body, "base64");
  bytes[0] ^= 1;
  tampered.body = bytes.toString("base64");
  assert.throws(() => decryptHealth(JSON.stringify(tampered)));
});
