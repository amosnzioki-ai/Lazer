import "dotenv/config";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
  headless: true,
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3001/app");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.getByLabel("Email address").fill("super_admin@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.SEED_PASSWORD);
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await page.getByRole("heading", { name: /Good/ }).waitFor();
  await page.screenshot({
    path: "/tmp/peoplehub-dashboard-dark.png",
    fullPage: true,
  });
  await page.reload();
  await page.getByRole("heading", { name: /Good/ }).waitFor();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto("http://127.0.0.1:3001/app");
  await mobile.getByRole("heading", { name: /Good/ }).waitFor();
  assert.ok(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await mobile.screenshot({
    path: "/tmp/peoplehub-dashboard-dark-mobile.png",
    fullPage: true,
  });
  console.log(
    "PASS: application/login dark theme, preference retained after sign-in/reload, mobile layout.",
  );
} finally {
  await browser.close();
}
