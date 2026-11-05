#!/usr/bin/env bash
#
# Pull the site from git and publish it into the nginx web root.
#
#   ./deploy/publish.sh              # update /var/www/jrvc.org from origin
#   WEBROOT=/srv/www/jrvc ./deploy/publish.sh
#
# Safe to re-run: it fetches, rebuilds, and swaps the web root atomically.
# Nothing from .git/, src/, or build.mjs can reach the web root — the public
# tree is produced by `git archive`, which honours .gitattributes export-ignore.
#
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/jrvc.org/repo}"     # the clone (may live outside the web root)
WEBROOT="${WEBROOT:-/var/www/jrvc.org}"        # nginx `root`
BRANCH="${BRANCH:-main}"
SERVICE_OWNER="${SERVICE_OWNER:-www-data}"

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

# ---------------------------------------------------------------- 1. update clone
if [ ! -d "$REPO_DIR/.git" ]; then
  if [ -z "${REPO_URL:-}" ]; then
    echo "error: $REPO_DIR is not a git clone. Set REPO_URL=git@github.com:JRVC36/probable-spork.git" >&2
    exit 1
  fi
  say "Cloning $REPO_URL"
  git clone --branch "$BRANCH" "$REPO_URL" "$REPO_DIR"
fi

say "Fetching $BRANCH"
git -C "$REPO_DIR" fetch --prune origin
git -C "$REPO_DIR" checkout --quiet "$BRANCH"
git -C "$REPO_DIR" reset --hard --quiet "origin/$BRANCH"
say "Now at $(git -C "$REPO_DIR" rev-parse --short HEAD) — $(git -C "$REPO_DIR" log -1 --pretty=%s)"

# ---------------------------------------------------------------- 2. build
command -v node >/dev/null || { echo "error: node is required to build the site" >&2; exit 1; }
say "Building"
( cd "$REPO_DIR" && node build.mjs )

# ---------------------------------------------------------------- 3. export public tree
# git archive emits only tracked files, minus everything marked export-ignore.
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

say "Exporting public tree"
git -C "$REPO_DIR" archive --format=tar HEAD | tar -x -C "$STAGING"

if [ -e "$STAGING/.git" ] || [ -e "$STAGING/src" ] || [ -e "$STAGING/build.mjs" ]; then
  echo "error: export leaked non-public files — check .gitattributes" >&2
  exit 1
fi

# ---------------------------------------------------------------- 4. swap into place
mkdir -p "$WEBROOT"
BACKUP="${WEBROOT}.previous"
if [ -d "$WEBROOT" ] && [ -n "$(ls -A "$WEBROOT" 2>/dev/null)" ]; then
  rm -rf "$BACKUP"
  mv "$WEBROOT" "$BACKUP"
fi
mv "$STAGING" "$WEBROOT"
chown -R "$SERVICE_OWNER:$SERVICE_OWNER" "$WEBROOT" 2>/dev/null || true
chmod -R a+rX "$WEBROOT"

say "Published to $WEBROOT"
nginx -t 2>/dev/null && nginx -s reload 2>/dev/null && echo "nginx reloaded" || echo "(reload nginx yourself if config changed)"
