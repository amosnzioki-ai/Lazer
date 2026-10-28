/** Example bridge for VENDOR-NORMALIZED events; not a fingerprint or CCTV SDK. */
import { createInterface } from "node:readline";
const endpoint = process.env.ATTENDANCE_ENDPOINT,
  token = process.env.ATTENDANCE_DEVICE_TOKEN;
if (!endpoint || !token)
  throw Error("Set ATTENDANCE_ENDPOINT and ATTENDANCE_DEVICE_TOKEN securely.");
const url = new URL(endpoint);
if (
  url.protocol !== "https:" &&
  !(
    url.protocol === "http:" &&
    ["127.0.0.1", "localhost"].includes(url.hostname)
  )
)
  throw Error("Use HTTPS for non-local device event delivery.");
let lineNumber = 0;
for await (const line of createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
})) {
  if (!line.trim()) continue;
  lineNumber++;
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    throw Error("Invalid JSON on line " + lineNumber);
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw Error(
      "Event line " +
        lineNumber +
        " rejected with HTTP " +
        response.status +
        ". Preserve the input and review enrollment, timestamp and direction; no automatic retry performed.",
    );
  const result = await response.json();
  process.stdout.write(
    "Line " +
      lineNumber +
      ": " +
      (result.duplicate ? "already recorded" : "accepted") +
      "\n",
  );
}
