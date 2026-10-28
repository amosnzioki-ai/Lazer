import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
function run(endpoint, input) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, ["scripts/device-adapter.mjs"], {
      env: {
        ...process.env,
        ATTENDANCE_ENDPOINT: endpoint,
        ATTENDANCE_DEVICE_TOKEN: "test-only-credential",
      },
    });
    let out = "",
      err = "";
    p.stdout.on("data", (b) => (out += b));
    p.stderr.on("data", (b) => (err += b));
    p.on("close", (code) => resolve({ code, out, err }));
    p.stdin.end(input);
  });
}
test("Adapter sends normalized events sequentially without logging credentials; refuses external plaintext HTTP", async () => {
  let calls = 0;
  const server = createServer((req, res) => {
    assert.equal(req.headers.authorization, "Bearer test-only-credential");
    calls++;
    req.resume();
    req.on("end", () => {
      res.writeHead(calls === 1 ? 201 : 200, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify({ duplicate: calls > 1 }));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const endpoint = "http://127.0.0.1:" + server.address().port;
    const r = await run(
      endpoint,
      '{"event_id":"test-one"}\n{"event_id":"test-one"}\n',
    );
    assert.equal(r.code, 0);
    assert.equal(calls, 2);
    assert.ok(r.out.includes("already recorded"));
    assert.ok(!r.out.includes("test-only-credential"));
    const invalid = await run(
      "http://example.com/api/integrations/attendance",
      "",
    );
    assert.notEqual(invalid.code, 0);
    assert.ok(invalid.err.includes("Use HTTPS"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
