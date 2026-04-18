# Free-tier production deploy playbook

A hands-on, reusable recipe for shipping any Next.js + Prisma + Expo project to a public URL with an installable Android APK. Monthly cost: **$0**. Works for Zarpay, DriveBid, and every project after that.

This is the portable version. For Zarpay-specific notes (KYC storage, AML thresholds), see [DEPLOY.md](DEPLOY.md) in this same folder.

---

## What this playbook gives you

- **Web backend** on Vercel (Next.js serverless + API routes)
- **PostgreSQL** on Neon (0.5 GB free, branching, auto-pause)
- **Object storage** on Vercel Blob (1 GB free) for user uploads
- **Email** on Resend free tier (100/day) — optional
- **Android APK** built unlimited times on GitHub Actions `eas build --local` (zero EAS cloud credits)
- **Secrets and variables** wired end-to-end so the APK points at the right API URL automatically

All of this in one script you can run in under 10 minutes per project.

---

## One-time machine setup (do this once, ever)

### Install three CLIs

```bash
pnpm add -g vercel neonctl        # Vercel + Neon
# gh CLI: https://cli.github.com (use the installer for your OS)
```

### Authenticate each

```bash
vercel login                       # opens browser, picks up your Vercel session
neonctl auth                       # opens browser, grants CLI access to your Neon account
gh auth login                      # pick GitHub.com, HTTPS, authorize
```

### Generate + save an Expo access token (for Android builds)

1. https://expo.dev/settings/access-tokens → **Create token**
2. Name it `github-actions`. Copy the token (shown once).
3. For each project you deploy, save it as a GitHub secret:
   ```bash
   gh secret set EXPO_TOKEN --repo <your-org>/<your-repo> --body 'paste-token-here'
   ```

That's all the one-time work. From here every new project takes ~5 minutes.

---

## Per-project setup

### Step 1. Required files in your repo

Your project repo needs four things for this playbook to work:

- `pnpm-lock.yaml` (monorepo or single) — we use `pnpm install --frozen-lockfile`
- Next.js app at the repo root or a subfolder — `vercel.json` at root specifies which
- Prisma schema at `prisma/schema.prisma` if you have a database
- **Optional:** Expo app at `mobile/` (or wherever) if you're shipping a mobile app

A reference Next.js + Prisma + Expo repo structure:

```
my-app/
├── .github/workflows/android-apk.yml   ← unlimited free APK builds
├── docs/                               ← copy this playbook here
├── mobile/                             ← Expo / React Native app
│   └── app.config.ts                   ← NOT app.json — needs env at build time
├── prisma/schema.prisma
├── scripts/
│   ├── bootstrap-deploy.sh             ← the automation
│   ├── deploy.config                   ← your project values (gitignored)
│   └── deploy.config.example           ← committed template
├── src/                                ← Next.js app
├── vercel.json
└── package.json
```

### Step 2. Copy the four files into your repo

From zarpay, copy these files verbatim into your new project:

```bash
cp zarpay/scripts/bootstrap-deploy.sh         my-app/scripts/
cp zarpay/scripts/deploy.config.example       my-app/scripts/
cp zarpay/.github/workflows/android-apk.yml   my-app/.github/workflows/
cp zarpay/docs/PLAYBOOK-FREE-STACK.md         my-app/docs/     # this file
```

Check that `vercel.json` at the project root specifies the framework and build commands:

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

If you don't use Prisma, drop `pnpm prisma generate && `.

### Step 3. Fill in deploy.config

```bash
cd my-app
cp scripts/deploy.config.example scripts/deploy.config
# edit scripts/deploy.config
```

Minimum values:

| Key | Example |
|---|---|
| `PROJECT_NAME` | `drivebid` |
| `GITHUB_REPO` | `atifali-pm/drivebid` |
| `NEON_REGION` | `aws-eu-central-1` (EU) or `aws-us-east-1` (US) |
| `VERCEL_REGION` | `fra1` (EU) or `iad1` (US) — pair with Neon |
| `KYC_STORAGE` | `vercel_blob` or empty |
| `MOBILE_DIR` | `mobile` or empty if no mobile app |
| `EXTRA_ENV_VARS` | project-specific env vars, one per line |

### Step 4. Run it

```bash
./scripts/bootstrap-deploy.sh
```

What happens:

1. Verifies all three CLIs are authenticated.
2. Creates a Neon project (or adopts an existing one with the same name).
3. Extracts the Neon connection string.
4. Links / creates a Vercel project pointed at the current repo.
5. Sets all required env vars (DATABASE_URL, AUTH_SECRET, AUTH_JWT_SECRET, etc plus any `EXTRA_ENV_VARS`).
6. Creates a Vercel Blob store if `KYC_STORAGE=vercel_blob`.
7. Does two deploys: the first one to get a URL, the second with `NEXTAUTH_URL` baked in.
8. Sets `EXPO_PUBLIC_API_URL` on the GitHub repo so APK builds know the URL.

Total time: ~5 minutes. Final output includes the production URL, Neon project ID, and next-step commands.

### Step 5. Run DB migrations and seed

The script does not run migrations automatically because that's project-specific. Do it once after the deploy:

```bash
# Read the DATABASE_URL the script printed in step 9, then:
DATABASE_URL='postgresql://...' pnpm prisma migrate deploy
DATABASE_URL='postgresql://...' pnpm prisma db seed    # if seed script exists
```

### Step 6. Trigger the first APK build

```bash
gh workflow run android-apk.yml --repo <your-org>/<your-repo>
```

Takes ~25 minutes. Lands as a downloadable APK under **Releases → demo-latest** on GitHub.

---

## Verification checklist

After the script completes:

- [ ] Open the production URL in a browser — landing page renders
- [ ] Sign in with a seeded demo account — redirects to authenticated area
- [ ] Any action that hits the database (view profile, list records) returns real data
- [ ] Any action that writes a file (upload KYC doc, avatar) stores it and can read it back
- [ ] GitHub Actions shows the APK workflow running or ready to trigger
- [ ] Install the APK on an Android phone — the app connects to the live URL and login works end to end

If any of these fail, see **Troubleshooting** below.

---

## Troubleshooting

### "Can't reach database server"

The DATABASE_URL env var in Vercel is wrong or Neon has paused. Open the Neon dashboard, copy the fresh connection string, paste it into `vercel env rm DATABASE_URL production` then `vercel env add DATABASE_URL production`, then redeploy.

### "Module not found: @vercel/blob"

The `@vercel/blob` package isn't in `package.json`. Add it: `pnpm add @vercel/blob`. Commit `package.json` + `pnpm-lock.yaml`. Redeploy.

### NextAuth redirects to localhost

`NEXTAUTH_URL` env var is missing or wrong. The script sets it automatically after the first deploy. If you manually skipped that, add it: `vercel env add NEXTAUTH_URL production` with the actual Vercel URL, then redeploy.

### APK builds but app shows "could not reach backend"

The APK was built before `EXPO_PUBLIC_API_URL` was set on GitHub. Set the variable at https://github.com/&lt;repo&gt;/settings/variables/actions, then trigger a fresh build: `gh workflow run android-apk.yml`.

### "Resource not accessible by integration" on GitHub Actions release step

The workflow lacks `contents: write` permission. Add this at the top of `.github/workflows/android-apk.yml`:

```yaml
permissions:
  contents: write
```

### Seed script fails with "You need to add prisma.seed to package.json"

Add this to the project root `package.json`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Install the runner: `pnpm add -D tsx`.

---

## Adapting for non-Next.js projects

The playbook assumes Next.js on Vercel. For other backends you swap the host but keep the same pattern.

| Backend | Free host | Notes |
|---|---|---|
| Next.js | Vercel hobby | What this playbook defaults to |
| Nest.js / Express / Node API | Fly.io free (3 shared VMs, 256 MB each) | Script the equivalent of `flyctl launch` + `flyctl secrets set` |
| FastAPI / Django / Flask | Fly.io or Render free | Render free has cold-start + 90-day DB deletion; Fly.io is the safer bet |
| Rust / Go binaries | Fly.io or shuttle.rs free | Shuttle is Rust-only but very free |

Neon, GitHub Actions, Resend, Expo — all work identically regardless of backend host. Only the Vercel-specific steps in the script need replacing.

---

## Security hygiene

- The `scripts/deploy.config` file holds project-specific values but **no secrets** (secrets are generated by the script or live in Vercel env). Still gitignored for safety.
- Tokens on your machine live in `~/.vercel/auth.json`, `~/.neon/credentials.json`, `~/.config/gh/hosts.yml`. Treat those folders like SSH keys.
- Rotate the Expo access token if you ever share your terminal history. Revoke at https://expo.dev/settings/access-tokens.
- Neon DB passwords are visible in the connection string. The script stashes them into Vercel env; nothing is written to disk outside of Vercel's encrypted vault.

---

## What you save by using this playbook

Without it, shipping each new project takes ~90 minutes of clicking through dashboards and pasting env vars. With it, every new project is 5 minutes of config + 5 minutes of waiting. The time compounds across projects, and you stop making dashboard-induced typos that cost 20 minutes to debug on a failed deploy.

More importantly, you know the deploy works the same way every time, which means when something breaks in production you can reason about it instead of wondering "what did I click differently this time."
