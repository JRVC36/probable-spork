#!/usr/bin/env bash
#
# Pull the site from git and publish it into the nginx web root.
#
#   ./deploy/publish.sh              # update /usr/share/nginx/html from origin
#   WEBROOT=/srv/www/jrvc ./deploy/publish.sh
#
# Safe to re-run: it fetches, rebuilds, and swaps the web root atomically.
# Nothing from .git/, src/, or build.mjs can reach the web root — the public
# tree is produced by `git archive`, which honours .gitattributes export-ignore.
#
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/jrvc.org/repo}"     # the clone (may live outside the web root)
WEBROOT="${WEBROOT:-/usr/share/nginx/html}"    # nginx `root`
SYNC_MODE="${SYNC_MODE:-auto}"                 # auto | swap | sync (see below)
BRANCH="${BRANCH:-main}"
SERVICE_OWNER="${SERVICE_OWNER:-www-data}"

# git refuses to operate on a repo owned by another user ("dubious ownership")
# in some configurations. Scoping safe.directory to this one path avoids that
# without weakening git globally. (Root bypasses the check, so this matters
# mainly for non-root and CI runs.)
GIT=(git -c safe.directory="$REPO_DIR")

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

# ---------------------------------------------------------------- 1. update clone
if [ -d "$REPO_DIR" ] && [ ! -d "$REPO_DIR/.git" ]; then
  if [ -n "$(ls -A "$REPO_DIR" 2>/dev/null)" ]; then
    echo "error: $REPO_DIR exists, is not empty, and is not a git clone." >&2
    exit 1
  fi
  rmdir "$REPO_DIR" 2>/dev/null || true   # git clone wants to create it
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  if [ -z "${REPO_URL:-}" ]; then
    echo "error: $REPO_DIR is not a git clone. Set REPO_URL=git@github.com:JRVC36/probable-spork.git" >&2
    exit 1
  fi
  say "Cloning $REPO_URL"
  git clone "$REPO_URL" "$REPO_DIR"
fi

# Ownership check. The most common first-run failure is cloning as root
# (`sudo git clone`) and then publishing as a normal user, which yields a raw
# "cannot open '.git/FETCH_HEAD': Permission denied" mid-run.
if [ ! -w "$REPO_DIR/.git" ]; then
  owner="$(stat -c '%U' "$REPO_DIR" 2>/dev/null || echo unknown)"
  echo "error: $REPO_DIR/.git is not writable by $(id -un) (clone is owned by '$owner')." >&2
  echo "       Run publish.sh as the user who owns the clone, with sudo, or:" >&2
  echo "         sudo chown -R $(id -un):$(id -gn) $REPO_DIR" >&2
  exit 1
fi

# Normalise the web root: a trailing slash would make "${WEBROOT}.previous"
# resolve to a hidden dir INSIDE the web root.
WEBROOT="${WEBROOT%/}"
[ -n "$WEBROOT" ] || { echo "error: WEBROOT resolves to an empty path" >&2; exit 1; }
[ "$WEBROOT" != "/" ] || { echo "error: refusing to use / as the web root" >&2; exit 1; }

# Package-managed directories (/usr/share/nginx/html, Debian's default) must be
# LEFT IN PLACE and emptied — deleting and recreating them fights the package
# manager. User-owned roots can be atomically swapped, which keeps the old
# release intact for rollback.
if [ "$SYNC_MODE" = "auto" ]; then
  case "$WEBROOT" in
    /usr/share/nginx/html|/var/www/html|/srv/www/htdocs|/usr/local/nginx/html)
      SYNC_MODE="sync" ;;
    *)
      SYNC_MODE="swap" ;;
  esac
fi

say "Fetching $BRANCH"
"${GIT[@]}" -C "$REPO_DIR" fetch --prune origin
"${GIT[@]}" -C "$REPO_DIR" checkout --quiet "$BRANCH"
"${GIT[@]}" -C "$REPO_DIR" reset --hard --quiet "origin/$BRANCH"
say "Now at $("${GIT[@]}" -C "$REPO_DIR" rev-parse --short HEAD) — $("${GIT[@]}" -C "$REPO_DIR" log -1 --pretty=%s)"

# ---------------------------------------------------------------- 1b. pre-flight
# Fail loudly and early. Without this, pointing at the wrong branch yields a
# confusing node stack trace, or worse, publishes an empty site.
if [ ! -f "$REPO_DIR/build.mjs" ] || [ ! -d "$REPO_DIR/src/pages" ]; then
  echo "error: branch '$BRANCH' at $("${GIT[@]}" -C "$REPO_DIR" rev-parse --short HEAD) does not contain the site." >&2
  echo "       build.mjs / src/pages are missing. Is the work merged into '$BRANCH'?" >&2
  echo "       Override with: BRANCH=<branch> $0" >&2
  exit 1
fi

# ---------------------------------------------------------------- 2. build
command -v node >/dev/null || { echo "error: node is required to build the site" >&2; exit 1; }
say "Building"
( cd "$REPO_DIR" && node build.mjs )

# ---------------------------------------------------------------- 3. export public tree
# git archive emits only tracked files, minus everything marked export-ignore.
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING" 2>/dev/null || true' EXIT

say "Exporting public tree"
"${GIT[@]}" -C "$REPO_DIR" archive --format=tar HEAD | tar -x -C "$STAGING"
cp -f "$REPO_DIR"/*.html "$STAGING"/
for f in sitemap.xml robots.txt; do
  [ -f "$REPO_DIR/$f" ] && cp -f "$REPO_DIR/$f" "$STAGING"/
done

if [ -e "$STAGING/.git" ] || [ -e "$STAGING/src" ] || [ -e "$STAGING/build.mjs" ]; then
  echo "error: export leaked non-public files — check .gitattributes" >&2
  exit 1
fi

if [ ! -f "$STAGING/index.html" ] || [ ! -f "$STAGING/404.html" ]; then
  echo "error: export is missing built pages — was the build run?" >&2
  exit 1
fi
PAGE_COUNT=$(find "$STAGING" -maxdepth 1 -name '*.html' | wc -l)
say "Export contains $PAGE_COUNT pages and $(find "$STAGING/assets" -type f | wc -l) assets"

# ---------------------------------------------------------------- 4. publish
BACKUP="${WEBROOT}.previous"
mkdir -p "$(dirname "$WEBROOT")"

say "Publishing ($SYNC_MODE mode) to $WEBROOT"

if [ "$SYNC_MODE" = "sync" ]; then
  # --- sync: keep the directory, replace its contents -----------------------
  # /usr/share/nginx/html may be package-owned; never rm -rf the directory.
  if [ -d "$WEBROOT" ] && [ -n "$(ls -A "$WEBROOT" 2>/dev/null)" ]; then
    if mkdir -p "$BACKUP" 2>/dev/null && cp -a "$WEBROOT/." "$BACKUP/" 2>/dev/null; then
      echo "    previous release saved to $BACKUP"
    else
      echo "    warning: could not write $BACKUP (need sudo?) — continuing without a backup" >&2
      rm -rf "$BACKUP" 2>/dev/null || true
    fi
  fi
  mkdir -p "$WEBROOT" || { echo "error: cannot create $WEBROOT" >&2; exit 1; }
  # Clear contents (including dotfiles) but leave the directory itself.
  find "$WEBROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
  cp -a "$STAGING/." "$WEBROOT/"
else
  # --- swap: replace the directory atomically ------------------------------
  if [ -d "$WEBROOT" ] && [ -n "$(ls -A "$WEBROOT" 2>/dev/null)" ]; then
    rm -rf "$BACKUP"
    mv "$WEBROOT" "$BACKUP"
  fi
  rm -rf "$WEBROOT"
  mv "$STAGING" "$WEBROOT"
fi

chown -R "$SERVICE_OWNER:$SERVICE_OWNER" "$WEBROOT" 2>/dev/null || true
chmod -R a+rX "$WEBROOT"

# Final assertion, run against the web root nginx will actually serve.
# Checking only that index.html exists is not enough: a stock nginx welcome
# page satisfies that, which would let a failed publish look successful.
if [ ! -f "$WEBROOT/index.html" ]; then
  echo "error: $WEBROOT/index.html missing after publish — aborting" >&2
  exit 1
fi
if ! grep -q "Johns River Valley" "$WEBROOT/index.html"; then
  echo "error: $WEBROOT/index.html is not our page (stale or stock content)." >&2
  echo "       Expected the site in $WEBROOT — check permissions and re-run." >&2
  exit 1
fi
PUBLISHED_PAGES=$(find "$WEBROOT" -maxdepth 1 -name '*.html' | wc -l)
if [ "$PUBLISHED_PAGES" -lt 10 ]; then
  echo "error: only $PUBLISHED_PAGES html pages in $WEBROOT (expected 12)" >&2
  exit 1
fi
if [ -e "$WEBROOT/src" ] || [ -e "$WEBROOT/.git" ] || [ -e "$WEBROOT/build.mjs" ]; then
  echo "error: non-public files present in $WEBROOT" >&2
  exit 1
fi
if [ "$SYNC_MODE" = "sync" ] && [ -e "$WEBROOT/.previous" ]; then
  echo "error: stale .previous inside the web root — remove $WEBROOT/.previous" >&2
  exit 1
fi

say "Published $PUBLISHED_PAGES pages to $WEBROOT"
nginx -t 2>/dev/null && nginx -s reload 2>/dev/null && echo "nginx reloaded" || echo "(reload nginx yourself if config changed)"
