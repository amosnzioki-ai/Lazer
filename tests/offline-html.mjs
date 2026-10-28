import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
  headless: true,
});
try {
  const context = await browser.newContext({ offline: true });
  const page = await context.newPage();
  const errors = [];
  const external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) external.push(r.url());
  });
  await page.setContent(
    await readFile(new URL("../KISC-PeopleHub.html", import.meta.url), "utf8"),
  );
  await page.getByRole("heading", { name: /Your people/ }).waitFor();
  await page.getByLabel("Preview school filter").selectOption("Athi River");
  assert.equal(
    await page
      .locator(".web-preview-stats>div")
      .first()
      .locator("b")
      .textContent(),
    "3",
  );
  await page
    .getByText("Does it include students or school fees?", { exact: true })
    .click();
  assert.ok(
    await page
      .getByText("No. PeopleHub is exclusively", { exact: false })
      .isVisible(),
  );
  assert.ok(
    (
      await page
        .getByRole("link", { name: /Download the project overview/ })
        .getAttribute("href")
    ).startsWith("data:text/plain"),
  );
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: Self-contained HTML renders offline, fonts embedded, filter/FAQ/download work, no network requests or runtime errors.",
  );
} finally {
  await browser.close();
}
