import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
  headless: true,
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: "light",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const base = process.env.WEBSITE_URL || "http://127.0.0.1:3001";
  await page.goto(base);
  await page.getByRole("heading", { name: /Your people/ }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  await page.screenshot({
    path: "/tmp/peoplehub-business-light.png",
    fullPage: true,
  });
  await page.screenshot({ path: "/tmp/peoplehub-business-light-hero.png" });
  await page.getByRole("tab", { name: "School team", exact: true }).click();
  assert.equal(
    await page
      .getByRole("tab", { name: "School team", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  assert.ok(
    await page
      .getByRole("heading", { name: "Your school. Your people." })
      .isVisible(),
  );
  await page
    .getByRole("tab", { name: "School team", exact: true })
    .press("ArrowRight");
  assert.ok(
    await page
      .getByRole("heading", { name: "Your working day, simplified." })
      .isVisible(),
  );
  await page.getByRole("tab", { name: "Head office", exact: true }).click();
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.reload();
  await page.getByRole("heading", { name: /Your people/ }).waitFor();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.screenshot({
    path: "/tmp/peoplehub-business-dark.png",
    fullPage: true,
  });
  await page.screenshot({ path: "/tmp/peoplehub-business-dark-hero.png" });
  const mobile = await context.newPage();
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(base);
  await mobile.getByRole("heading", { name: /Your people/ }).waitFor();
  for (const theme of ["dark", "light"]) {
    if ((await mobile.locator("html").getAttribute("data-theme")) !== theme)
      await mobile
        .getByRole("button", { name: "Switch to " + theme + " theme" })
        .click();
    assert.ok(
      await mobile.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      theme + " mobile overflow",
    );
    await mobile.screenshot({
      path: "/tmp/peoplehub-business-" + theme + "-mobile.png",
      fullPage: true,
    });
    await mobile.screenshot({
      path: "/tmp/peoplehub-business-" + theme + "-mobile-hero.png",
    });
  }
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
  assert.deepEqual(errors, []);
  console.log(
    "PASS: light/dark desktop and mobile, persistence, keyboard role tabs, mobile navigation, no runtime errors.",
  );
} finally {
  await browser.close();
}
