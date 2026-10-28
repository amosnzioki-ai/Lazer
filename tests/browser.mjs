import "dotenv/config";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:3001/app");
await page.getByLabel("Email address").fill("super_admin@example.test");
await page
  .getByLabel("Password", { exact: true })
  .fill(process.env.SEED_PASSWORD);
await page.getByRole("button", { name: "Sign in securely" }).click();
await page.getByRole("heading", { name: /Good/ }).waitFor();
await page.screenshot({ path: "/tmp/peoplehub-dashboard.png", fullPage: true });
await page.getByRole("button", { name: "People", exact: true }).click();
await page.getByRole("heading", { name: /Good people/ }).waitFor();
await page
  .getByRole("button", { name: "Employee directory", exact: true })
  .click();
await page.getByRole("button", { name: "Add employee", exact: true }).click();
await page.getByRole("dialog").waitFor();
await page.getByRole("button", { name: "Close dialog" }).click();
await page.getByLabel("Search records").fill("Amara");
assert.equal(await page.locator(".people-card").count(), 1);
await page.getByRole("button", { name: /Leave & attendance/ }).click();
await page.getByRole("heading", { name: "Leave & attendance" }).waitFor();
await page.getByRole("button", { name: "Request leave", exact: true }).click();
await page
  .getByLabel("Reason", { exact: true })
  .fill("A browser validation request");
await page.getByRole("button", { name: "Close dialog" }).click();
await page.getByRole("button", { name: "Overview", exact: true }).click();
const mobile = await page.context().newPage();
await mobile.setViewportSize({ width: 390, height: 844 });
await mobile.goto("http://127.0.0.1:3001/app");
await mobile.getByRole("heading", { name: /Good/ }).waitFor();
await mobile.screenshot({ path: "/tmp/peoplehub-mobile.png", fullPage: true });
assert.ok(
  await mobile.evaluate(
    () => document.documentElement.scrollWidth <= innerWidth,
  ),
  "No mobile horizontal page overflow",
);
await mobile.getByRole("button", { name: "Toggle sidebar" }).click();
await mobile.getByRole("button", { name: "Close navigation" }).click();
await mobile.getByRole("button", { name: "People", exact: true }).click();
await mobile.getByRole("heading", { name: /Good people/ }).waitFor();
await page
  .getByRole("button", { name: "Reports & meetings", exact: true })
  .click();
await page.getByRole("heading", { name: /Good conversations/ }).waitFor();
await page.getByRole("button", { name: /Meeting minutes/ }).click();
assert.ok(
  await page
    .getByRole("heading", { name: "Meeting minutes", exact: true })
    .isVisible(),
);
assert.deepEqual(errors, []);
console.log(
  "Browser PASS: login, dashboard, employee search, forms, leave navigation, mobile overflow, no runtime errors.",
);
await browser.close();
