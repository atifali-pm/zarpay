/**
 * Mobile screenshot capture via Expo Web + Playwright.
 *
 * Boots Playwright headless Chromium at a phone viewport (390x844 = 9:19.5,
 * matching scripts/phone-frame.sh inner screen), signs into the mobile app
 * running at http://localhost:8082 (Expo Web) with the seeded demo sender,
 * and writes raw PNGs to docs/phone-shots/.
 *
 * The backend on 3010 is proxied through Playwright's route handler to sidestep
 * CORS between the two dev servers.
 *
 * Prereqs:
 *   pnpm db:up && pnpm db:seed && pnpm dev          (backend on 3010)
 *   cd mobile && pnpm expo start --web --port 8082  (mobile on 8082)
 *
 * Then:
 *   node scripts/mobile-screenshots.mjs
 */

import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "docs/phone-shots");
const BASE = process.env.ZARPAY_MOBILE_BASE ?? "http://localhost:8082";
const API_BASE = process.env.ZARPAY_API_BASE ?? "http://localhost:3010";
const VIEWPORT = { width: 390, height: 844 };
const EMAIL = process.env.ZARPAY_DEMO_EMAIL ?? "sender@zarpay.dev";
const PASSWORD = process.env.ZARPAY_DEMO_PASSWORD ?? "password123";

async function shot(page, name) {
  const filePath = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  ok ${name}.png`);
}

async function waitForBundle(page) {
  console.log("  waiting for Metro bundle...");
  await page.waitForFunction(
    () => {
      const root = document.getElementById("root");
      return root && root.childElementCount > 0 && root.innerText.length > 0;
    },
    { timeout: 180_000 },
  );
  await page.waitForTimeout(1500);
}

async function tapButton(page, name, { timeout = 10_000 } = {}) {
  // Try role first, then exact text, then fuzzy text.
  const strategies = [
    () => page.getByRole("button", { name, exact: true }),
    () => page.getByText(name, { exact: true }),
    () => page.getByText(name, { exact: false }),
  ];
  let lastErr;
  for (const build of strategies) {
    try {
      const el = build().first();
      await el.waitFor({ state: "visible", timeout: Math.max(2000, timeout / strategies.length) });
      await el.click({ force: true });
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function tapText(page, text, { exact = true, timeout = 10_000 } = {}) {
  const el = page.getByText(text, { exact }).first();
  await el.waitFor({ state: "visible", timeout });
  await el.click({ force: true });
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({
    args: [
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  });

  // Proxy API calls to sidestep CORS between 8082 and 3010.
  await context.route(
    (url) => url.href.startsWith(API_BASE + "/api/"),
    async (route, request) => {
      try {
        const response = await context.request.fetch(request, {
          headers: { ...request.headers() },
          maxRedirects: 0,
        });
        const body = await response.body();
        const headers = { ...response.headers() };
        headers["access-control-allow-origin"] = "*";
        headers["access-control-allow-credentials"] = "true";
        headers["access-control-allow-methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
        headers["access-control-allow-headers"] = "Authorization,Content-Type,Accept";
        await route.fulfill({ status: response.status(), headers, body });
      } catch (err) {
        console.log(`  [route error] ${request.method()} ${request.url()}: ${err.message}`);
        await route.abort();
      }
    },
  );

  const page = await context.newPage();
  page.on("pageerror", (err) => console.log(`  [pageerror] ${err.message}`));

  console.log(`Capturing from ${BASE} into ${OUT}`);

  // --- Boot + signin ---
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await waitForBundle(page);
  await page.goto(`${BASE}/signin`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  console.log("signin");
  const inputs = page.locator("input");
  await inputs.nth(0).waitFor({ state: "visible", timeout: 15_000 });
  await inputs.nth(0).fill(EMAIL);
  await inputs.nth(1).fill(PASSWORD);
  const signInResp = page.waitForResponse(
    (r) => r.url().includes("/api/auth/signin") && r.request().method() === "POST",
    { timeout: 15_000 },
  );
  await tapButton(page, "Log in");
  await signInResp;
  await page.waitForTimeout(5000); // let tabs mount + dashboard load

  // --- 01 dashboard ---
  console.log("01 dashboard");
  await page.waitForTimeout(1500);
  await shot(page, "01-dashboard");

  // --- 02 send amount ---
  console.log("02 send amount");
  await tapText(page, "Send", { timeout: 5000 }).catch(() =>
    page.goto(`${BASE}/send`, { waitUntil: "domcontentloaded" }),
  );
  await page.waitForTimeout(2500);
  // The amount input is already pre-filled with "500" as the default state.
  // Ensure first recipient is selected (it usually is on first load).
  await shot(page, "02-send-amount");

  // --- 03 send review ---
  console.log("03 send review");
  try {
    await tapButton(page, "Review transfer", { timeout: 10_000 });
    await page.waitForTimeout(3500);
    await shot(page, "03-send-review");
  } catch (err) {
    console.log(`  skip 03-send-review: ${err.message}`);
  }

  // --- 05 history ---
  console.log("05 history");
  await tapText(page, "History", { timeout: 5000 }).catch(() =>
    page.goto(`${BASE}/transfers`, { waitUntil: "domcontentloaded" }),
  );
  await page.waitForTimeout(3000);
  await shot(page, "05-history");

  // --- 04 transfer detail (use bounding-box click on a transfer row) ---
  console.log("04 transfer detail");
  try {
    // The transfer list renders Pressable cards. Click the first card by
    // targeting its reference label and going up to its bounding box.
    const firstRef = page.locator("text=/ZP-\\d{4}-/").first();
    await firstRef.waitFor({ state: "visible", timeout: 10_000 });
    const box = await firstRef.boundingBox();
    if (box) {
      // Click slightly inside the row, offset from the text so we hit the card
      // container not the label specifically.
      await page.mouse.click(box.x + box.width / 2, box.y + 40);
    }
    await page.waitForTimeout(3000);
    await shot(page, "04-transfer-detail");
    // Back to tabs
    await page.goBack().catch(() => {});
    await page.waitForTimeout(1500);
  } catch (err) {
    console.log(`  skip 04-transfer-detail: ${err.message}`);
  }

  // --- 06 recipients ---
  console.log("06 recipients");
  await tapText(page, "Recipients", { timeout: 5000 }).catch(() =>
    page.goto(`${BASE}/recipients`, { waitUntil: "domcontentloaded" }),
  );
  await page.waitForTimeout(3000);
  await shot(page, "06-recipients");

  // --- 08 settings ---
  console.log("08 settings");
  await tapText(page, "Settings", { timeout: 5000 }).catch(() =>
    page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" }),
  );
  await page.waitForTimeout(3000);
  await shot(page, "08-settings");

  // --- 07 KYC wizard step 1 (route direct; sender is approved so the tab
  //     normally hides it, but the route still renders).
  console.log("07 KYC");
  try {
    await page.goto(`${BASE}/onboarding/kyc`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await shot(page, "07-kyc");
  } catch (err) {
    console.log(`  skip 07-kyc: ${err.message}`);
  }

  await browser.close();
  console.log(`\nDone. Raw shots in ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
