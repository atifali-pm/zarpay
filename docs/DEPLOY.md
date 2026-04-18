# Zarpay deploy + future-app playbook

Two parts.

1. **Zarpay specific deploy steps** — take the existing Next.js app and the existing Expo mobile app from "runs on localhost" to "runs on a public URL anyone can hit, with an APK installable from a GitHub release and the mobile app talking to that public URL." Total monthly cost target: **$0.**
2. **Reusable checklist for the next project** — same shape, different repo. Includes the iOS development story (free path + paid path) so you know exactly what $99 buys and whether you need to pay it.

---

## Part 1. Zarpay deploy

### One-time accounts (all free tier, about 10 minutes)

| Service | Role | Free allowance | Sign up |
|---|---|---|---|
| Vercel | Next.js host | 100 GB bandwidth/month, unlimited serverless, no cold-start penalty on hot paths | vercel.com (sign in with GitHub) |
| Neon | PostgreSQL | 0.5 GB storage, auto-pause when idle, no deletion | neon.tech (sign in with GitHub) |
| Vercel Blob | KYC document storage | 1 GB storage, 5 GB bandwidth | enabled from Vercel project settings |
| Resend | Transactional email | 100 emails/day, 3k/month | resend.com (sign in with GitHub) |
| GitHub Releases | APK distribution | Unlimited | already have it |

No Stripe sign-up needed for the demo; sandbox mode works on the existing test keys. No Twilio needed; the dev OTP provider stays wired.

### Step 1. Neon database

1. Sign in to neon.tech with GitHub.
2. Create a project called `zarpay`.
3. Region: EU West (Frankfurt or London) — closer to Vercel Frankfurt than US.
4. Postgres version: 16 (matches local Docker).
5. Copy the connection string from the dashboard. It looks like:
   ```
   postgresql://user:password@ep-xyz-123.eu-west-1.aws.neon.tech/zarpay?sslmode=require
   ```
6. In a fresh terminal, run migrations against it:
   ```bash
   DATABASE_URL="paste-the-neon-url" pnpm prisma migrate deploy
   DATABASE_URL="paste-the-neon-url" pnpm prisma db seed
   ```
7. Verify with `pnpm prisma studio --browser none` (same URL in env) or `psql "$DATABASE_URL" -c "select count(*) from users;"` — should return 8.

### Step 2. Vercel project

1. Sign in to vercel.com with GitHub.
2. Import the `atifali-pm/zarpay` repo.
3. Framework preset: Next.js (auto-detected).
4. Root directory: `.` (keep default).
5. **Build command override:** `pnpm install --frozen-lockfile && pnpm --filter @zarpay/types build && pnpm prisma generate && pnpm build`
   - The filter step is only needed if you add a build script to `@zarpay/types`. If it is header-only TypeScript (declarations), drop that filter.
6. **Install command override:** `pnpm install --frozen-lockfile`
7. Before the first deploy, add these env vars under **Settings → Environment Variables** (Production + Preview):
   ```
   DATABASE_URL              <neon connection string from step 1>
   AUTH_SECRET               <openssl rand -base64 32>
   NEXTAUTH_URL              https://<your-vercel-app>.vercel.app
   RESEND_API_KEY            <from resend.com after step 4>
   STRIPE_SECRET_KEY         sk_test_...           (keep sandbox for demo)
   STRIPE_WEBHOOK_SECRET     whsec_test_...        (from Stripe CLI / dashboard)
   KYC_STORAGE_PROVIDER      vercel_blob
   BLOB_READ_WRITE_TOKEN     <auto-injected after step 3 below>
   NODE_ENV                  production
   ```
8. Deploy. First build takes about 2 minutes.
9. The app lands at `https://zarpay-<hash>.vercel.app`. Add a cleaner alias from **Settings → Domains** (e.g. `zarpay-demo.vercel.app`) and update `NEXTAUTH_URL` to match.

### Step 3. Vercel Blob (KYC storage)

1. In the Vercel project, go to **Storage → Create Blob Store → zarpay-kyc**.
2. Vercel auto-injects `BLOB_READ_WRITE_TOKEN` into the project env.
3. In the Zarpay repo, add a new provider that implements the existing `KycStorageProvider` interface against `@vercel/blob`. Roughly:
   ```ts
   // src/lib/kyc-storage/vercel-blob.ts
   import { put } from "@vercel/blob";
   import type { KycStorageProvider } from "./types";
   export const vercelBlobKycStorage: KycStorageProvider = {
     async store(file, path) {
       const blob = await put(path, file, { access: "private" });
       return { url: blob.url, pathname: blob.pathname };
     },
     async read(pathname) { /* GET via @vercel/blob head/fetch */ },
   };
   ```
4. In `src/lib/kyc-storage/index.ts`, switch on `process.env.KYC_STORAGE_PROVIDER`:
   ```ts
   export const kycStorage =
     process.env.KYC_STORAGE_PROVIDER === "vercel_blob"
       ? vercelBlobKycStorage
       : localKycStorage;
   ```
5. Add `@vercel/blob` to `package.json` dependencies and redeploy.

### Step 4. Resend (email)

1. Sign in to resend.com with GitHub.
2. Verify a domain, or use the sandbox `onboarding@resend.dev` for the demo.
3. Create an API key.
4. Paste it as `RESEND_API_KEY` in Vercel env.
5. Already wired in the existing `ResendEmailProvider` — no code change needed.

### Step 5. Mobile app points at the public URL

1. In `mobile/app.json`, change `extra.apiUrl` to the Vercel URL:
   ```json
   "extra": {
     "apiUrl": "https://zarpay-demo.vercel.app",
     ...
   }
   ```
2. Commit and push.
3. Rebuild the APK:
   ```bash
   cd mobile
   eas build -p android --profile preview
   ```
4. Wait for the EAS build to finish (~5 minutes on free tier queue).
5. Download the new APK from the EAS build page.

### Step 6. GitHub Release for the APK

1. From the zarpay repo root:
   ```bash
   gh release create v0.1.0-mobile \
     --title "Zarpay mobile v0.1.0 (Android preview)" \
     --notes "Native Android build. Installs from APK, points at https://zarpay-demo.vercel.app. See README for features." \
     ./path/to/zarpay-preview.apk
   ```
2. Add the release URL + QR code to `README.md` under a "Download the app" section.
3. Generate a QR code from the release URL:
   ```bash
   qrencode -o docs/apk-qr.png "https://github.com/atifali-pm/zarpay/releases/latest"
   ```
   (Install `qrencode` via `sudo apt install qrencode` if missing.)

### Step 7. Smoke test

1. Hit `https://zarpay-demo.vercel.app` in a browser, log in with `sender@zarpay.dev / password123`, walk the send flow.
2. Install the APK on your phone (enable "Install from unknown sources").
3. Log in with the same credentials. Create a transfer. Confirm the payment shows in the operations panel via the same Vercel URL (`/admin`).
4. Open the Neon dashboard, confirm the new rows landed in `transfers` and `transfer_events`.

---

## Part 2. Reusable playbook for future apps

Same pattern, any new app. Works for any Next.js / Nest.js / FastAPI / Express backend and any Expo / React Native / Flutter mobile.

### Free-tier stack

| Layer | Default choice | Why |
|---|---|---|
| Backend host | Vercel (if Next.js), Fly.io (if Docker / FastAPI / Nest.js) | Both have truly free tiers with no expiry for small apps. |
| Database | Neon (Postgres) or Turso (SQLite for single-table apps) | No deletion policy, auto-pauses when idle. |
| Object storage | Cloudflare R2 (10 GB free, zero egress) or Vercel Blob (1 GB free) | R2 scales further, Blob is simpler when already on Vercel. |
| Email | Resend (100/day) | Modern API, React email templates. |
| Auth | Next.js NextAuth v5 (or Better Auth) with providers free tier | GitHub OAuth, Google OAuth, credentials all $0. |
| SMS / OTP | Keep a dev stub for the demo. Twilio trial credit is small and expires. | Flip to Twilio only when live users arrive. |
| Mobile distribution | GitHub Releases for APK + Expo Web mirror on Vercel | Permanent, zero cost, bypasses EAS build limit after first APK. |
| Build / CI | GitHub Actions for public repos (unlimited), Codemagic (500 min/month), Bitrise (300 builds/month) | All have free tiers that cover a demo. |

### Repo-to-demo in one weekend (pattern)

1. **Day one: backend**
   - Scaffold the app.
   - Set up Prisma + Neon connection string early, migrate.
   - Deploy a "hello" route to Vercel before writing anything real — catches env var and build config issues while the diff is small.
2. **Day two: mobile or web client**
   - Point `apiUrl` env at the Vercel URL from the start.
   - Build in feature slices: one endpoint, one screen, one commit.
3. **Day three: polish + distribute**
   - EAS build once.
   - GitHub Release the APK.
   - Add README screenshots + download QR.
   - Update portfolio package.

The pattern holds because every piece has a zero-cost free tier with no expiry, and the provider interfaces mean each third-party is a swap not a rewrite.

### Secrets hygiene

- Every secret in `.env` must also be in `.env.example` with a placeholder. `.env.example` is committed; `.env` is not.
- Vercel env vars live in the project dashboard. Add them to Preview and Production both.
- Prefer `openssl rand -base64 32` for auth secrets. Never reuse a secret between projects.
- If a secret leaks, rotate on the provider dashboard first, then update Vercel, then redeploy.

---

## Part 3. iOS app development setup

Separate section because iOS has a binary free/paid split that Android does not.

### What you need before anything

- A Mac. iOS builds require Xcode, which is macOS-only. EAS Build can do iOS builds on Expo's cloud Macs so you do not strictly need your own, but local debugging is much faster with a Mac on hand.
- Xcode from the Mac App Store (~10 GB).
- `xcode-select --install` for command line tools.

### Free path (no Apple Developer account, $0/year)

**What you can do:**
- Run the app in the iOS Simulator via `npx expo run:ios` or `eas build -p ios --profile simulator`. The simulator build outputs a `.app` file that you drag into Simulator.
- Sideload onto **your own** physical device using "Personal Team" free provisioning in Xcode.
  - Open `ios/<AppName>.xcworkspace` in Xcode.
  - **Signing & Capabilities → Team → Add an Apple ID.**
  - Plug in your iPhone over USB.
  - Hit Run.

**What you cannot do:**
- Distribute to anyone else's device.
- Use TestFlight.
- Submit to the App Store.
- Keep the build installed for more than **7 days** — Personal Team provisioning profiles expire weekly. The app stops launching. You re-sign from Xcode.
- Install on more than 3 devices per week per Apple ID.

**When this is the right path:** building a demo you test on your own iPhone, showing it in person or over screen share, or just validating the iOS layout before paying for distribution. Perfectly fine for a portfolio if you are not distributing the build publicly.

### Paid path (Apple Developer Program, $99/year)

**What the $99 buys:**
- Signing certificates that last a year (no weekly re-sign).
- **TestFlight** distribution — up to 10,000 external testers, email invite or public link. Builds live 90 days.
- App Store submission.
- Up to 100 development devices and 100 Ad-Hoc devices per year.
- DeviceCheck, push notification entitlements, App Clips, etc.

**How to enrol:**
1. Go to developer.apple.com/programs.
2. Sign in with the Apple ID you want to publish under (use a dedicated one, not personal, if you plan to keep it for years).
3. Complete the enrolment form. Individuals get approved in 24 hours usually. Company enrolment needs a DUNS number (free lookup) and takes longer.
4. Pay $99 / £79 / the local equivalent. Billed yearly, auto-renews.

**First iOS build after enrolment:**
```bash
cd mobile
eas credentials            # generates signing certificates + provisioning profiles
eas build -p ios --profile preview       # builds a .ipa for ad-hoc / internal
eas build -p ios --profile production    # builds for App Store
eas submit -p ios --latest               # pushes latest build to App Store Connect
```
Expo handles the credential dance for you. You do not hand-edit provisioning profiles unless you want to.

### Which path for Zarpay today

Skip the $99. Reasons:

- No distribution need. The Android APK covers the demo story.
- Personal Team sideload works for your own iPhone if you want to test the iOS layout.
- Expo Web on Vercel renders the mobile UI in a browser and serves as an iOS-style preview for stakeholders without any Apple involvement.
- $99/year is better spent when you have a real app shipping to real users.

Revisit if: you decide to publish the real product, or you need TestFlight for a stakeholder review, or you want the iOS portfolio shot to come from a TestFlight-installed build rather than the web render.

---

## Part 4. EAS build credits, in plain numbers

For reference so you can budget your build allowance across projects.

| Plan | Monthly Android builds | Monthly iOS builds | Cost |
|---|---|---|---|
| Free | 30 | 30 | $0 |
| Production | Unlimited (shared queue) | Unlimited | $29/month |
| On-demand | Metered | Metered | Pay per build |

Your 30 Android builds per month are shared across all your EAS projects. If DriveBid burns through them, you cannot rebuild Zarpay that month.

**Ways to stretch free-tier builds:**
- **Build locally.** `eas build -p android --local` runs the build on your machine. Does not count against the cloud quota. Requires the Android SDK locally, but you only do this for hot iteration.
- **OTA updates via `eas update`.** Once an APK is installed, JS-only changes can be pushed as an OTA update without a new build. Native module changes still need a full build. Zarpay is currently mostly JS so OTA covers most future changes.
- **Share one build across phones.** The APK from one EAS build installs on any Android phone. One build for a demo to five people is fine.

**When to actually pay:**
- Shipping to production with multiple developers and frequent native changes. $29/month pays itself back on the first week you ship daily.
- App Store submission workflow where you want the "submit" step handled by Expo. `eas submit` on a paid plan.
