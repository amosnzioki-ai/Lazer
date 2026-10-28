import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
  headless: true,
});
try {
  const context = await browser.newContext({
    offline: true,
    viewport: { width: 1440, height: 1100 },
    colorScheme: "light",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent(
    await readFile(
      new URL("../KISC-PeopleHub-HR.html", import.meta.url),
      "utf8",
    ),
  );
  await page
    .getByRole("heading", {
      name: "Head Office & Group Leadership",
      exact: true,
    })
    .waitFor();
  assert.equal(await page.locator(".organization-school-card").count(), 7);
  await page.screenshot({
    path: "/tmp/kisc-organized-teams.png",
    fullPage: true,
  });
  await page.screenshot({ path: "/tmp/kisc-organized-teams-hero.png" });
  const athi = page
    .locator(".organization-school-card")
    .filter({
      has: page.getByRole("heading", { name: "Athi River", exact: true }),
    });
  await athi
    .getByRole("button", {
      name: "Add Support staff to Athi River",
      exact: true,
    })
    .click();
  assert.equal(
    await page
      .getByLabel("Office / school section", { exact: true })
      .inputValue(),
    "6",
  );
  assert.equal(
    await page.getByLabel("Staff group", { exact: true }).inputValue(),
    "Support",
  );
  await page.getByLabel("Full name", { exact: true }).fill("Demo Athi Support");
  await page
    .getByLabel("Work email", { exact: true })
    .fill("athi.support@example.test");
  await page.getByLabel("Job title", { exact: true }).fill("School Driver");
  await page.getByLabel("Department", { exact: true }).fill("Transport");
  await page
    .getByRole("button", { name: "Create employee", exact: true })
    .click();
  await page.getByText("Employee created", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Filter school section").inputValue(),
    "6",
  );
  await page
    .getByRole("button", { name: "Demo Athi Support", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Demo Athi Support", exact: true })
    .waitFor();
  assert.ok(
    await page
      .locator(".people-details")
      .getByText("Support staff", { exact: true })
      .isVisible(),
  );
  await page
    .getByRole("button", { name: "All colleagues", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Our organization", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add head office colleague", exact: true })
    .click();
  assert.equal(
    await page
      .getByLabel("Office / school section", { exact: true })
      .inputValue(),
    "head-office",
  );
  assert.equal(
    await page.getByLabel("Staff group", { exact: true }).inputValue(),
    "Leadership",
  );
  await page.getByLabel("Full name", { exact: true }).fill("Demo Group Leader");
  await page
    .getByLabel("Work email", { exact: true })
    .fill("group.leader@example.test");
  await page
    .getByLabel("Job title", { exact: true })
    .fill("Group Operations Director");
  await page.getByLabel("Department", { exact: true }).fill("Operations");
  await page
    .getByRole("button", { name: "Create employee", exact: true })
    .click();
  await page.getByText("Employee created", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Filter school section").inputValue(),
    "head-office",
  );
  assert.equal(await page.locator(".people-card").count(), 7);
  await page
    .getByRole("button", { name: "Demo Group Leader", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  assert.equal(
    await page.getByLabel("School / office", { exact: true }).inputValue(),
    "head-office",
  );
  await page.getByLabel("Staff group", { exact: true }).selectOption("Support");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByText("Profile updated", { exact: true }).waitFor();
  assert.ok(
    await page
      .locator(".people-details")
      .getByText("Support staff", { exact: true })
      .isVisible(),
  );
  await page
    .getByRole("button", { name: "All colleagues", exact: true })
    .click();
  await page.screenshot({ path: "/tmp/kisc-central-team.png", fullPage: true });
  await page
    .getByRole("button", { name: "Add & assign staff", exact: true })
    .click();
  await page
    .getByLabel("Office / school section", { exact: true })
    .selectOption("7");
  await page
    .getByLabel("Staff group", { exact: true })
    .selectOption("Teaching");
  await page.screenshot({ path: "/tmp/kisc-add-assign.png", fullPage: true });
  await page
    .getByRole("button", { name: "Our organization", exact: true })
    .click();
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: "/tmp/kisc-organized-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: school/support context-add, central leadership creation/edit, separate office placement, add/assign section, dark/mobile and no JS errors.",
  );
} finally {
  await browser.close();
}
