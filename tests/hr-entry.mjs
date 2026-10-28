import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
  headless: true,
});
try {
  const context = await browser.newContext({ offline: true });
  const page = await context.newPage();
  await page.setContent(
    await readFile(new URL("../KISC-PeopleHub.html", import.meta.url), "utf8"),
  );
  await page.getByRole("heading", { name: /Your people/ }).waitFor();
  await page
    .getByRole("link", { name: "Explore HR demo", exact: true })
    .click();
  await page.getByRole("heading", { name: /Good people/ }).waitFor();
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
  await page
    .getByRole("button", { name: "Back to the PeopleHub website" })
    .click();
  await page.getByRole("heading", { name: /Your people/ }).waitFor();
  console.log(
    "PASS: single-file website opens the integrated HR demo and returns without a server.",
  );
} finally {
  await browser.close();
}
