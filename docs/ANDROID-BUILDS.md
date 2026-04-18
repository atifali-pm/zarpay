# Unlimited free Android builds (any Expo project)

The EAS free tier caps you at 30 cloud Android builds per month shared across all your projects. This workflow sidesteps that cap entirely by running the build on a GitHub Actions runner instead of on EAS servers, using `eas build --local`. Public repos get unlimited Actions minutes, private repos get 2000/month.

## How it works in this repo

- Workflow file: `.github/workflows/android-apk.yml`
- Prereq secret: `EXPO_TOKEN` (once, per repo)
- Trigger the build from GitHub → Actions → "Build Android APK" → Run workflow
- Or push a tag like `mobile-v0.1.1` and the workflow auto-builds + attaches the APK to a GitHub Release

Time per build: ~25 minutes on a free Ubuntu runner. Slower than EAS cloud (~6 min) but unlimited.

## One-time setup

1. Generate an Expo access token:
   - Go to https://expo.dev/settings/access-tokens
   - Click **Create token**. Name it `github-actions`.
   - Copy the token (only shown once).
2. Add the token as a GitHub secret:
   - Repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `EXPO_TOKEN`
   - Value: paste the token
3. Push the workflow file (already in this repo under `.github/workflows/android-apk.yml`).

## Running a build

### Manual from the Actions tab
1. Repo → **Actions → Build Android APK → Run workflow**
2. Pick a profile (`preview` for APK, `production` for AAB)
3. Click **Run workflow**
4. Wait ~25 minutes
5. Download the APK from the workflow's **Artifacts** section

### Tag push (auto Release)
```bash
git tag mobile-v0.1.1
git push origin mobile-v0.1.1
```
Workflow fires, builds, attaches the APK to a new GitHub Release at `/releases/tag/mobile-v0.1.1`.

## Adapting for another project

Drop the yaml into any other Expo app repo. Change three things:

1. The output filename prefix (e.g. `drivebid-${PROFILE}.${EXTENSION}`).
2. The working directory if the mobile app is not in a `mobile/` sub-folder.
3. The tag pattern if you want something other than `mobile-v*`.

Everything else works unchanged because the whole setup is provider-agnostic.

## When to use which build path

| Need | Path | Cost | Speed |
|---|---|---|---|
| Test a JS-only change | `eas update --branch preview` | $0 | Instant on device |
| Rebuild for a native module change | Run this workflow | $0 | ~25 min |
| Fast local iteration with Android Studio debugging | `npx expo run:android` | $0 | ~3 min rebuild |
| Need it in under 10 min, one-off | `eas build -p android --profile preview` (cloud) | Counts against 30/month | ~6 min |
| Production release with code-signing | Same workflow but `profile=production` | $0 | ~25 min |

## Stretching the 30/month EAS cloud quota further

Even without this workflow, you can stretch free-tier cloud builds:

- **`eas update`** for JS-only changes does not count against builds at all. Most feature work on a managed Expo app is JS only, so this saves most builds.
- **`eas build --local` on your laptop** builds on your machine instead of EAS cloud. Free. Needs the Android SDK installed locally (~15 GB).
- **One APK, many phones.** An installed APK is good for any Android device. Build once, share with multiple testers.
- **Reuse between environments.** If staging and preview are the same code with different env vars, build once and inject env via `eas update` per environment.

## Notes and gotchas

- `eas build --local` still needs `EXPO_TOKEN` to look up the project ID and version source. The token does not give the runner any extra entitlement beyond your own account.
- `appVersionSource: "remote"` in `eas.json` means version numbers are managed by EAS cloud. Fine for this workflow, works through the token.
- Keep `EXPO_TOKEN` scoped to a single project if you want to be extra careful. EAS does not currently enforce per-project scopes but they are on the roadmap.
- GitHub Actions keeps artifacts for 90 days on the free plan. After that, download and store elsewhere or create a tagged Release which keeps the APK attached indefinitely.
