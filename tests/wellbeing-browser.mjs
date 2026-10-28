import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
  headless: true,
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    offline: true,
    colorScheme: "light",
  });
  const page = await context.newPage();
  const errors = [],
    network = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) network.push(r.url());
  });
  await page.setContent(
    await readFile(
      new URL("../KISC-PeopleHub-HR.html", import.meta.url),
      "utf8",
    ),
  );
  await page.getByRole("heading", { name: /Good people/ }).waitFor();
  await page
    .getByRole("button", { name: "Employee directory", exact: true })
    .click();
  await page.getByLabel("Search records").fill("Amara");
  await page
    .getByRole("button", { name: "Amara Wanjiku", exact: true })
    .click();
  await page.getByRole("button", { name: "Health", exact: true }).click();
  await page
    .getByRole("button", { name: "Update health profile", exact: true })
    .click();
  await page
    .getByLabel("Allergies & sensitivities", { exact: true })
    .fill("FICTIONAL PRIVATE HEALTH MARKER");
  await page
    .getByLabel("Workplace adjustments", { exact: true })
    .fill("Fictional ergonomic support example");
  await page
    .getByLabel("Source & authorized support purpose", { exact: true })
    .fill("Fictional employee-provided workplace support example");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Save confidential profile", exact: true })
    .click();
  await page
    .getByText("Confidential health profile saved.", { exact: true })
    .waitFor();
  assert.ok(
    await page
      .getByText("FICTIONAL PRIVATE HEALTH MARKER", { exact: true })
      .isVisible(),
  );
  assert.equal(await page.getByRole("button", { name: /Publish/ }).count(), 0);
  await page.screenshot({
    path: "/tmp/kisc-health-profile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "All colleagues", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reports & meetings", exact: true })
    .click();
  await page.getByRole("heading", { name: /Good conversations/ }).waitFor();
  await page.screenshot({ path: "/tmp/kisc-staff-hub.png", fullPage: true });
  await page.getByRole("button", { name: /Meeting minutes/ }).click();
  await page.getByRole("button", { name: "New minutes", exact: true }).click();
  await page
    .getByLabel("Communication title")
    .fill("Fictional HR planning minutes");
  await page
    .getByLabel("Content / minutes", { exact: true })
    .fill(
      "Agenda: fictional staff communications. Decision: publish a reviewed general summary. Action: schedule induction planning. No personal or medical information included.",
    );
  await page
    .getByRole("button", { name: "Save private draft", exact: true })
    .click();
  await page.getByText("Draft created", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Fictional HR planning minutes", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review & publish to staff", exact: true })
    .click();
  assert.ok(
    await page
      .getByRole("button", { name: "Publish to authorized staff", exact: true })
      .isDisabled(),
  );
  await page
    .getByRole("button", { name: "Close communication dialog", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit record", exact: true }).click();
  await page.getByLabel("Content classification").selectOption("Staff-ready");
  await page
    .getByRole("button", { name: "Save private draft", exact: true })
    .click();
  await page
    .getByText("Updated and returned to draft", { exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Review & publish to staff", exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "I have reviewed this record for staff sharing",
    })
    .check();
  await page
    .getByRole("button", { name: "Publish to authorized staff", exact: true })
    .click();
  await page
    .getByText("Published to authorized staff", { exact: true })
    .waitFor();
  await page.screenshot({
    path: "/tmp/kisc-published-minutes.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Published staff preview", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Fictional HR planning minutes", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("button", { name: "Edit record", exact: true })
      .count(),
    0,
  );
  assert.equal(
    await page
      .getByText("FICTIONAL PRIVATE HEALTH MARKER", { exact: true })
      .count(),
    0,
  );
  await page.getByRole("button", { name: /Policy acknowledgements/ }).click();
  await page
    .getByRole("button", {
      name: "Demonstration privacy reading exercise",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "I have read this version", exact: true })
    .click();
  await page
    .getByText("Policy acknowledgement recorded", { exact: true })
    .waitFor();
  assert.ok(
    await page
      .getByRole("button", { name: "Acknowledged", exact: true })
      .isDisabled(),
  );
  await page
    .getByRole("button", { name: "Admin workspace", exact: true })
    .click();
  await page.getByRole("button", { name: /Meeting calendar/ }).click();
  await page.getByRole("button", { name: "New meeting", exact: true }).click();
  await page
    .getByLabel("Communication title")
    .fill("Nairobi month boundary meeting");
  await page
    .getByLabel("Content / minutes", { exact: true })
    .fill(
      "A fictional calendar test on the first day of November in Nairobi time.",
    );
  await page.getByLabel("Meeting time (Nairobi)").fill("2026-11-01T00:30");
  await page
    .getByRole("button", { name: "Save private draft", exact: true })
    .click();
  await page.getByText("Draft created", { exact: true }).waitFor();
  await page.getByLabel("Filter meeting month").fill("2026-11");
  assert.ok(
    await page
      .getByRole("button", {
        name: "Nairobi month boundary meeting",
        exact: true,
      })
      .isVisible(),
  );
  for (const name of [
    "Meeting calendar",
    "Action tracker",
    "Decisions register",
    "Staff noticeboard",
    "Policy acknowledgements",
  ])
    await page.getByRole("button", { name: new RegExp(name) }).click();
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Mobile hub overflow",
  );
  await page.screenshot({
    path: "/tmp/kisc-staff-hub-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  console.log(
    "PASS: offline health form, draft restrictions, publishing review, staff preview, policy acknowledgement, five related tools, dark/mobile, no runtime/network errors.",
  );
} finally {
  await browser.close();
}
