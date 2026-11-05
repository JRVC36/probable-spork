# Server setup — nginx

Everything to do **once** on a fresh box before the first `publish.sh` run.
Written for Ubuntu/Debian. Commands assume `sudo`.

The model: **clone stays private, a clean export is served.**

```
/opt/jrvc.org/repo     git clone — never served, needs node
/usr/share/nginx/html  nginx docroot — pure static output, no node needed
```

---

## 0. Prerequisites on your side

| Thing | Why |
|---|---|
| **Site work merged to `main`** | `publish.sh` defaults to `BRANCH=main`, and `main` is currently still the empty initial commit. **This is the #1 blocker.** Until it's merged, run with `BRANCH=arena/840d3c33-probable-spork`. |
| **Deploy key or token for the repo** | The server needs read access to `JRVC36/probable-spork`. |
| **DNS for `jrvc.org` and `www.jrvc.org`** | An `A` record to the server IP (and `AAAA` if IPv6). Certbot will fail without this. |

---

## 1. Packages

```bash
sudo apt update
sudo apt install -y nginx git curl ca-certificates
```

**Node 20+** — required only by the build step on the server:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version    # expect v20.x or newer
```

> The build uses only `node:fs`, `node:path`, `node:crypto` — no `npm install`,
> no `node_modules`. Any Node ≥ 18 works. If you'd rather not put Node on the
> web server, run `node build.mjs` in CI, commit the built HTML, and change the
> service to a plain `git pull`. That's the trade-off.

---

## 2. Directories and permissions

```bash
# Web root (owned by nginx) and clone (owned by the deploy user)
# The docroot is /usr/share/nginx/html — the Debian/Ubuntu nginx default.
# publish.sh keeps the DIRECTORY and replaces its contents, because this path
# is package-managed. Do not delete it.
sudo mkdir -p /usr/share/nginx/html /opt/jrvc.org
sudo chown -R www-data:www-data /usr/share/nginx/html

# Clone directory — owned by whoever runs publish.sh (you, or a deploy user).
# Create the PARENT only; publish.sh clones into it and wants to create the
# directory itself. If you pre-create /opt/jrvc.org/repo, chown it to the
# same user, or `git clone` will refuse ("destination path already exists").
sudo mkdir -p /opt/jrvc.org
sudo chown -R "$USER":"$USER" /opt/jrvc.org

# Certbot webroot for the ACME challenge
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
```

`publish.sh` `chown`s the web root to `SERVICE_OWNER` (default `www-data`) on
every run, so you don't need to keep doing it by hand.

---

## 3. SSH access to the repo (deploy key)

Use a **read-only deploy key**, not a personal account token.

```bash
ssh-keygen -t ed25519 -C "jrvc-deploy@server" -f ~/.ssh/jrvc_deploy -N ""

# Add the public key as a Deploy Key in GitHub:
#   repo → Settings → Deploy keys → Add  (leave "Allow write access" OFF)
cat ~/.ssh/jrvc_deploy.pub

# Point git at it
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/jrvc_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config ~/.ssh/jrvc_deploy

# Verify before you rely on it
ssh -T git@github.com
```

---

## 4. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'     # ports 80 and 443
sudo ufw enable
```

If this box is behind a cloud security group, open 80/443 there too — Certbot
cannot validate otherwise.

---

## 5. Install the nginx config

```bash
cd /opt/jrvc.org/repo            # or wherever the clone lives
sudo install -m 644 deploy/jrvc-site.inc /etc/nginx/snippets/jrvc-site.inc
sudo install -m 644 deploy/nginx.conf    /etc/nginx/sites-available/jrvc.org

sudo ln -sf /etc/nginx/sites-available/jrvc.org /etc/nginx/sites-enabled/jrvc.org

# Debian/Ubuntu ship a default site that will shadow this one
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t && sudo systemctl reload nginx
```

**The config as shipped serves over plain HTTP on purpose.** It does not
redirect to HTTPS, because the `:443` block has no certificates yet — a
premature redirect makes the site unreachable *and* breaks the Certbot
challenge. HTTPS comes in step 7.

---

## 6. Clone the repository

**publish.sh does not clone for you on a fresh box unless you give it `REPO_URL`
and the target path does not exist yet.** Cleaner to clone once explicitly so
you can see it succeed:

```bash
sudo -u "$USER" git clone git@github.com:JRVC36/probable-spork.git /opt/jrvc.org/repo

# Confirm you got the branch that actually has the site
git -C /opt/jrvc.org/repo branch -a
git -C /opt/jrvc.org/repo log --oneline -3
```

> **Clone as yourself, not with `sudo`.** Cloning as root and then publishing
> as your normal user is the single most common first-run failure — git fails
> part-way through with `cannot open '.git/FETCH_HEAD': Permission denied`.
> `publish.sh` now detects this and says so instead, but avoiding it is easier.
> If you already did it: `sudo chown -R "$USER":"$USER" /opt/jrvc.org/repo`.

If `main` is empty (`git log` shows only "Initial commit"), the site work has
not been merged yet. Either merge it, or deploy the branch directly:

```bash
git -C /opt/jrvc.org/repo checkout arena/840d3c33-probable-spork
```

### Getting updates later

`publish.sh` runs this internally on every invocation — it is the git pull:

```bash
git -C /opt/jrvc.org/repo fetch --prune origin
git -C /opt/jrvc.org/repo checkout --quiet "$BRANCH"
git -C /opt/jrvc.org/repo reset --hard --quiet "origin/$BRANCH"
```

`reset --hard` is deliberate: the clone is a deployment artifact, never edited
by hand, so local changes are discarded to guarantee it matches the remote.

To pull and publish in one go:

```bash
sudo REPO_DIR=/opt/jrvc.org/repo WEBROOT=/usr/share/nginx/html \
     BRANCH=main /opt/jrvc.org/repo/deploy/publish.sh
```

To update the clone *without* publishing (e.g. to inspect a change):

```bash
sudo -u "$USER" git -C /opt/jrvc.org/repo pull --ff-only
```

---

## 7. First deploy

```bash
sudo REPO_DIR=/opt/jrvc.org/repo \
     WEBROOT=/usr/share/nginx/html \
     BRANCH=main \
     /opt/jrvc.org/repo/deploy/publish.sh
```

> Run it with `sudo` (it writes to the docroot and reloads nginx), but **as the
> owner of the clone** where possible. If the clone is owned by your user and
> you run the script as root, git's ownership check can still trip — the script
> scopes `safe.directory` to the clone to avoid that.

Watch for these lines:

```
==> Now at <sha> — <commit subject>
==> Built 12 pages.
==> Export contains 12 pages and 15 assets
==> Published 12 pages to /usr/share/nginx/html
```

If it stops at *"branch 'main' … does not contain the site"*, the work isn't
merged to `main` yet — that's the guard doing its job. Use `BRANCH=<your branch>`.

Smoke test:

```bash
curl -sI http://localhost/ | head -3
curl -s  http://localhost/ | grep -o '<title>[^<]*'
curl -sI http://localhost/assets/css/site.css | grep -i cache-control
curl -s  http://localhost/faqs -o /dev/null -w '%{http_code} %{redirect_url}\n'   # expect 301
curl -s  http://localhost/.git/config -o /dev/null -w '%{http_code}\n'            # expect 404
```

---

### Two publish modes

`publish.sh` picks one automatically from the path:

| Mode | Used for | Behaviour |
|---|---|---|
| `sync` | `/usr/share/nginx/html`, `/var/www/html`, `/srv/www/htdocs` | Keeps the directory, replaces its contents. Required for package-managed paths. |
| `swap` | any other path | Replaces the directory atomically. |

Force one with `SYNC_MODE=sync` or `SYNC_MODE=swap`. Use `sync` whenever nginx
or the distro owns the directory.

> **On this server the docroot is `/usr/share/nginx/html`**, so `sync` applies.
> A backup is copied to `/usr/share/nginx/html.previous` — outside the docroot,
> so it is never served. If that copy fails (no write access to the parent),
> the script warns and continues rather than stopping.
>
> Publish needs write access to the docroot contents, so run it with `sudo` as
> the owner of the clone.

---

## 8. TLS (after DNS points at the box)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d jrvc.org -d www.jrvc.org
```

Certbot adds the `:443` block, the certificate paths, and its own 80 → 443
redirect, then reloads nginx. Renewal is installed as a systemd timer — verify:

```bash
sudo systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

> Once Certbot has edited the config, **don't copy `deploy/nginx.conf` over it
> again** or you'll wipe the TLS settings. Keep site rules in
> `jrvc-site.inc` (which is included by both blocks) and re-install only that.

---

## 9. Updating from then on

```bash
sudo /opt/jrvc.org/repo/deploy/publish.sh
```

It fetches, rebuilds, re-exports, and swaps the web root atomically. The
previous release is copied to `/usr/share/nginx/html.previous` (outside the
docroot, so it is never served) — roll back with:

```bash
sudo rm -rf /usr/share/nginx/html.broken
sudo mv /usr/share/nginx/html /usr/share/nginx/html.broken
sudo mv /usr/share/nginx/html.previous /usr/share/nginx/html
```

### Optional: deploy on push

A systemd timer is the least-moving-parts option:

```bash
# /etc/systemd/system/jrvc-publish.service
[Unit]
Description=Publish jrvc.org
[Service]
Type=oneshot
ExecStart=/opt/jrvc.org/repo/deploy/publish.sh
```

```bash
# /etc/systemd/system/jrvc-publish.timer
[Unit]
Description=Publish jrvc.org every 5 minutes
[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now jrvc-publish.timer
journalctl -u jrvc-publish.service -n 30
```

Five minutes of lag is fine for a camp site and avoids webhook plumbing. Use a
GitHub webhook only if you need instant deploys.

---

## 10. Go-live checklist

- [ ] Site work merged to `main` (or `BRANCH` pinned)
- [ ] Clone exists at `/opt/jrvc.org/repo`, owned by you, on the right branch
- [ ] `publish.sh` published 12 pages and 15 assets
- [ ] `http://` serves the site, `nginx -t` clean
- [ ] Certbot issued certs; `https://www.jrvc.org` loads; apex redirects to www
- [ ] `/faqs` → 301 `/faq.html`; `/give` → 301 `/get-involved.html`
- [ ] `/.git/config`, `/src/pages/faq.html`, `/build.mjs` all return 404
- [ ] `Cache-Control: immutable` on `/assets/`, `max-age=0` on HTML
- [ ] **Placeholders replaced** — prices, EIN, and the safety claims on
      `faq.html#safety` (see `site/README.md`)
- [ ] Forms point at a real endpoint; `data-demo` removed
- [ ] Donation + registration payment wired
- [ ] Point `jrvc.org` DNS away from Wix **only after** the above pass,
      and keep the Wix site reachable for a week in case of rollback

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `branch 'main' does not contain the site` | Work not merged to `main`. Pass `BRANCH=`. |
| `nginx -t` fails on `ssl_certificate` | You uncommented the 443 block before Certbot issued certs. |
| Site loads but CSS unstyled | `root` points at the clone, not `/usr/share/nginx/html`; or `/assets/` denied. |
| Security headers missing on 404s | A `location` block with its own `add_header` drops inherited headers. Headers here use `always`; re-check any block you add. |
| `cannot open '.git/FETCH_HEAD': Permission denied` | Clone created with `sudo`. Run `sudo chown -R "$USER":"$USER" /opt/jrvc.org/repo`. |
| `destination path '/opt/jrvc.org/repo' already exists` | You pre-created the clone dir. Clone into it directly, or delete it and let `publish.sh` create it. |
| `mv: cannot move … Directory not empty` | Old `publish.sh`. Current version removes the web root before the swap. |
| Certbot fails validation | DNS not propagated, port 80 blocked, or the ACME location removed. |
