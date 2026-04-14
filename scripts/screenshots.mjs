/**
 * Zarpay screenshot capture.
 *
 * Boots Playwright headless Chromium against http://localhost:3010, walks the
 * public, sender, KYC, and admin surfaces with the seeded demo accounts, and
 * writes PNGs to docs/screenshots/.
 *
 * Run the dev server first:
 *   pnpm db:up && pnpm db:seed && pnpm dev
 *
 * Then in another terminal:
 *   node scripts/screenshots.mjs
 */

import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "docs/screenshots");
const BASE = process.env.ZARPAY_BASE ?? "http://localhost:3010";
const VIEWPORT = { width: 1440, height: 900 };

const skipped = [];

async function shot(page, name, opts = {}) {
  try {
    const filePath = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: opts.fullPage ?? false });
    console.log(`  ok ${name}.png`);
  } catch (err) {
    skipped.push({ name, reason: err.message });
    console.log(`  skip ${name}.png (${err.message})`);
  }
}

async function shotElement(page, selector, name) {
  try {
    const locator = page.locator(selector).first();
    await locator.waitFor({ state: "visible", timeout: 5000 });
    const filePath = path.join(OUT, `${name}.png`);
    await locator.screenshot({ path: filePath });
    console.log(`  ok ${name}.png`);
  } catch (err) {
    skipped.push({ name, reason: err.message });
    console.log(`  skip ${name}.png (${err.message})`);
  }
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL("**/dashboard", { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState("networkidle");
}

async function logout(page) {
  // Click any "Log out" button on the page (sender or admin nav). Catch errors
  // so a missing button does not stop the rest of the run.
  try {
    await page.click('button:has-text("Log out")', { timeout: 3000 });
    await page.waitForURL(`${BASE}/`, { timeout: 5000 });
  } catch {
    // Fall back to clearing cookies and going home.
    await page.context().clearCookies();
    await page.goto(`${BASE}/`);
  }
}

async function settle(page, ms = 600) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log(`Capturing screenshots against ${BASE}`);
  console.log(`Output: ${OUT}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await context.newPage();

  // ---- Public ----
  console.log("Public surfaces");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await settle(page, 800);
  await shot(page, "01-landing");

  // Calculator close up: locate the card containing "You send" and screenshot it
  await shotElement(
    page,
    '.rounded-xl:has(label:has-text("You send"))',
    "02-rate-breakdown",
  );

  // ---- Sender flow ----
  console.log("Sender (sender@zarpay.dev)");
  await login(page, "sender@zarpay.dev", "password123");
  await settle(page);
  await shot(page, "03-sender-dashboard");

  await page.goto(`${BASE}/send`, { waitUntil: "networkidle" });
  await settle(page);
  await shot(page, "04-send-amount");

  // Scroll to the review section to capture the full breakdown
  try {
    await page.locator('h3:has-text("3. Review")').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  } catch {}
  await shot(page, "05-send-review", { fullPage: true });

  await page.goto(`${BASE}/transfers`, { waitUntil: "networkidle" });
  await settle(page);
  await shot(page, "07-transfer-history");

  // Click the first transfer detail link in the list
  try {
    const firstView = page.locator('a:has-text("View →")').first();
    await firstView.waitFor({ state: "visible", timeout: 5000 });
    await firstView.click();
    await page.waitForURL("**/transfers/**", { timeout: 5000 });
    await settle(page);
    await shot(page, "06-transfer-detail", { fullPage: true });
  } catch (err) {
    skipped.push({ name: "06-transfer-detail", reason: err.message });
    console.log(`  skip 06-transfer-detail.png (${err.message})`);
  }

  await page.goto(`${BASE}/recipients`, { waitUntil: "networkidle" });
  await settle(page);
  await shot(page, "08-recipients");

  await logout(page);

  // ---- Pending KYC ----
  console.log("KYC pending (yusuf@example.com)");
  await login(page, "yusuf@example.com", "password123");
  await settle(page);
  await shot(page, "09-kyc-pending");
  await logout(page);

  // ---- Admin ----
  console.log("Admin (admin@zarpay.dev)");
  await login(page, "admin@zarpay.dev", "password123");

  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await settle(page);
  await shot(page, "10-admin-dashboard");

  await page.goto(`${BASE}/admin/kyc`, { waitUntil: "networkidle" });
  await settle(page);
  await shot(page, "11-admin-kyc-queue");

  await page.goto(`${BASE}/admin/transfers`, { waitUntil: "networkidle" });
  await settle(page);
  await shot(page, "12-admin-transfers");

  await page.goto(`${BASE}/admin/rates`, { waitUntil: "networkidle" });
  await settle(page);
  await shot(page, "13-admin-rates");

  await page.goto(`${BASE}/admin/compliance`, { waitUntil: "networkidle" });
  await settle(page);
  await shot(page, "14-admin-compliance");

  await browser.close();

  console.log("");
  if (skipped.length > 0) {
    console.log(`Skipped (${skipped.length}):`);
    for (const s of skipped) console.log(`  - ${s.name}: ${s.reason}`);
  } else {
    console.log("All 14 screenshots captured.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
