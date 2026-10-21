#!/usr/bin/env bash
# Publishes local changes to https://eulex152.github.io
#
#   ./update.sh                     commit with an automatic message
#   ./update.sh "Add new course"    commit with your own message
#   ./update.sh --dry-run           only show what would happen
#
# Steps: rebuild the photo/PDFs if their sources changed -> commit -> push ->
#        wait for GitHub Pages to deploy -> check that the site and PDFs respond.
set -euo pipefail

REPO="eulex152/eulex152.github.io"
SITE="https://eulex152.github.io"
PDFS=(CV_Euler_Romero_ES.pdf CV_Euler_Romero_ES_sin_foto.pdf CV_Euler_Romero_EN.pdf CV_Euler_Romero_EN_no_photo.pdf)

DRY_RUN=0
MESSAGE=""
for arg in "$@"; do
  case "$arg" in
    -n|--dry-run) DRY_RUN=1 ;;
    -h|--help) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) MESSAGE="$arg" ;;
  esac
done

cd "$(dirname "$0")"

say()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m ✓\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m ✗\033[0m %s\n' "$*" >&2; exit 1; }

# --- Checks -----------------------------------------------------------------
command -v git >/dev/null || fail "git is not installed"
command -v node >/dev/null || fail "node is not installed (needed to build the PDFs)"
if ! gh auth status >/dev/null 2>&1; then
  fail "GitHub CLI is not logged in. Run: gh auth login"
fi
[ -d node_modules ] || { say "Installing dependencies (first run)"; npm install --silent; }

git fetch -q origin
if [ "$(git rev-list --count HEAD..origin/main)" -gt 0 ]; then
  say "GitHub has commits you don't have locally; pulling them first"
  [ "$DRY_RUN" = 1 ] || git pull -q --rebase --autostash origin main
fi

changed="$(git status --porcelain)"
unpushed="$(git rev-list --count origin/main..HEAD)"
if [ -z "$changed" ] && [ "$unpushed" = 0 ]; then
  ok "Nothing to publish: local and GitHub are identical."
  exit 0
fi

# --- Rebuild generated files when their sources changed -----------------------
if echo "$changed" | grep -q 'source/photo'; then
  say "Photo changed: regenerating web images"
  [ "$DRY_RUN" = 1 ] || npm run --silent build:photo
  changed="$(git status --porcelain)"
fi
if echo "$changed" | grep -qE 'assets/js/content\.js|template/|scripts/build-pdfs\.mjs|assets/img/|assets/fonts/'; then
  say "CV content or template changed: rebuilding the PDFs"
  [ "$DRY_RUN" = 1 ] || npm run --silent build:pdfs
fi

# --- Commit and push -----------------------------------------------------------
if [ -n "$(git status --porcelain)" ] || [ "$DRY_RUN" = 1 ]; then
  say "Changes to publish:"
  git status --short
  [ -n "$MESSAGE" ] || MESSAGE="Update CV ($(date '+%Y-%m-%d %H:%M'))"
  if [ "$DRY_RUN" = 1 ]; then
    ok "Dry run: would commit \"$MESSAGE\" and push. Nothing was changed."
    exit 0
  fi
  git add -A
  git commit -q -m "$MESSAGE"
  ok "Committed: $MESSAGE"
fi

say "Pushing to GitHub"
git push -q origin main
commit="$(git rev-parse --short HEAD)"
ok "Pushed $commit"

# --- Wait for GitHub Pages ------------------------------------------------------
say "Waiting for GitHub Pages to deploy (usually under 2 minutes)"
status=""
for _ in $(seq 1 36); do
  build="$(gh api "repos/$REPO/pages/builds/latest" --jq '.status + " " + .commit[0:7]' 2>/dev/null || true)"
  status="${build%% *}"
  if [ "${build#* }" = "$commit" ] && { [ "$status" = built ] || [ "$status" = errored ]; }; then break; fi
  sleep 5
done
case "$status" in
  built) ok "Deployed" ;;
  errored) fail "GitHub Pages build failed. See https://github.com/$REPO/actions" ;;
  *) say "Still deploying; check https://github.com/$REPO/actions in a minute." ;;
esac

# --- Check the live site --------------------------------------------------------
say "Checking the live site"
for path in "" "${PDFS[@]/#/assets/}"; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$SITE/$path")"
  if [ "$code" = 200 ]; then ok "$SITE/$path"; else printf '\033[1;31m ✗\033[0m %s (HTTP %s)\n' "$SITE/$path" "$code"; fi
done
echo
ok "Done: $SITE  (press Ctrl+F5 in the browser if you still see the old version)"
