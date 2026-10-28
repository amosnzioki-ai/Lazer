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
  await page.evaluate(() => document.fonts.ready);
  await page
    .getByRole("heading", {
      name: "Head Office & Group Leadership",
      exact: true,
    })
    .waitFor();
  assert.equal(await page.locator(".organization-school-card").count(), 7);
  await page.screenshot({
    path: "/tmp/peoplehub-organization.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Employee directory", exact: true })
    .click();
  assert.equal(await page.locator(".people-card").count(), 48);
  await page.getByLabel("Filter school section").selectOption("6");
  assert.equal(await page.locator(".people-card").count(), 6);
  await page.getByLabel("Filter school section").selectOption("all");
  await page.screenshot({
    path: "/tmp/peoplehub-hr-directory.png",
    fullPage: true,
  });
  await page.screenshot({ path: "/tmp/peoplehub-hr-directory-hero.png" });
  await page.getByLabel("Search records").fill("Amara");
  assert.equal(await page.locator(".people-card").count(), 1);
  await page
    .getByRole("button", { name: "Amara Wanjiku", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Amara Wanjiku", exact: true })
    .waitFor();
  await page.screenshot({
    path: "/tmp/peoplehub-hr-profile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  await page
    .getByLabel("Phone (optional)", { exact: true })
    .fill("DEMO-BROWSER-EDIT");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForTimeout(300);
  if (await page.locator(".people-alert").count())
    throw Error(
      (await page.locator(".people-alert").allTextContents()).join("; "),
    );
  await page.getByText("Profile updated", { exact: true }).waitFor();
  assert.ok(
    await page.getByText("DEMO-BROWSER-EDIT", { exact: true }).isVisible(),
  );
  await page.getByRole("button", { name: /^Qualifications/ }).click();
  await page
    .getByRole("button", { name: "Add qualification", exact: true })
    .click();
  await page.getByLabel("Qualification title").fill("Browser demo credential");
  await page.getByLabel("Awarding institution").fill("Demo Training Institute");
  await page.getByLabel("Award date").fill("2025-01-01");
  await page.getByRole("button", { name: "Save qualification" }).click();
  await page
    .getByRole("heading", { name: "Browser demo credential" })
    .waitFor();
  await page
    .getByRole("button", { name: "Edit Browser demo credential", exact: true })
    .click();
  await page.getByLabel("HR verification").selectOption("true");
  await page.getByRole("button", { name: "Save qualification" }).click();
  await page.getByText("Qualification recorded", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Attendance", exact: true }).click();
  await page
    .getByRole("heading", { name: "A clear record of the working day" })
    .waitFor();
  await page.screenshot({
    path: "/tmp/peoplehub-hr-attendance.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "All colleagues" }).click();
  await page.getByLabel("Search records").fill("");
  await page.getByRole("button", { name: /Attendance connections/ }).click();
  await page
    .getByRole("button", { name: "Register device", exact: true })
    .click();
  await page.getByLabel("Device name").fill("Offline demonstration terminal");
  await page
    .getByRole("button", { name: "Register device", exact: true })
    .last()
    .click();
  await page
    .getByText("DEMONSTRATION ONLY — not a device credential", { exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Enroll employee", exact: true })
    .click();
  await page.getByLabel("Vendor employee reference").fill("DEMO-EXTERNAL-001");
  await page.getByRole("button", { name: "Save enrollment" }).click();
  await page.getByText("Enrollment recorded", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Employee directory", exact: true })
    .click();
  await page.getByRole("button", { name: "Add employee", exact: true }).click();
  await page
    .getByLabel("Full name", { exact: true })
    .fill("Browser Test Colleague");
  await page
    .getByLabel("Work email", { exact: true })
    .fill("browser.colleague@example.test");
  await page
    .getByLabel("Job title", { exact: true })
    .fill("Teaching Assistant");
  await page.getByLabel("Department", { exact: true }).fill("Academics");
  await page.getByRole("button", { name: "Create employee" }).click();
  await page.getByText("Employee created", { exact: true }).waitFor();
  await page.getByLabel("Search records").fill("Browser Test Colleague");
  await page
    .getByRole("button", { name: "Browser Test Colleague", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Record attendance", exact: true })
    .click();
  await page
    .getByLabel("Reason for manual entry")
    .fill("Browser test manual clock-in");
  await page.getByRole("button", { name: "Save attendance event" }).click();
  await page.getByText("Attendance event saved", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Attendance", exact: true }).click();
  assert.ok(
    await page
      .getByText("Browser test manual clock-in", { exact: true })
      .isVisible(),
  );
  await page.getByRole("button", { name: "All colleagues" }).click();
  await page.getByLabel("Search records").fill("");

  await page
    .getByRole("button", { name: "Employee directory", exact: true })
    .click();
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.screenshot({
    path: "/tmp/peoplehub-hr-directory-dark.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Mobile directory overflow",
  );
  await page.screenshot({
    path: "/tmp/peoplehub-hr-mobile.png",
    fullPage: true,
  });
  await page.getByLabel("Search records").fill("Amara");
  await page
    .getByRole("button", { name: "Amara Wanjiku", exact: true })
    .click();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Mobile profile overflow",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  console.log(
    "PASS: offline HR directory, search, profile, editing, qualification, attendance tab, device registration/enrollment, dark/mobile, no network or JS errors.",
  );
} finally {
  await browser.close();
}
