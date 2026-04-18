# Zarpay

**Cross border money transfer for the UK to Pakistan corridor.** Send GBP from the UK, deliver PKR in Pakistan to a bank account, mobile wallet, or cash pickup point. Mid market rate, disclosed spread, mobile first.

Built single corridor on purpose. Depth over breadth.

> **Status:** Built, demo ready. Sender app, operations panel, AML rules, audit log, and provider interfaces all in place. Going live behind a licensed counterparty is a swap, not a rewrite.

---

## Download for Android

The latest preview APK is built automatically on every push to the `demo` branch by `.github/workflows/android-apk.yml` (runs on a free GitHub Actions runner, uses zero EAS cloud build credits).

| Link | What you get |
|---|---|
| [Latest release page](https://github.com/atifali-pm/zarpay/releases/tag/demo-latest) | Downloadable APK, always pointing at the freshest `demo` branch build. |
| [Direct APK download](https://github.com/atifali-pm/zarpay/releases/latest/download/zarpay-preview.apk) | Stable URL for install. |

Install steps on Android:

1. On your phone, open the release link above.
2. Download the `.apk` attachment.
3. Open the downloaded file. Android may ask you to enable "Install unknown apps" for your browser on first run — this is only needed once.
4. Install. Launch Zarpay from your app drawer.
5. Sign in with a demo account (see the sign in screen for credentials, or use `sender@zarpay.dev` / `password123`).

The app talks to the hosted backend at the URL baked in at build time, so no local dev server is needed to use it.

---

## Why one corridor

Most remittance apps fan out across dozens of corridors and lose the plot. Zarpay does one route well: GBP to PKR. That means deeper bank and wallet integrations on the Pakistan side, sharper UX for the British Pakistani diaspora, and pricing that holds up to comparison rather than hiding behind a "starting from" rate.

The UK to Pakistan corridor moved over £4 billion last year. It is one of the most underserved high-volume routes in the world on UX and on price transparency.

---

## Key features

### Sender side: clear, calm, fast

- **Live rate calculator on the landing page.** No login wall, no email gate. Type the amount, see exactly what your recipient gets and what the fee is.
- **One-screen send flow** with amount, recipient, payout method, and review on a single scrollable page (not a five-step funnel).
- **Saved recipients** with bank, mobile wallet, or cash pickup defaults.
- **Status timeline** that updates in real time: initiated, funded, in transit, delivered.
- **Receipts** as PDF, downloadable from the transfer detail page.
- **Push and email notifications** at every state change.

### Recipient side: the part most apps neglect

- **Bank deposit** to all major Pakistani banks via 1Link / Raast.
- **Mobile wallet** to Easypaisa, JazzCash, NayaPay (the three that matter for the diaspora).
- **Cash pickup** via Western Union and MoneyGram agent networks.
- **SMS notification** to the recipient when funds land, in Urdu or English.

### Operations panel: the real product

- **KYC review queue** with side-by-side document and selfie viewer.
- **Transfer monitoring** dashboard with live volume, FX exposure, and stuck transfers.
- **Rate management** with mid-market source, spread in basis points, and scheduled rate changes.
- **Compliance flags** for AML thresholds, sanctions screening, and unusual patterns.
- **User management** with KYC tier, account freeze, and audit trail.

### Trust and transparency

- **Mid market rate plus disclosed spread** shown on every quote. No hidden margin.
- **Lock the rate** for 60 minutes once you start a transfer.
- **All fees disclosed before payment**, not after.
- **Audit trail** on every state change for every transfer.

---

## Screenshots

### Mobile app

Captured from the real React Native app (Expo SDK 54, React Native 0.81) running under `react-native-web` at a 390x844 phone viewport, driven by `scripts/mobile-screenshots.mjs`, then wrapped in a phone frame by `scripts/phone-frame.sh`.

| | | |
|---|---|---|
| ![Dashboard](docs/phone-frames/01-dashboard.png) | ![Send amount](docs/phone-frames/02-send-amount.png) | ![Send review](docs/phone-frames/03-send-review.png) |
| **Home.** Greeting, total sent, transfer count, start a transfer CTA, recent transfers with status pills. | **Send amount.** Type GBP, see the PKR payout live, pick the saved recipient. | **Send review.** Rate, disclosed spread, fee, total. Quote locks for 60 minutes on confirm. |

| | | |
|---|---|---|
| ![Transfer detail](docs/phone-frames/04-transfer-detail.png) | ![History](docs/phone-frames/05-history.png) | ![Recipients](docs/phone-frames/06-recipients.png) |
| **Transfer detail.** Amount, recipient, and a vertical timeline with every state change. | **History.** Every transfer, newest first, with status pills and amounts in both currencies. | **Recipients.** Saved bank, mobile wallet, and cash pickup destinations. |

| | |
|---|---|
| ![KYC wizard step one](docs/phone-frames/07-kyc.png) | ![Settings](docs/phone-frames/08-settings.png) |
| **KYC wizard.** Five step flow starting with ID type. Front, back, and selfie are captured on device through `expo-image-picker`. | **Settings.** Account info, biometric unlock toggle, transfer notifications, Expo SDK + React Native version info, log out. |

### Web

Captured by `scripts/screenshots.mjs` (Playwright headless Chromium, 1440x900, 2x device pixel ratio) against the seeded demo data.

### Public

| | |
|---|---|
| ![Landing page with live rate calculator](docs/screenshots/01-landing.png) | ![Rate calculator close up](docs/screenshots/02-rate-breakdown.png) |
| **Landing page.** Headline, trust badges, live rate calculator with mid market rate, disclosed spread, and total visible before any sign up gate. | **Rate calculator.** Type the amount, see exactly what your recipient gets in PKR with the full breakdown. |

### Sender app

| | |
|---|---|
| ![Sender dashboard](docs/screenshots/03-sender-dashboard.png) | ![Send money amount step](docs/screenshots/04-send-amount.png) |
| **Sender dashboard.** Total sent, recent transfers, status pills, and a one click send CTA. | **Send money flow.** Amount, recipient, and review on a single scrollable page. |

| | |
|---|---|
| ![Send money review](docs/screenshots/05-send-review.png) | ![Transfer detail with timeline](docs/screenshots/06-transfer-detail.png) |
| **Send review.** Full breakdown of rate, spread, fee, and total before confirm. Quote locks for 60 minutes on confirm. | **Transfer detail.** Reference, status pill, downloadable receipt, full state timeline, recipient details. |

| | |
|---|---|
| ![Transfer history](docs/screenshots/07-transfer-history.png) | ![Saved recipients](docs/screenshots/08-recipients.png) |
| **Transfer history.** All transfers with status pills and amounts. | **Recipients.** Saved bank, mobile wallet, and cash pickup destinations. |

### KYC

![Pending KYC banner](docs/screenshots/09-kyc-pending.png)

**Pending KYC.** A user who has uploaded ID documents and is awaiting reviewer approval.

### Operations panel

| | |
|---|---|
| ![Admin operations dashboard](docs/screenshots/10-admin-dashboard.png) | ![KYC review queue](docs/screenshots/11-admin-kyc-queue.png) |
| **Operations dashboard.** Volume today, transfers today, pending KYC, open compliance flags, and recent activity. | **KYC queue.** Pending and rejected users with one click into a side by side document viewer. |

| | |
|---|---|
| ![Transfer monitoring](docs/screenshots/12-admin-transfers.png) | ![Rate management](docs/screenshots/13-admin-rates.png) |
| **Transfer monitoring.** Filterable list of every transfer across the platform with reference, sender, recipient, amount, and status. | **Rate management.** Live mid market snapshot, manual override, and rate history. |

![Compliance review](docs/screenshots/14-admin-compliance.png)

**Compliance review.** Open and escalated AML flags with full transfer context and one click clear, escalate, or reject.

---

## Regulatory note

Live operation requires UK FCA authorization (or partnership with a licensed Authorised Payment Institution) and SBP approval plus a Pakistani bank or wallet partner for the payout leg. The application is built end-to-end with provider interfaces so going live is a swap, not a rewrite. See [memory: project_zarpay_regulatory.md](../../.claude/projects/-home-atif-projects-zarpay/memory/project_zarpay_regulatory.md) for the full picture.

---

## License

UNLICENSED. All rights reserved. Pre-product, not for distribution.
