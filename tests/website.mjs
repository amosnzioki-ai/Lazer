import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const base = process.env.WEBSITE_URL || "http://127.0.0.1:3001";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  const apiRequests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api")) apiRequests.push(r.url());
  });
  await page.goto(base);
  await page.getByRole("heading", { name: /Your people/ }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "/tmp/peoplehub-website-desktop.png",
    fullPage: true,
  });
  await page.screenshot({ path: "/tmp/peoplehub-website-hero.png" });
  await page.getByLabel("Preview school filter").selectOption("Athi River");
  assert.equal(
    await page
      .locator(".web-preview-stats>div")
      .first()
      .locator("b")
      .textContent(),
    "3",
  );
  await page.getByLabel("Preview school filter").selectOption("All schools");
  assert.equal(
    await page
      .locator(".web-preview-stats>div")
      .first()
      .locator("b")
      .textContent(),
    "21",
  );
  await page
    .getByText("Does it include students or school fees?", { exact: true })
    .click();
  assert.ok(
    await page
      .getByText("No. PeopleHub is exclusively", { exact: false })
      .isVisible(),
  );
  const download = await page.request.get(base + "/peoplehub-overview.txt");
  assert.equal(download.status(), 200);
  assert.ok((await download.text()).includes("KISC PEOPLEHUB"));
  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(base);
  await mobile.evaluate(() => document.fonts.ready);
  assert.ok(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Mobile page should not overflow",
  );
  await mobile.getByRole("button", { name: "Open menu" }).click();
  await mobile
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "FAQs" })
    .click();
  assert.equal(
    await mobile
      .getByRole("button", { name: "Open menu" })
      .getAttribute("aria-expanded"),
    "false",
  );
  await mobile.goto(base);
  await mobile.screenshot({
    path: "/tmp/peoplehub-website-mobile.png",
    fullPage: true,
  });
  await mobile.screenshot({ path: "/tmp/peoplehub-website-mobile-hero.png" });
  assert.deepEqual(errors, []);
  assert.deepEqual(apiRequests, []);
  console.log(
    "Website PASS: desktop/mobile rendering, menu, FAQ, school filter, download, no backend dependency, no desktop runtime errors.",
  );
} finally {
  await browser.close();
}
