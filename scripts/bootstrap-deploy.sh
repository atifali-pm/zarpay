#!/usr/bin/env bash
# Bootstrap a free-tier production deploy for any Next.js + Prisma + Expo project.
#
# This script automates the manual flow documented in docs/PLAYBOOK-FREE-STACK.md.
# It expects three CLIs authenticated in advance (see that doc for setup):
#   - vercel  (install with: pnpm add -g vercel)
#   - neonctl (install with: pnpm add -g neonctl)
#   - gh      (GitHub CLI: https://cli.github.com)
#
# Usage:
#   cp scripts/deploy.config.example scripts/deploy.config
#   # Edit scripts/deploy.config — set project name, GitHub repo, env vars
#   ./scripts/bootstrap-deploy.sh
#
# Idempotent: if the Neon project or Vercel project already exists, the script
# adopts them rather than failing.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="${1:-$SCRIPT_DIR/deploy.config}"

if [[ ! -f "$CONFIG" ]]; then
  echo "error: config file not found: $CONFIG"
  echo "copy scripts/deploy.config.example to scripts/deploy.config and edit it"
  exit 1
fi

# Load config. Expected keys:
#   PROJECT_NAME, GITHUB_REPO, NEON_REGION, VERCEL_REGION, MOBILE_DIR
#   KYC_STORAGE (optional, "vercel_blob" to auto-create a Blob store)
#   EXTRA_ENV_VARS (multiline bash string "KEY=value\nKEY=value")
# shellcheck disable=SC1090
source "$CONFIG"

: "${PROJECT_NAME:?PROJECT_NAME required in config}"
: "${GITHUB_REPO:?GITHUB_REPO required (format: owner/repo)}"
: "${NEON_REGION:=aws-eu-central-1}"
: "${VERCEL_REGION:=fra1}"
: "${KYC_STORAGE:=}"
: "${MOBILE_DIR:=mobile}"

step() { printf "\n\033[1;34m==> %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m!! %s\033[0m\n" "$*"; }

# ---------------------------------------------------------------------------
step "1. Verifying CLI auth"

command -v vercel  >/dev/null || { echo "install vercel CLI: pnpm add -g vercel"; exit 1; }
command -v neonctl >/dev/null || { echo "install neonctl: pnpm add -g neonctl"; exit 1; }
command -v gh      >/dev/null || { echo "install gh: https://cli.github.com"; exit 1; }

vercel whoami  >/dev/null 2>&1 || { echo "run: vercel login"; exit 1; }
neonctl me     >/dev/null 2>&1 || { echo "run: neonctl auth"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "run: gh auth login"; exit 1; }

# ---------------------------------------------------------------------------
step "2. Creating or adopting Neon project"

if NEON_PROJECT_ID=$(neonctl projects list --output json | jq -r ".projects[] | select(.name == \"$PROJECT_NAME\") | .id" | head -n1) && [[ -n "$NEON_PROJECT_ID" ]]; then
  echo "neon project '$PROJECT_NAME' already exists (id: $NEON_PROJECT_ID)"
else
  NEON_PROJECT_ID=$(neonctl projects create --name "$PROJECT_NAME" --region-id "$NEON_REGION" --output json | jq -r '.project.id')
  echo "created neon project (id: $NEON_PROJECT_ID)"
fi

DATABASE_URL=$(neonctl connection-string --project-id "$NEON_PROJECT_ID" --database-name neondb)
if [[ -z "$DATABASE_URL" || "$DATABASE_URL" == "null" ]]; then
  warn "could not read connection string — may need to fetch manually from neon dashboard"
  exit 1
fi
echo "database url acquired"

# ---------------------------------------------------------------------------
step "3. Linking / creating Vercel project"

cd "$SCRIPT_DIR/.."
if [[ ! -d .vercel ]]; then
  vercel link --project "$PROJECT_NAME" --yes --scope="$(vercel whoami)" || \
    vercel link --yes --scope="$(vercel whoami)"
fi

# ---------------------------------------------------------------------------
step "4. Setting environment variables"

add_env() {
  local key="$1" value="$2"
  if [[ -z "$value" ]]; then return; fi
  for env in production preview development; do
    echo "$value" | vercel env add "$key" "$env" --force >/dev/null 2>&1 || true
  done
  echo "  $key"
}

add_env DATABASE_URL        "$DATABASE_URL"
add_env AUTH_SECRET         "$(openssl rand -base64 32)"
add_env AUTH_JWT_SECRET     "$(openssl rand -base64 48)"
add_env AUTH_TRUST_HOST     "true"
add_env AUTH_JWT_ISSUER     "$PROJECT_NAME"
add_env AUTH_JWT_AUDIENCE   "$PROJECT_NAME-mobile"
add_env AUTH_JWT_EXPIRES_IN "30d"

if [[ "$KYC_STORAGE" == "vercel_blob" ]]; then
  add_env KYC_STORAGE_PROVIDER "vercel_blob"
fi

# User-specified extras (from config)
if [[ -n "${EXTRA_ENV_VARS:-}" ]]; then
  while IFS='=' read -r key value; do
    [[ -z "$key" ]] && continue
    add_env "$key" "$value"
  done <<< "$EXTRA_ENV_VARS"
fi

# ---------------------------------------------------------------------------
step "5. Provisioning Vercel Blob store (if requested)"

if [[ "$KYC_STORAGE" == "vercel_blob" ]]; then
  if vercel blob list 2>/dev/null | grep -q "$PROJECT_NAME-kyc"; then
    echo "blob store '$PROJECT_NAME-kyc' already exists"
  else
    vercel blob create "$PROJECT_NAME-kyc" || warn "blob creation failed — create manually from Vercel dashboard"
  fi
fi

# ---------------------------------------------------------------------------
step "6. First production deploy"

DEPLOY_URL=$(vercel deploy --prod --yes 2>&1 | tail -n 1)
echo "deployed: $DEPLOY_URL"

# Add NEXTAUTH_URL after first deploy so NextAuth redirects are correct
add_env NEXTAUTH_URL "$DEPLOY_URL"

step "7. Second deploy with NEXTAUTH_URL applied"
vercel deploy --prod --yes >/dev/null
echo "final url: $DEPLOY_URL"

# ---------------------------------------------------------------------------
step "8. Wiring GitHub Actions for APK builds"

if [[ -d "$MOBILE_DIR" ]]; then
  gh variable set EXPO_PUBLIC_API_URL --body "$DEPLOY_URL" --repo "$GITHUB_REPO" || \
    warn "could not set EXPO_PUBLIC_API_URL — set manually at https://github.com/$GITHUB_REPO/settings/variables/actions"
  echo "EXPO_PUBLIC_API_URL set to $DEPLOY_URL"
else
  echo "no mobile directory found — skipping GitHub variable"
fi

# ---------------------------------------------------------------------------
step "9. Done"
cat <<EOF

Production URL: $DEPLOY_URL
Neon project:   $NEON_PROJECT_ID
GitHub repo:    $GITHUB_REPO

Next:
  - Run DB migrations:    DATABASE_URL='$DATABASE_URL' pnpm prisma migrate deploy
  - Seed (if desired):    DATABASE_URL='$DATABASE_URL' pnpm prisma db seed
  - Trigger APK build:    gh workflow run android-apk.yml --repo $GITHUB_REPO
EOF
