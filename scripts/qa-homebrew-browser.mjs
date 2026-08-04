import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "../../../packages/forge/node_modules/playwright/index.mjs";

const baseUrl = process.env.TRADE_BINDER_QA_URL || "http://127.0.0.1:4173/trade-binder/?scope=homebrew";
const outputDirectory = process.env.TRADE_BINDER_QA_OUTPUT || "/tmp/trade-binder-homebrew-qa";
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const errors = [];
const failedRequests = [];

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await desktop.newPage();
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText}`));
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator(".card-tile").first().waitFor();

  assert.equal(await page.title(), "Trade Binder");
  assert.match(await page.locator(".owned-summary").innerText(), /1,191/);
  assert.match(await page.locator(".browse-heading").innerText(), /563 cards found/);
  assert.equal(await page.getByRole("button", { name: "Grouped" }).getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth), true);
  await page.screenshot({ path: resolve(outputDirectory, "homebrew-grouped-desktop.png") });

  const search = page.getByRole("searchbox", { name: "Search cards" });
  await search.fill("Ancients' Data Archive");
  await page.locator(".browse-heading h2").filter({ hasText: "1 cards found" }).waitFor();
  const tile = page.locator(".card-tile").first();
  assert.match(await tile.locator(".variant-controls").innerText(), /1\s*\/\s*3/);
  assert.match(await tile.locator(".print-line").innerText(), /Primary Remaster Draft/);
  await tile.hover();
  await page.waitForTimeout(180);
  assert.equal(await tile.getByRole("button", { name: /Next variant/ }).evaluate((button) => getComputedStyle(button).opacity), "1");
  await tile.getByRole("button", { name: /Next variant/ }).click();
  await tile.locator(".print-line").filter({ hasText: "Borderless Full Art" }).waitFor();
  assert.match(await tile.locator(".variant-controls").innerText(), /2\s*\/\s*3/);

  const frontSource = await tile.locator(".image-button img").getAttribute("src");
  await tile.getByRole("button", { name: /Show back face/ }).click();
  const backSource = await tile.locator(".image-button img").getAttribute("src");
  assert.notEqual(backSource, frontSource);
  assert.match(backSource || "", /face-1\.jpg/);
  await tile.getByRole("button", { name: /Preview/ }).click();
  const dialog = page.getByRole("dialog");
  assert.match(await dialog.getByRole("heading", { level: 2 }).innerText(), /Repository of Knowledge/);
  await dialog.getByRole("button", { name: /Show front/ }).click();
  assert.match(await dialog.locator(".preview-image-stage img").getAttribute("src") || "", /face-0\.jpg/);
  await dialog.locator(".dialog-selection").click();
  assert.equal(await dialog.getByRole("checkbox", { name: /Remove .* for export/ }).isChecked(), true);
  assert.match(await page.locator(".trade-tray").innerText(), /1 card/);
  await dialog.getByRole("button", { name: "Close card preview" }).click();

  await page.getByRole("button", { name: "All variants" }).click();
  await page.locator(".browse-heading h2").filter({ hasText: "3 variants found" }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get("variants"), "separate");
  assert.equal(new URL(page.url()).searchParams.get("scope"), "homebrew");
  assert.equal(new URL(page.url()).searchParams.get("q"), "Ancients' Data Archive");

  await page.getByRole("button", { name: /Filters/ }).click();
  assert.match(await page.getByRole("heading", { name: /Find the exact card or variant/ }).innerText(), /card or variant/);
  const exportPolicy = page.getByLabel("Export policy");
  await exportPolicy.selectOption("optional");
  await page.getByRole("button", { name: "Show matching cards" }).click();
  await page.locator(".browse-heading h2").filter({ hasText: "2 variants found" }).waitFor();
  await page.screenshot({ path: resolve(outputDirectory, "homebrew-desktop.png"), fullPage: true });

  await page.keyboard.press("Home");
  await page.keyboard.press("Tab");
  const focusedLabel = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || "");
  assert.ok(focusedLabel.trim().length > 0, "keyboard focus must land on a named control");
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const mobilePage = await mobile.newPage();
  mobilePage.on("console", (message) => { if (message.type() === "error") errors.push(`mobile: ${message.text()}`); });
  mobilePage.on("pageerror", (error) => errors.push(`mobile: ${error.message}`));
  mobilePage.on("requestfailed", (request) => failedRequests.push(`mobile: ${request.method()} ${request.url()} — ${request.failure()?.errorText}`));
  await mobilePage.goto(baseUrl, { waitUntil: "networkidle" });
  await mobilePage.locator(".card-tile").first().waitFor();
  assert.equal(await mobilePage.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth), true);
  assert.equal(await mobilePage.locator(".mobile-nav").isVisible(), true);
  const mobileVariantTile = mobilePage.locator(".card-tile:has(.variant-controls)").first();
  assert.equal(await mobileVariantTile.locator(".variant-controls button").first().evaluate((button) => getComputedStyle(button).opacity), "1");
  await mobilePage.screenshot({ path: resolve(outputDirectory, "homebrew-mobile.png") });
  await mobile.close();

  assert.deepEqual(errors, []);
  assert.deepEqual(failedRequests, []);
  console.log(JSON.stringify({ baseUrl, screenshots: [resolve(outputDirectory, "homebrew-grouped-desktop.png"), resolve(outputDirectory, "homebrew-desktop.png"), resolve(outputDirectory, "homebrew-mobile.png")], consoleErrors: errors.length, failedRequests: failedRequests.length }, null, 2));
} finally {
  await browser.close();
}
