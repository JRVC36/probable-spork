# Server setup — nginx

Everything to do **once** on a fresh box before the first `publish.sh` run.
Written for Ubuntu/Debian. Commands assume `sudo`.

The model: **clone stays private, a clean export is served.**

```
/opt/jrvc.org/repo     git clone — never served, needs node
/var/www/jrvc.org      nginx root — pure static output, no node needed
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
sudo mkdir -p /var/www/jrvc.org /opt/jrvc.org
sudo chown -R www-data:www-data /var/www/jrvc.org

# Clone directory — owned by whoever runs publish.sh (you, or a deploy user)
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

## 6. First deploy

```bash
sudo REPO_URL=git@github.com:JRVC36/probable-spork.git \
     BRANCH=main \
     /opt/jrvc.org/repo/deploy/publish.sh
```

Watch for these lines:

```
==> Now at <sha> — <commit subject>
==> Built 12 pages.
==> Export contains 12 pages and 15 assets
==> Published to /var/www/jrvc.org
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

## 7. TLS (after DNS points at the box)

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

## 8. Updating from then on

```bash
sudo /opt/jrvc.org/repo/deploy/publish.sh
```

It fetches, rebuilds, re-exports, and swaps the web root atomically. The
previous release is kept at `/var/www/jrvc.org.previous` — roll back with:

```bash
sudo rm -rf /var/www/jrvc.org && sudo mv /var/www/jrvc.org.previous /var/www/jrvc.org
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

## 9. Go-live checklist

- [ ] Site work merged to `main` (or `BRANCH` pinned)
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
| Site loads but CSS unstyled | `root` points at the clone, not `/var/www/jrvc.org`; or `/assets/` denied. |
| Security headers missing on 404s | A `location` block with its own `add_header` drops inherited headers. Headers here use `always`; re-check any block you add. |
| `mv: cannot move … Directory not empty` | Old `publish.sh`. Current version removes the web root before the swap. |
| Certbot fails validation | DNS not propagated, port 80 blocked, or the ACME location removed. |
