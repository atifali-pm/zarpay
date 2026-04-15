# Zarpay Mobile Direction: Handoff Document

> **This is a briefing for a Claude Code session opened inside `/home/atif/projects/zarpay/`.** It captures a discussion started in the portfolio career home session, where the user decided Zarpay should actually become an Android app (and eventually iOS), not just look like one in portfolio images. That is a real architectural decision, and the user wants to discuss and resolve it inside the Zarpay session where the code lives.
>
> Read this whole document. Then confirm the current state of Zarpay matches what's described below. Then walk the user through the decision points listed at the end.

---

## Why this discussion is happening

The user is publishing Zarpay as a Fiverr portfolio entry. The existing portfolio package at `/home/atif/projects/portfolio/fiverr-portfolio/output/zarpay/` has six JPGs that are desktop browser screenshots of Zarpay running at `localhost:3010`. The user compared them to the DriveBid portfolio entry (which shows phones with real native app UI, captured from an Expo / React Native app) and said:

> "But it's a mobile app just like DriveBid and I want its images to be like that project."

The portfolio session clarified that Zarpay is technically a Next.js web application, not a React Native native app. The user then said:

> "I would like it to be for both mobile and web app."

Meaning: show Zarpay as both a mobile product and a web product, the way real fintech companies ship (native mobile for customers, web admin for operations staff).

The portfolio session then offered three technical paths to make Zarpay actually installable on Android:

- Option A: Expo / React Native native app that calls the existing Next.js API routes
- Option B: Capacitor wrapper that puts the existing Next.js sender app inside a webview
- Option C: Trusted Web Activity (TWA) that wraps the hosted URL in a Chrome shell

The user confirmed:

> "And of course it can be added to Google Play Store and Apple Play Store later, but for now I need it to be Android app."

This means the user wants Zarpay to actually be an Android app now, with the Play Store and App Store as future targets.

The portfolio session then recommended **Option A, minimum viable port** (4 to 5 core screens, 12 to 18 hours) and the user said:

> "Yes but this is a discussion that I need to do with Zarpay session, so please create a handoff with comprehensive details."

That handoff is this document.

---

## Current state of Zarpay (confirm before proceeding)

Before starting the discussion, verify that the following is still accurate. If any of it has drifted since 2026-04-14 when the build landed, adjust the decision based on what's actually in the codebase now.

**Technical state (from memory):**

- Single Next.js 14 application with App Router
- TypeScript throughout
- Three route groups: `(public)` (landing, marketing, pricing, sign in, sign up), `(app)` (authenticated sender surface), `(admin)` (operations panel)
- PostgreSQL 16 via Prisma
- NextAuth v5 for authentication
- Tailwind CSS plus shadcn/ui
- Zod validation, React Hook Form
- Decimal money throughout (never floats)
- Transfer state machine with append-only `transfer_events` log
- Audit log on every administrative action
- Provider interfaces for payment-in, payout, KYC, OTP, email, SMS (all dev or sandbox implementations)
- 14 reference screenshots captured by Playwright in `docs/screenshots/`
- Dev server on port 3010, Postgres on 5450
- All of M1 through M6 completed in one session on 2026-04-14

**What does NOT exist:**

- No React Native or Expo project
- No mobile directory
- No native Android build
- No APK
- No Play Store or App Store submission
- No shared types package between a web and mobile codebase (the types live inside the Next.js app)
- No REST API routes for external callers (the app uses server actions internally; `/api/*` routes are limited)

**Verify:**

```bash
ls /home/atif/projects/zarpay/
ls /home/atif/projects/zarpay/src/
cat /home/atif/projects/zarpay/package.json | grep -E '"name"|"next"|"react"'
ls /home/atif/projects/zarpay/mobile 2>&1  # should not exist yet
```

If `mobile/` already exists, someone started this already; read it before writing anything new.

---

## What the user wants (from the portfolio session discussion)

1. **Android app, now.** Real installable APK, not just phone-styled web screenshots.
2. **Play Store path.** Whatever solution ships should have a clear path to Play Store submission.
3. **Apple Store path.** Eventually iOS as well. Whatever solution ships should not be Android-only with no path to iOS.
4. **Portfolio images that show the real native app.** After the mobile app exists, the Zarpay Fiverr portfolio entry gets regenerated with phone mockups containing actual native screenshots (not Chrome at mobile viewport).
5. **Both mobile and web surfaces featured.** The final portfolio story is "Zarpay has a native mobile app for senders and a web admin panel for operations staff." That's the fintech pattern and it's honest.
6. **Zarpay stays commercially viable.** This is not throwaway portfolio work. Per memory, the user may pursue Zarpay as a real product, so the architecture should not be a shortcut that would need to be thrown away later.

---

## The three options, with full tradeoffs

### Option A: Expo / React Native native app (RECOMMENDED)

Build a separate Expo project inside the Zarpay repo (at `/mobile/`) that renders the consumer flow in real React Native and calls the existing Zarpay backend via REST or tRPC.

**Scope, minimum viable (12 to 18 hours):**

- Expo project scaffolded with TypeScript and Expo Router
- 4 to 5 core screens:
  1. Landing with live rate calculator (no login gate)
  2. Sign in
  3. Rate quote + send money review
  4. Transfer detail with state timeline
  5. Transfer history
- API client pointed at `localhost:3010/api/*` (or a deployed URL later)
- Shared type definitions between the Next.js app and the Expo app (via a local package or copied types)
- Matches Zarpay brand (colors, typography, spacing from `project_zarpay_brand.md`)
- Builds to an APK via `eas build -p android --profile preview`

**Scope, full parity (30 to 40 hours):**

- All sender-side screens: signup, full KYC flow with native camera, recipients CRUD, profile, settings, notifications
- Push notifications via Expo Notifications
- Biometric auth via expo-local-authentication
- Native camera for KYC selfie capture (cleaner than the current web upload)
- Offline mode for transfer history

**Pros:**

- Mirrors real fintech architecture (Revolut, Wise, Monzo all have React Native or Swift/Kotlin mobile apps plus separate web admin panels)
- Strongest portfolio story: "real native mobile app shares API with Next.js web and operations panel"
- Clear path to Play Store AND App Store via Expo EAS
- Native features available when needed (camera, biometric, push, deep linking)
- Shared TypeScript types keep web and mobile in sync
- Mirrors DriveBid's pattern (Expo + FastAPI) which the user already validates

**Cons:**

- Most work of the three options
- Requires exposing the Zarpay backend as REST endpoints (server actions do not work from outside the Next.js runtime). This means adding a handful of `/api/*` routes for rate quotes, auth, transfer create, transfer list, transfer detail. Manageable but real work.
- Two codebases to maintain (web under `src/`, mobile under `mobile/`)
- Need to configure EAS (Expo Application Services) for builds, which is free for local dev but paid for production submissions

### Option B: Capacitor wrapper

Wrap the existing Next.js sender app in Capacitor to produce an Android APK where the app is a webview rendering the Next.js frontend.

**Scope:**

- Capacitor iOS and Android targets initialized inside the Zarpay repo
- Next.js configured for static export (`output: 'export'`) for the sender routes, OR pointed at a deployed Next.js server as the remote
- Android signing key, icon, splash screen, app ID
- First APK build via Capacitor CLI

**Effort:** 4 to 8 hours.

**Pros:**

- Fastest path to "installed on a phone"
- Zero duplication of UI code
- Path to Play Store and App Store (Capacitor is Ionic's supported pattern)
- Same technology Monzo used for years before their rewrite to native

**Cons:**

- Portfolio story is weaker. Technical buyers see "Capacitor" and read "webview wrapper, not a real native app."
- Next.js SSR does not work inside the mobile webview. Must convert sender routes to static export OR point the mobile app at a hosted Next.js server (defeats offline use and adds a production hosting dependency)
- Hard to take convincing "native app" screenshots because the UI is literally the same as the web version
- Less flexibility for native features; Capacitor plugins work but the ergonomics are worse than React Native

### Option C: Trusted Web Activity (TWA)

Android's way of wrapping a hosted web URL in a Chrome Custom Tab rendered as a full-screen native app. Google treats it as Play Store eligible for PWAs.

**Scope:**

- Zarpay must be deployed somewhere public (Vercel is free and natural for Next.js)
- An Android Studio TWA project that opens the deployed URL
- A `digitalassetlinks.json` on the deployed domain to prove ownership
- APK build via Android Studio

**Effort:** 1 to 2 hours assuming Zarpay is already deployed.

**Pros:**

- Simplest path to Play Store
- Zero changes to the Zarpay codebase
- The Next.js app can stay exactly as it is today

**Cons:**

- Weakest portfolio story. TWA is "Chrome in a shell." Technical buyers would not call this a mobile app.
- Requires Zarpay to be deployed publicly first (which should happen anyway, but it adds a dependency before you can ship the APK)
- Very limited access to native features (no direct camera API, push via PWA, no biometric)
- iOS has no TWA equivalent. Apple would require a different wrapper (Capacitor or PWABuilder) so you still end up with two shells

### Option D: Skip native, upload portfolio as a web app

Abandon the mobile app idea for now. Use the existing desktop screenshots, possibly wrapped in stylized browser chrome or phone frames for visual consistency, and ship the Zarpay Fiverr portfolio entry this week as "mobile-first Next.js web application."

**Effort:** 0 hours of mobile work, 1 to 2 hours of image composition if phone frames are still desired.

**Pros:**

- Fastest to portfolio publication
- Zero new architectural commitment
- Zarpay stays a single-codebase Next.js product

**Cons:**

- User explicitly said they want an Android app now. This option contradicts what was confirmed.
- No path to Play Store or App Store without revisiting one of Options A, B, or C later
- Portfolio story is weaker (web app, not mobile app)

---

## Portfolio session's recommendation (subject to your discussion)

**Option A, minimum viable (12 to 18 hours)** for these reasons:

1. It is the only option that produces a real native mobile app without being a throwaway shortcut
2. It mirrors DriveBid's pattern (Expo + API backend), which the user already validates
3. It matches how real fintech companies ship
4. The minimum viable scope (4 to 5 screens) is bounded and shippable in 3 focused evenings
5. It leaves a clean architecture (shared API, shared types) that scales to full feature parity later
6. It produces a real APK that can go to Play Store AND a codebase that can ship to App Store via EAS
7. The portfolio story it creates is the strongest of all options

**This recommendation is not binding.** The user wants to have this discussion with you before committing. Walk through all four options with them and ask the decision questions in the next section.

---

## Decision points for your discussion with the user

Work through these in order. Do not start writing code until every question has a clear answer.

### 1. Which option?

Choices: A minimum, A full, B, C, D.

Ask the user which they pick. If they are unsure, walk through the tradeoffs in their own words and help them decide. Do not rush to Option A unless they explicitly agree.

### 2. Monorepo or separate repository?

If Option A is chosen, decide whether to:

- **Put the Expo app at `/home/atif/projects/zarpay/mobile/`** inside the existing Zarpay repo (the portfolio session's recommendation; keeps API types and deployment story unified; GitHub repo stays as `atifali-pm/zarpay`)
- **Put it at `/home/atif/projects/zarpay-mobile/`** as a separate repo (cleaner separation, but the two codebases get out of sync easily and require two GitHub repos)

The portfolio session's recommendation is monorepo (first option) because the two codebases will share types, fetch the same API, and ship as one product story.

### 3. Which 4 to 5 screens are the MVP?

If Option A minimum, agree on the screen list. The portfolio session suggested:

1. Landing with live rate calculator
2. Sign in (email + password)
3. Send money review
4. Transfer detail with timeline
5. Transfer history

Alternative picks worth discussing:

- Swap "Sign in" for "Dashboard" if auth can be handled via the existing web (then the mobile app deep-links into an already-signed-in state)
- Add "Recipients list" if the send flow is too confusing without it
- Drop "Transfer history" if one of the others needs more polish

### 4. Shared types strategy

If Option A, pick one:

- **Monorepo package (recommended):** create `packages/types/` with the shared Prisma-derived types, consumed by both `src/` (the Next.js app) and `mobile/` (the Expo app). Requires turning Zarpay into a pnpm workspace.
- **Copy-paste:** maintain the types in both places and keep them in sync manually. Fast but drifts.
- **Generate from Prisma:** use `prisma generate` output as the source of truth, export a subset for mobile consumption. Middle ground.

### 5. API surface

The mobile app needs REST endpoints it can call. Today Zarpay uses server actions for mutations and React Server Components for reads. That does not work from outside the Next.js runtime. Decide:

- **Add `/api/*` routes** that wrap the same business logic as the server actions (recommended). Keeps the web side unchanged, adds a narrow REST surface for mobile.
- **Rewrite web side to use API routes everywhere** (too invasive for minimum viable scope).
- **Use tRPC** (adds a dependency, but gives type-safe RPC for both surfaces).

Recommend option 1: add `/api/*` routes for the minimum viable screens only. Probably 5 to 8 endpoints total:

- `POST /api/auth/signin`
- `GET /api/me`
- `GET /api/rates/current` (returns mid rate, spread, final rate)
- `POST /api/transfers/quote` (creates a locked quote)
- `POST /api/transfers` (confirms a quote into a real transfer)
- `GET /api/transfers` (list for transfer history)
- `GET /api/transfers/:id` (single transfer for transfer detail)

### 6. Authentication on mobile

NextAuth v5 is session-cookie based by default, which does not work cleanly on React Native. Decide:

- **JWT bearer tokens on a new mobile auth endpoint:** easiest for React Native. Add `/api/auth/signin` that returns a JWT, store it in `expo-secure-store`, include it on every API call.
- **Use NextAuth's expo adapter (experimental):** official path but less mature.
- **Magic link or OTP over email:** simpler for users, requires the email provider to actually work.

Recommend JWT. Matches what DriveBid does (FastAPI + JWT).

### 7. Timing and priority

The user's current priority stack (from portfolio memory) is:

1. Upwork pipeline activation (identity verification, Connects, proposals)
2. Zarpay portfolio publication (waiting on this mobile decision)
3. Custom SaaS gig pricing and description fix
4. n8n Inbox Ops Agent portfolio project

Spending 12 to 18 hours on Zarpay mobile pushes everything else right by that amount. Confirm with the user that this is acceptable before committing. If Upwork activation is truly more urgent, consider Option D (skip native, ship portfolio as web) as a stopgap and revisit native mobile after the first Upwork contract lands.

---

## If Option A is chosen: build plan (3 evenings)

### Evening 1: Scaffold, shared types, API surface

1. Convert Zarpay into a pnpm workspace if not already (`package.json` with `workspaces`, `pnpm-workspace.yaml`)
2. Create `packages/types/` with Prisma-derived types exported for external consumption
3. Add `/api/auth/signin` (POST) returning JWT on success
4. Add `/api/me` (GET) returning the authenticated user from a bearer token
5. Add `/api/rates/current` (GET) returning the current GBP to PKR rate with spread and fee
6. Add `/api/transfers/quote` (POST) and `/api/transfers` (POST, GET)
7. Add `/api/transfers/:id` (GET)
8. Scaffold Expo project at `/mobile/` with TypeScript, Expo Router, Tailwind (NativeWind), and a shared `packages/types` dependency
9. Wire the API client in the Expo app
10. Boot `pnpm mobile dev` and confirm the app opens on Expo Go

**Done when:** the Expo app starts, the landing screen renders (even if empty), and a test fetch to `/api/rates/current` from the mobile app returns a real rate.

### Evening 2: The 4 to 5 MVP screens

1. Landing screen with live rate calculator (pulls from `/api/rates/current`)
2. Sign in screen (posts to `/api/auth/signin`, stores JWT in expo-secure-store)
3. Send money review screen (posts to `/api/transfers/quote` and `/api/transfers`)
4. Transfer detail screen with state timeline (pulls from `/api/transfers/:id`)
5. Transfer history screen (pulls from `/api/transfers`)

Style each screen to match `project_zarpay_brand.md` (navy primary, gold accent, Inter font, calm voice, big numbers for money display).

**Done when:** a user can open the app, see the rate, sign in, quote a transfer, confirm it, and see it in the history list.

### Evening 3: Build, polish, portfolio capture

1. Run `eas build -p android --profile preview` to produce a real APK
2. Install the APK on a physical Android device or an emulator
3. Test the full flow end-to-end
4. Capture real native screenshots of all 5 MVP screens
5. Rebuild the Zarpay Fiverr portfolio package at `/home/atif/projects/portfolio/fiverr-portfolio/output/zarpay/`:
   - Replace the web-captured phone mockups with real native screenshots
   - Update the composite cover (`06-main-hero.jpg`) to show the native app next to the desktop admin panel
   - Update `HANDS-ON.md` to reference the native app in the description
6. Commit every deliverable as a separate clean commit. No Co-Authored-By lines.

**Done when:** the APK installs and works on an Android device, and the Zarpay portfolio package has 6 JPGs with real native screenshots alongside desktop admin browser shots.

---

## Portfolio impact after the mobile build

Once the mobile app is working and the portfolio package is regenerated:

1. **Fiverr portfolio upload.** Go back to the portfolio session (at `/home/atif/projects/portfolio/`) and walk through the Fiverr "Add a new project" form using the updated HANDS-ON.md. Link to Gig 4 (Custom SaaS).

2. **Upwork portfolio upload.** Same package, longer description, plus the GitHub link.

3. **Gig 4 description update.** Add a line: "Recent project: Zarpay, a UK to Pakistan cross-border money transfer product with a native Android app for senders and a Next.js operations panel for compliance staff."

4. **Memory updates:**
   - `project_publishing_tracker.md` in portfolio memory: mark Zarpay as PUBLISHED with the native mobile story
   - `reference_fiverr_portfolio_packages.md`: flip Zarpay from "ready" to "published"
   - `project_zarpay_portfolio.md` in Zarpay memory: flip the checklist items for native mobile and portfolio upload

5. **Optional upgrade:** once the first Upwork contract lands, revisit Option A "full" to port the rest of the sender flow (recipients CRUD, KYC with native camera, push notifications) so Zarpay becomes a legitimate fintech MVP that could be submitted to Play Store alongside a licensed counterparty.

---

## Writing rules and constraints (from memory, non-negotiable)

When you start writing code, comments, commit messages, or any prose:

- **No em dashes.** Use commas, periods, colons, or parentheses.
- **No space-hyphen-space as a sentence separator.** Replace `word - word` with `word, word` or `word. Word`.
- **No Co-Authored-By lines in commits.** Ever.
- **Never frame Zarpay as a clone or demo of another app.** The user may pursue Zarpay commercially; treat it as its own product.
- **Never claim Zarpay runs natively on iOS** until Option A is done and the iOS build actually exists. For now, Android only.
- **Decimal money everywhere.** Never floats, not in the web, not in the mobile, not anywhere.
- **Respect the state machine.** The transfer state machine lives on the database. Mobile must honor it; do not short-circuit transitions.

---

## Files and references to read before starting

Memory files in `/home/atif/.claude/projects/-home-atif-projects-zarpay/memory/`:

- `MEMORY.md` (index)
- `project_zarpay.md` (the plan)
- `project_zarpay_data_model.md` (the Prisma schema)
- `project_zarpay_milestones.md` (the 6 build phases, all complete)
- `project_zarpay_brand.md` (colors, typography, voice)
- `project_zarpay_regulatory.md` (UK FCA + Pakistan SBP context)
- `project_zarpay_demo.md` (ports, demo accounts)
- `project_zarpay_portfolio.md` (the portfolio package status)
- `reference_dev_ports.md` (avoid port conflicts with other projects)

Existing files in the Zarpay repo:

- `README.md` (product pitch and tech stack)
- `package.json` (current dependencies)
- `src/` (the Next.js app)
- `prisma/schema.prisma` (the data model)
- `docs/screenshots/` (the 14 existing captures)
- `scripts/screenshots.mjs` (the Playwright capture script)

Portfolio package (outside the Zarpay repo):

- `/home/atif/projects/portfolio/fiverr-portfolio/output/zarpay/` (current 6 JPGs plus HANDS-ON.md)
- `/home/atif/projects/portfolio/fiverr-portfolio/output/drivebid/` (reference for the target look and feel)

---

## How to start the discussion with the user

Open with something like:

> "I read the HANDOFF-mobile-direction.md and I understand the context. Before I write any code, I want to walk through the decision points with you. Which of Options A, B, C, or D do you want to pursue, and why?"

Then work through the seven decision points in order. Do not start scaffolding, do not add dependencies, do not touch the Next.js app until every question has an answer. When the decisions are locked in, summarize them back to the user and get explicit confirmation before beginning Evening 1.

Good luck. This is a meaningful upgrade to Zarpay and worth the careful setup.
