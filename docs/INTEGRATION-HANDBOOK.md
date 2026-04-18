# Full-stack integration handbook

Zero-to-production for any Next.js + Prisma + Expo project. Covers every step, every gotcha, every fix I learned shipping Zarpay. Use this for DriveBid, portfolio projects, and every future build so you never have to rediscover the same setup issues.

This supersedes the shorter [DEPLOY.md](DEPLOY.md), [ANDROID-BUILDS.md](ANDROID-BUILDS.md), and [PLAYBOOK-FREE-STACK.md](PLAYBOOK-FREE-STACK.md). Those are left for quick reference; this is the definitive guide.

---

## Table of contents

1. [The architecture in one picture](#the-architecture-in-one-picture)
2. [Cost: zero, forever (within reason)](#cost-zero-forever-within-reason)
3. [One-time machine setup](#one-time-machine-setup)
4. [The repo shape you need](#the-repo-shape-you-need)
5. [Step-by-step deploy walkthrough](#step-by-step-deploy-walkthrough)
6. [Scripted path (faster)](#scripted-path-faster)
7. [Verification checklist](#verification-checklist)
8. [Troubleshooting catalogue](#troubleshooting-catalogue)
9. [Mobile app specifics](#mobile-app-specifics)
10. [iOS distribution (if you need it)](#ios-distribution-if-you-need-it)
11. [Production hardening](#production-hardening)
12. [Secrets hygiene](#secrets-hygiene)
13. [Cleanup and recovery](#cleanup-and-recovery)

---

## The architecture in one picture

```
┌────────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│ GitHub repo `main` │────▶│ Vercel (Next.js app) │────▶│ Neon Postgres    │
│                    │ push│  - web UI + admin    │     │  - schema via    │
│  commit to main →  │     │  - /api/* routes     │     │    prisma deploy │
│  auto production   │     │  - NextAuth          │     │  - seeded data   │
└────────────────────┘     │  - Vercel Blob KYC   │     └──────────────────┘
         │                 └──────────────────────┘
         │
         │ push                                         EAS build --local
         │                                                    ▼
         │                                         ┌──────────────────┐
         │                                         │ GitHub Actions   │
         └────────────────────────────────────────▶│  Ubuntu runner   │
                                                   │  builds APK      │
                                                   │  attaches to     │
                                                   │  android-latest  │
                                                   │  release         │
                                                   └──────────────────┘
                                                            ▼
                                                   ┌──────────────────┐
                                                   │ Android phone    │
                                                   │ installs APK     │
                                                   │ hits Vercel URL  │
                                                   └──────────────────┘
```

**One repo, one branch (`main`), one deploy pipeline.** Every push to `main` updates two things in parallel: the web app on Vercel and the Android APK on GitHub Releases. No drift, no manual promotion.

---

## Cost: zero, forever (within reason)

| Service | Free tier allowance | What you exceed to pay |
|---|---|---|
| Vercel hobby | 100 GB bandwidth/mo, unlimited serverless requests | Commercial use, 1 TB+ traffic, need for SLA |
| Neon | 0.5 GB DB, auto-pause, 1 branch | Multiple team members, always-on compute |
| Vercel Blob | 1 GB storage, 5 GB bandwidth/mo | Heavy file workloads |
| Resend | 100 emails/day, 3 000/mo | High-volume transactional email |
| GitHub Actions | 2 000 min/mo (private repo), unlimited (public) | Very chatty CI |
| Expo EAS | 30 cloud Android + 30 iOS builds/mo | Shared across ALL your Expo projects |
| Neon data transfer | 100 GB egress/mo | Very heavy read workloads |

**Gotcha:** EAS's 30-build cap is **shared across your Expo account**, not per project. DriveBid and Zarpay burn from the same bucket. This handbook uses `eas build --local` on GitHub Actions runners, which does not consume that quota. You can ship unlimited APKs for free.

**Real math:** a portfolio project with a few hundred visits per month costs $0. A pre-product startup handling a few thousand transactions costs $0. Cross into product-market fit (10 000+ users) and you start paying $20 to $50/mo total, still cheap.

---

## One-time machine setup

These steps only happen once per machine. Save the result somewhere safe (a password manager entry works).

### Install CLIs

```bash
pnpm add -g vercel           # deploys + env vars
pnpm add -g neonctl          # DB project management
# GitHub CLI (OS-specific): https://cli.github.com
#   macOS:   brew install gh
#   Linux:   sudo apt install gh  (may need the GitHub apt source)
#   Windows: winget install GitHub.cli
```

Verify:

```bash
vercel --version    # expects 33+
neonctl --version   # expects 2+
gh --version        # expects 2.40+
```

### Authenticate each CLI

```bash
vercel login         # opens browser, choose "Continue with GitHub"
neonctl auth         # opens browser, grants console.neon.tech access
gh auth login        # choose: GitHub.com → HTTPS → Login with a web browser
```

Credentials land in:
- `~/.vercel/auth.json`
- `~/.neon/credentials.json`
- `~/.config/gh/hosts.yml`

Treat those folders like SSH keys: don't commit, don't share, rotate if a device is compromised.

### Generate an Expo access token

Needed so GitHub Actions can build APKs under your Expo account.

1. https://expo.dev/settings/access-tokens → **Create token** → name it `github-actions` → copy it
2. Save the token somewhere safe (you only see it once)

**Gotcha we hit:** if you have an Expo organization in addition to a personal account, the dropdown at the top of the access-tokens page matters. EAS projects are owned by **whichever account's context the token is scoped to**. For personal projects, use the personal account dropdown; for team projects, use the organization.

### Generate a Vercel token (for the bootstrap script only)

Dashboard setup works without this; the script path needs it.

1. https://vercel.com/account/tokens → **Create**
2. Name: `deploy-automation`, Scope: your team, Expiration: 1 year
3. Save the token

---

## The repo shape you need

Every repo using this handbook needs these exact files. Copy them from zarpay to start.

```
your-project/
├── .github/workflows/android-apk.yml        ← unlimited free APK builds
├── .gitignore                                ← must include `scripts/deploy.config`
├── docs/                                     ← copy this handbook here
├── mobile/                                   ← Expo app (skip if web-only)
│   ├── app.config.ts                         ← MUST be .ts not .json (env-driven)
│   ├── eas.json
│   ├── package.json
│   └── ...
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
│   ├── bootstrap-deploy.sh                   ← the one-command deploy
│   ├── deploy.config                         ← YOUR VALUES (gitignored)
│   ├── deploy.config.example                 ← committed template
│   └── phone-frame.sh                        ← Android screenshot framer
├── src/                                      ← Next.js app
├── package.json                              ← MUST have "prisma": { "seed": "tsx prisma/seed.ts" }
├── pnpm-lock.yaml                            ← commit this
├── .env.example                              ← all env vars documented
├── vercel.json                               ← build + install commands
└── README.md
```

### `package.json` critical fragments

```json
{
  "scripts": {
    "dev": "next dev -p 3010",
    "build": "next build",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "postinstall": "prisma generate"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

**Gotcha:** without the `prisma` block at the top level, `prisma db seed` prints the setup instructions and exits without running your seed file. This one cost me 20 minutes on the Zarpay deploy.

### `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm prisma generate && pnpm build",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["fra1"]
}
```

Drop the `pnpm prisma generate` if you don't use Prisma. Pick the region closest to your Neon project: `fra1` (Frankfurt), `iad1` (US East), `sfo1` (US West).

### `mobile/app.config.ts` (not `app.json`)

Dynamic config so `EXPO_PUBLIC_API_URL` can be injected at build time.

```ts
import { ExpoConfig, ConfigContext } from "@expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3010";

  return {
    ...(config as ExpoConfig),
    name: "MyApp",
    slug: "myapp",
    owner: "your-expo-username",
    version: "0.1.0",
    // ... rest of the config
    extra: {
      apiUrl,
      eas: { projectId: "your-eas-project-id" },
    },
  };
};
```

**Gotcha:** if your repo has both `app.json` AND `app.config.ts`, Expo prefers `app.config.ts`. Delete `app.json` to avoid confusion. The mobile `lib/api.ts` should read the URL via `Constants.expoConfig?.extra?.apiUrl`.

### `.env.example`

Document every env var with a placeholder:

```
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb?schema=public"
AUTH_SECRET="dev-secret-change-me-32-bytes-minimum"
AUTH_TRUST_HOST=true
NEXTAUTH_URL="http://localhost:3010"
AUTH_JWT_SECRET="dev-jwt-secret-change-me-32-bytes"
KYC_STORAGE_PROVIDER="local"        # local | vercel_blob | s3
BLOB_READ_WRITE_TOKEN=""            # auto-injected by Vercel Blob
# ... project-specific vars
```

`.env.example` is committed. `.env` is gitignored.

### `scripts/deploy.config.example`

```bash
PROJECT_NAME="drivebid"
GITHUB_REPO="your-org/drivebid"
NEON_REGION="aws-eu-central-1"
VERCEL_REGION="fra1"
KYC_STORAGE=""                     # empty, or "vercel_blob"
MOBILE_DIR="mobile"

EXTRA_ENV_VARS="
FX_SOURCE=frankfurter
PAYMENT_PROVIDER=dev
"
```

---

## Step-by-step deploy walkthrough

The manual path, for when you want to understand what the script does, or when automation fails. First-time setup takes ~20 minutes.

### Step 1: create Neon project and extract connection string

Web path:
1. https://console.neon.tech → **New project**
2. Name: your project name, Region: closest AWS region
3. Postgres version: 16
4. After creation, click **Show password** on the connection string, **Copy snippet**

CLI path:
```bash
neonctl projects create --name drivebid --region-id aws-eu-central-1
DATABASE_URL=$(neonctl connection-string --project-id <id> --database-name neondb)
```

The connection string looks like:
```
postgresql://neondb_owner:npg_XXX@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### Step 2: run migrations and seed against Neon

**Gotcha:** Prisma reads `.env` on every command and ignores `export DATABASE_URL` from your shell. Two ways around it:

Option A (clean): temporarily rewrite `.env`:
```bash
cp .env .env.bak
sed -i 's|^DATABASE_URL=.*|DATABASE_URL="postgresql://neondb_owner:..."|' .env
pnpm prisma migrate deploy
pnpm prisma db seed
mv .env.bak .env
```

Option B (forceful): use `DATABASE_URL=... pnpm ...` but still expect Prisma to read `.env` — it merges, with the explicit one winning on some versions. Option A is safer.

After seeding, confirm from the dashboard: https://console.neon.tech → Tables → `users` should have 8+ rows.

### Step 3: sign up for Vercel

1. https://vercel.com/signup (use **Sign Up**, not Log In — you don't have an account yet)
2. **Continue with GitHub**
3. Authorize Vercel for the repos you want to deploy (recommended: **Only select repositories** → pick this one)
4. Choose **Hobby (Free)** plan when asked

### Step 4: import project (do not deploy yet)

1. Dashboard → **Add New → Project**
2. Click **Continue with GitHub** in the "Import Git Repository" card (this also authorizes the Vercel app on GitHub if needed)
3. Find your repo, click **Import**
4. **Configuration screen:**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Branch: will default to whatever your repo default is — change to `main` before deploy if needed
   - Build and Install commands: should be auto-populated from `vercel.json`

### Step 5: add ALL environment variables before hitting Deploy

Click **Environment Variables** to expand that section. Paste your `.env` values **in bulk** — Vercel detects the KEY=value format and splits each line into a row.

Required for most projects:

```
DATABASE_URL=<your neon connection string>
AUTH_SECRET=<openssl rand -base64 32>
AUTH_TRUST_HOST=true
AUTH_JWT_SECRET=<openssl rand -base64 48>
AUTH_JWT_ISSUER=<project-name>
AUTH_JWT_AUDIENCE=<project-name>-mobile
AUTH_JWT_EXPIRES_IN=30d
KYC_STORAGE_PROVIDER=vercel_blob
```

Plus any project-specific vars from `.env.example`. Skip `NEXTAUTH_URL` and `BLOB_READ_WRITE_TOKEN` for now; we add those after the first deploy knows the URL.

**Gotcha we hit:** I forgot `NEXTAUTH_URL` on the first try. Login still worked because `AUTH_TRUST_HOST=true` lets NextAuth accept any host, but callback URLs can misbehave without it. Set it after you know the final URL.

### Step 6: deploy

Click **Deploy**. First build takes ~2 to 3 minutes.

Possible failures and fixes:

| Error in build log | Fix |
|---|---|
| `pnpm: command not found` | Add `"packageManager": "pnpm@9"` to root `package.json` |
| `Lockfile is not up to date` | Run `pnpm install` locally, commit `pnpm-lock.yaml`, push |
| `Can't reach database server` | DATABASE_URL wrong. Edit the env var, redeploy |
| `Module not found: @vercel/blob` | Add `@vercel/blob` to dependencies, commit, push |
| `PrismaClientInitializationError` | Neon is paused. Hit the dashboard once to wake it, or add retry logic to the connection |

### Step 7: verify the deploy landed

Click **Continue to Dashboard**. The Deployments tab shows your new deployment with **Status: Ready** and a preview thumbnail of your landing page.

Open the URL (Vercel auto-generates something like `https://your-project-abc123.vercel.app`). The landing page should render.

### Step 8: add NEXTAUTH_URL and identify the clean domain

Go to **Settings → Environment Variables**. Add:
- Key: `NEXTAUTH_URL`
- Value: your Vercel URL (the short alias if available, see below)
- Apply to: **all three** (Production, Preview, Development)
- **Save**

**Spot the clean alias.** Vercel assigns three domains per deployment:
- `<project>-<hash>-<team>.vercel.app` (deployment-specific, changes every push)
- `<project>-git-<branch>-<team>.vercel.app` (branch-specific, stays stable per branch)
- **`<project>-<word>.vercel.app`** (project-wide alias, never changes — THIS is the one to use)

For Zarpay, the clean alias was `zarpay-red.vercel.app`. Use that in `NEXTAUTH_URL` and as the mobile app API URL.

### Step 9: redeploy to pick up NEXTAUTH_URL

Env var changes don't auto-redeploy. Two ways to trigger:

Option A (manual): **Deployments tab → latest row → ⋯ menu → Redeploy** → uncheck "Use existing Build Cache" → **Redeploy**

Option B (via git): push an empty commit:
```bash
git commit --allow-empty -m "chore: trigger redeploy for NEXTAUTH_URL"
git push origin main
```

If `main` is your Vercel production branch, this auto-deploys.

### Step 10: create Vercel Blob storage

Only needed if your app handles user uploads.

1. Vercel project → **Storage** tab (left sidebar) → **Create Database → Blob → Continue**
2. Name: `<project>-kyc` or similar
3. **Region: match your Vercel project region** (cross-region is slow and sometimes auto-injection fails)
4. Access: **Private** (tokens required for access; `access: "public"` can still be used per-blob for public URLs)
5. **Create**

`BLOB_READ_WRITE_TOKEN` auto-injects into the project env. Trigger another redeploy to pick it up.

### Step 11: confirm Vercel production branch is `main`

**Settings → Environments** (in the left sidebar, NOT the Git tab — the setting moved).

The Production row shows **Branch Tracking: main**. If it says `demo` or anything else, click Production → change it to `main` → Save.

**Gotcha we hit:** older Vercel UIs put this under Settings → Git. Newer ones put it under Settings → Environments → Production. Check both locations if you can't find it.

### Step 12: set up the Android APK workflow

This assumes your repo has `.github/workflows/android-apk.yml` and `mobile/app.config.ts` (see [The repo shape you need](#the-repo-shape-you-need)).

**One-time:**

1. Add the Expo token to the repo's secrets:
   ```bash
   gh secret set EXPO_TOKEN --repo your-org/your-repo --body 'paste-token-here'
   ```

2. Add the public API URL as a **variable** (not a secret — it's not sensitive):
   ```bash
   gh variable set EXPO_PUBLIC_API_URL --repo your-org/your-repo \
     --body "https://your-project.vercel.app"
   ```

**Triggering builds:**

- **Push to main:** auto-builds and refreshes the `android-latest` release
- **Manual:** https://github.com/your-org/your-repo/actions → **Build Android APK → Run workflow**

Each build takes ~25 minutes on a free Ubuntu runner. Multiple concurrent pushes queue but don't conflict.

### Step 13: install the APK on your phone

1. https://github.com/your-org/your-repo/releases/latest
2. Download `your-project-preview.apk`
3. Enable **Install unknown apps** for your browser if Android prompts (one-time)
4. Open the APK, install
5. Launch, log in with demo credentials
6. Verify the app hits the live Vercel URL

---

## Scripted path (faster)

After the one-time machine setup, you can replace steps 1 through 12 with a single command. Required: `scripts/bootstrap-deploy.sh`, `scripts/deploy.config.example` (both in this repo — copy to new projects).

```bash
cd your-new-project
cp scripts/deploy.config.example scripts/deploy.config
# Edit scripts/deploy.config — set PROJECT_NAME, GITHUB_REPO, regions, extra env vars

./scripts/bootstrap-deploy.sh
```

What the script does:

1. Verifies all three CLIs are logged in
2. Creates or adopts a Neon project with your name
3. Links the current repo to a Vercel project (creates if needed)
4. Sets all required env vars (auto-generates secrets via openssl)
5. Provisions a Vercel Blob store if `KYC_STORAGE=vercel_blob`
6. Deploys twice so `NEXTAUTH_URL` is correct
7. Sets `EXPO_PUBLIC_API_URL` on the GitHub repo for the mobile app

Total: ~5 minutes. You still have to run migrations and seed (one extra command each).

If the script fails at any step, it leaves partial state — safe to re-run (idempotent where it can be).

---

## Verification checklist

Go through these after any first deploy or major change. Each one catches a different class of bug.

### Web layer

- [ ] `https://<project>-<word>.vercel.app` loads the landing page
- [ ] Live calculator or any "hello world" API call returns real data (confirms DB connection)
- [ ] `/login` shows the login form
- [ ] Sign in with seeded demo account → redirects to authenticated area
- [ ] Any action that writes to the DB works (creates a row, updates a record)
- [ ] Any action that uploads a file works (KYC, avatar) AND reading it back works

### Mobile layer (if applicable)

- [ ] Latest GitHub Actions run is `success`, not `failure` or `cancelled`
- [ ] `https://github.com/<repo>/releases/tag/android-latest` has a `.apk` attached
- [ ] APK installs on an Android phone
- [ ] In-app login works with the SAME credentials that work on the web
- [ ] Creating records on mobile appears on web dashboard (confirms shared DB)

### Infrastructure

- [ ] Vercel Production Branch is `main`
- [ ] GitHub default branch is `main`
- [ ] Any push to `main` auto-deploys Vercel AND triggers an APK build
- [ ] `NEXTAUTH_URL` matches the clean `<project>-<word>.vercel.app` domain
- [ ] `BLOB_READ_WRITE_TOKEN` is auto-injected (check Vercel Settings → Environment Variables)
- [ ] `EXPO_PUBLIC_API_URL` GitHub variable matches `NEXTAUTH_URL`

If any row fails, see the troubleshooting catalogue below.

---

## Troubleshooting catalogue

Every issue I hit on the Zarpay deploy, ordered by the step where it tends to show up. Search this section first before googling.

### Deployments

**Vercel build fails: `pnpm-lock.yaml outdated`**
You added a dependency without running `pnpm install` locally. Run it, commit `pnpm-lock.yaml`, push.

**Vercel build fails: `Can't reach database server`**
DATABASE_URL is wrong or Neon is paused. Open Neon dashboard, wake the project by clicking any query in the SQL editor, copy a fresh connection string, update Vercel env, redeploy.

**Vercel build succeeds but app shows 500 on every page**
Usually missing `AUTH_SECRET` or `AUTH_JWT_SECRET`. Check Functions logs: https://vercel.com/<team>/<project>/logs. Add whatever's missing.

**Vercel build succeeds but login redirects to `localhost:3000`**
`NEXTAUTH_URL` is wrong. Set it to your actual Vercel URL, redeploy.

**Vercel auto-deploys but every push goes to Preview, not Production**
Production Branch is not set to `main` (or whatever your default is). Settings → Environments → Production → Branch Tracking. Fix it, redeploy.

### Database

**`pnpm prisma db seed` prints generic setup instructions**
Missing `prisma.seed` block in root `package.json`:
```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```
Add it, rerun.

**Neon auto-pauses and first request is slow**
Normal on free tier (scales to zero after 5 minutes idle). Cold wake is ~300 ms. To avoid: send a lightweight query on app boot, or accept the occasional slow first request.

**Prisma ignores `DATABASE_URL` from shell export**
Prisma reads `.env` first. Edit `.env` temporarily instead of exporting, or use `dotenv-cli` for one-off overrides.

### Mobile

**Android APK builds but app shows "could not reach backend"**
`EXPO_PUBLIC_API_URL` was unset or wrong when the build ran. Set the GitHub variable, trigger a new build. The URL is baked in at build time; you cannot change it after the APK is signed.

**APK build fails: "Resource not accessible by integration"**
Workflow needs write permission to create releases. Add at the top of the yaml:
```yaml
permissions:
  contents: write
```

**APK build fails: "EAS_BUILD_NODE_VERSION"**
EAS expects Node 20. The workflow uses `actions/setup-node@v4` with `node-version: "20"`. If you have a `.nvmrc` pinning a different version, that overrides it.

**APK build takes 50+ minutes or hangs**
Free Ubuntu runner ran out of memory. Each build needs ~4 GB. Retry is usually enough. If it happens repeatedly, upgrade to `runs-on: ubuntu-latest-8-core` (paid).

**Expo Web bundle fails: "Cannot read property 'setValueWithKeyAsync' of undefined"**
`expo-secure-store` doesn't work on web. Add a `Platform.OS === 'web'` guard in `mobile/lib/api.ts` (or wherever you use it) with a `localStorage` fallback.

### GitHub Actions

**Workflow doesn't trigger on push**
Check the trigger config: `on: push: branches: [main]` must match your actual branch name. If you renamed `master` → `main` or `demo` → `main`, update this.

**Workflow fails intermittently with "cache service responded with 400"**
Transient GitHub Actions issue, not yours. Re-run the workflow.

**Cancelled a run by mistake**
Re-trigger manually: `gh workflow run android-apk.yml`. Or push an empty commit.

### Auth

**Login page loads but "Email or password is incorrect" for seeded users**
Seed never ran on production DB. Run it once:
```bash
cp .env .env.bak
sed -i 's|^DATABASE_URL=.*|DATABASE_URL="<production-neon-url>"|' .env
pnpm prisma db seed
mv .env.bak .env
```

**Login succeeds but session expires after one page load**
`AUTH_SECRET` mismatch between Vercel environments, or `AUTH_TRUST_HOST` is not set. Verify both env vars exist for Production + Preview.

**CORS errors when mobile app calls API**
By default Next.js API routes don't send CORS headers. For the same-origin mobile app this is fine (Android WebView treats it as same-origin). For Expo Web during development, you need either:
- A Playwright `context.route()` proxy in your test script
- Add CORS middleware to Next.js for non-production origins

---

## Mobile app specifics

Things that bit me on the Expo side of the Zarpay deploy.

### `app.config.ts` vs `app.json`

**Use `app.config.ts`.** Reason: `app.json` is static, so the API URL is baked in at commit time. You cannot have the same repo build for localhost in dev and for production in CI unless the config is dynamic.

Minimal `app.config.ts`:

```ts
import { ExpoConfig, ConfigContext } from "@expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  name: "MyApp",
  slug: "myapp",
  owner: "your-expo-username",
  version: "0.1.0",
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3010",
    eas: { projectId: "<your-eas-project-id>" },
  },
});
```

Delete `app.json` if it exists — Expo will prefer `app.config.ts` but having both confuses `eas` commands.

### API URL resolution in the mobile app

Your `mobile/lib/api.ts` should have this pattern:

```ts
import Constants from "expo-constants";

function resolveApiUrl(): string {
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (extra?.apiUrl && !extra.apiUrl.includes("localhost")) {
    return extra.apiUrl;
  }
  // Local dev fallback: use Metro LAN IP
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  if (hostUri) return `http://${hostUri.split(":")[0]}:3010`;
  return "http://localhost:3010";
}
```

Production APKs carry `extra.apiUrl` baked in; dev Expo Go runs fall through to the LAN IP.

### Web platform guards for native modules

If you want Expo Web to work for screenshots or previews, wrap every native-only module:

```ts
import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

export async function isBiometricAvailable() {
  if (Platform.OS === "web") return false;    // or mock true
  return await LocalAuthentication.hasHardwareAsync();
}
```

Modules that need web guards: `expo-local-authentication`, `expo-notifications`, `expo-image-picker`, `expo-secure-store` (use localStorage fallback).

### Monorepo + pnpm

If your repo uses pnpm workspaces and the mobile app is in a subfolder (`mobile/`), add `node-linker=hoisted` to your root `.npmrc`:

```
node-linker=hoisted
```

Metro's resolver does not traverse pnpm's symlinked store, so peer deps get reported as missing without this.

### React version alignment

Next.js 14+ uses React 19. React Native 0.81+ uses React 19. Force both to the same version via `package.json` overrides:

```json
{
  "pnpm": {
    "overrides": {
      "react": "19.1.0",
      "react-dom": "19.1.0"
    }
  }
}
```

Without this you get "useContext of null" at runtime because two React instances load.

---

## iOS distribution (if you need it)

Android is free end to end. iOS has a hard $99/year gate past the free simulator path.

### Free iOS path (no Apple Developer account)

You can:
- Run in iOS Simulator via `npx expo run:ios` (needs a Mac with Xcode)
- Sideload on **your own iPhone** using "Personal Team" provisioning in Xcode (needs a Mac, USB cable, free Apple ID)
- Provisioning expires every 7 days (re-sign from Xcode weekly)

You cannot:
- Distribute to anyone else's device
- Use TestFlight
- Submit to App Store

For portfolio demos where you only need to prove the iOS layout works, the free path is fine.

### Paid iOS path ($99/year Apple Developer Program)

Enroll: https://developer.apple.com/programs

What $99 buys:
- Signing certificates that last a year (no weekly re-sign)
- **TestFlight** for up to 10 000 external testers
- App Store submission
- Up to 100 development + 100 ad-hoc devices per year

First iOS build:
```bash
cd mobile
eas credentials                        # generates certs + profiles
eas build -p ios --profile preview     # builds .ipa
eas submit -p ios --latest             # pushes to App Store Connect
```

EAS handles the signing dance for you.

### When to pay

Don't pay for portfolio projects unless:
- You need TestFlight for stakeholder review
- You want iOS screenshots from a real signed build in your portfolio
- You're about to ship to real users

$99/year is cheap if you're shipping to users. Expensive if you're just trying the build pipeline.

---

## Production hardening

The free-tier stack is production-ready for portfolios, MVPs, and early traction. Past that, tighten these things.

### Secrets rotation

The demo uses plaintext secrets in Vercel env vars. For real production:

- Use Vercel's **Environment Variable Scopes** (Production vs Preview vs Development) so dev secrets never leak to staging
- Rotate `AUTH_SECRET` and `AUTH_JWT_SECRET` every 6 months (generate new, update Vercel, redeploy, old sessions are invalidated)
- Rotate the Neon DB password if a developer leaves

### Database backups

Neon auto-backs up every 24 hours on free tier. For higher confidence:

- Upgrade to Launch plan ($19/mo) for point-in-time recovery
- Take manual snapshots before risky migrations: `neonctl branches create --parent main --name pre-migration-$(date +%Y%m%d)`
- Test your recovery path once per quarter

### Monitoring

Free observability:
- Vercel: built-in dashboard shows 5xx rate, p95 latency, function durations
- Neon: dashboard shows query count, slow query log
- GitHub Actions: workflow runs are free
- Resend: delivery dashboard

Paid options when you have users:
- Sentry free tier (5 000 events/mo) for error tracking
- Axiom / Logtail for log aggregation
- Better Uptime for uptime monitoring (free 10 monitors)

### Custom domain

Free Vercel URLs look amateur for a commercial product.

1. Buy a domain (Namecheap, Porkbun, Cloudflare — ~$10/year)
2. Vercel project → **Settings → Domains → Add**
3. Add the A record / CNAME that Vercel tells you to add at your registrar
4. Vercel auto-provisions SSL via Let's Encrypt within 5 minutes
5. Update `NEXTAUTH_URL` to the custom domain, redeploy

### Rate limiting

Next.js API routes have no built-in rate limiting. Before going live:

- Use **Upstash Redis** (free tier: 10 000 requests/day) with `@upstash/ratelimit` for per-IP rate limits
- Or use **Vercel Firewall** (paid, but dead simple) for basic DDoS protection
- Or **Cloudflare** in front of Vercel (free tier is generous) for WAF + rate limiting

### AML and compliance (fintech-specific)

If your app handles money (Zarpay, remittance, payments):

- KYC provider: integrate Sumsub, Onfido, Persona, or Alloy — NEVER roll your own ID verification
- Sanctions screening: ComplyAdvantage, Refinitiv, or the free OFAC SDN list + a match algorithm
- Transaction monitoring: Hummingbird, Unit21 — expensive but required at licensed-PI scale
- Audit log: ship to an append-only store (PostgreSQL with triggers, or a dedicated service like Segment/RudderStack)

---

## Secrets hygiene

Rules I follow strictly, learned from painful real-world leaks.

**Never commit secrets:**
- `.env` is gitignored
- `scripts/deploy.config` is gitignored
- Anything with "secret", "token", "key" in the name is gitignored

**Use `.env.example` for documentation:**
- Every env var that exists in production MUST be in `.env.example` with a safe placeholder
- This doubles as onboarding docs for a new developer

**Rotate when anything leaks:**
- If you accidentally commit a secret, assume it's compromised the moment you push
- Rotate within 10 minutes, not tomorrow
- GitHub secret scanning catches most of them, but do not rely on it

**Generate with real entropy:**
- `openssl rand -base64 32` for auth secrets (good for JWT keys too)
- `openssl rand -hex 32` if you want hex
- NEVER reuse secrets between projects

**Audit access quarterly:**
- GitHub: Settings → Developer settings → Personal access tokens
- Expo: expo.dev → Settings → Access tokens
- Vercel: vercel.com/account/tokens
- Neon: console.neon.tech/app/settings/api-keys

Revoke anything you don't recognize or haven't used in 90 days.

---

## Cleanup and recovery

Things you may need to do when the deploy goes wrong or branches get tangled.

### Delete a GitHub Release + tag

```bash
gh release delete <tag-name> --repo <org>/<repo> --yes --cleanup-tag
```

The `--cleanup-tag` flag also removes the git tag. Without it the release is gone but the tag lingers.

### Delete a branch (local + remote)

```bash
git push origin --delete <branch>
git branch -D <branch>
```

Order matters: delete remote first so you can still reference it locally if the push fails.

### Change the default branch

```bash
# Via gh
gh api -X PATCH repos/<org>/<repo> -f default_branch=main --jq '.default_branch'

# Via web: Settings → General → Default branch → switcher icon
```

### Roll back a Vercel deploy

Vercel keeps all previous deploys. To roll back:

- Deployments tab → find the last-known-good deploy → ⋯ → **Promote to Production**

Takes ~5 seconds. You can always undo the rollback the same way.

### Wipe and re-seed a Neon DB

```bash
DATABASE_URL='...' pnpm prisma migrate reset --force
DATABASE_URL='...' pnpm prisma db seed
```

`migrate reset` drops all tables, re-applies migrations, and runs the seed. Destructive — only on staging or early-development DBs.

### Cancel stuck GitHub Actions runs

```bash
# Cancel a single run
gh run cancel <run-id> --repo <org>/<repo>

# Cancel all in-progress runs (careful!)
gh run list --repo <org>/<repo> --limit 10 --json databaseId,status \
  --jq '.[] | select(.status=="in_progress") | .databaseId' \
  | xargs -I{} gh run cancel {} --repo <org>/<repo>
```

---

## What to do next time

1. Clone the four files (`bootstrap-deploy.sh`, `deploy.config.example`, `.github/workflows/android-apk.yml`, this handbook) into the new repo
2. Copy `package.json` patterns (`prisma.seed` block, pnpm overrides) from zarpay
3. Create `vercel.json` with the right build command
4. Create `mobile/app.config.ts` with the env-driven apiUrl pattern
5. Run `./scripts/bootstrap-deploy.sh`
6. Follow the [Verification checklist](#verification-checklist)

Total elapsed on a new project: ~15 minutes.

If this handbook missed something you hit, add it to the [Troubleshooting catalogue](#troubleshooting-catalogue) when you solve it. Every fix documented here saves a future hour.
