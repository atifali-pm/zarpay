# Evening 9, phone screenshot capture list

Capture each of these on your Android phone with the Expo Go LAN build or the
EAS preview APK. Use the built in screenshot combo (power + volume down).
Drop the raw PNGs into `~/Downloads/zarpay-shots/` with the numeric prefix
below so the framing script can pick them up in order.

Target count: 8 framed phone images for the Fiverr gallery. Fiverr shows 6 in
the grid and allows more on the detail page, so 8 gives headroom.

## Demo account to use

Email: `demo.sender@zarpay.test`
Password: `DemoSender123!`
(KYC approved, has saved recipients, has past transfers.)

## Shots in order

1. **`01-dashboard.png`** — Home tab
   - Log in, land on Home.
   - Should show greeting, KYC approved pill, stats cards (sent this month,
     transfers this month, open transfers), and the recent transfers list
     with at least three rows of mixed statuses.

2. **`02-send-amount.png`** — Send flow, step 1
   - Tap Send tab, enter `500` in the GBP field.
   - Should show the large PKR recipient amount, the rate breakdown (mid
     rate, our rate, spread, fee, total), and the Continue button.

3. **`03-send-review.png`** — Send flow, step 3, review
   - Pick a saved recipient, reach the review step.
   - Should show the full breakdown, the recipient summary card, and the
     `Continue and pay` primary button on a dark pill.

4. **`04-transfer-detail.png`** — Transfer detail with timeline
   - Open any delivered transfer from history.
   - Should show reference, status pill, amount block, recipient block,
     and the vertical timeline with at least 4 state dots.

5. **`05-history.png`** — History tab
   - Tap History.
   - Should show a clean list of transfers with status pills, amounts, and
     the recipient initials. Mix of delivered, in transit, pending.

6. **`06-recipients.png`** — Recipients tab
   - Tap People (Recipients).
   - Should show a mix of bank, mobile wallet, and cash pickup cards with
     distinct icons for each variant.

7. **`07-kyc-camera.png`** — KYC capture step
   - Log out, sign up a fresh test account, reach the KYC wizard, tap the
     front of ID step, use the camera.
   - Capture the preview screen after the shot (shows "Retake" and "Use
     photo" buttons over a real ID preview, so use a mockup card or piece
     of paper labelled "ID FRONT").
   - Alternative: the ID type picker with the 3 options visible.

8. **`08-settings.png`** — Settings tab
   - Tap Settings.
   - Should show the account info card, biometric toggle on, notifications
     enabled, dev info section, and the red Log out button at the bottom.

## After you capture

Run:

```bash
cd /home/atif/projects/zarpay
mkdir -p docs/phone-frames
for f in ~/Downloads/zarpay-shots/*.png; do
  out="docs/phone-frames/$(basename "$f")"
  ./scripts/phone-frame.sh "$f" "$out"
done
```

That produces framed PNGs ready to drop into the Fiverr package as
`/portfolio/fiverr-portfolio/output/zarpay/0X-name.jpg`.
