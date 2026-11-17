# Full JRVC-only VULTR nginx configuration

Files in this directory:

- `nginx.conf` — global nginx configuration; loads site vhosts from `/etc/nginx/conf.d/*.conf` at `http` scope.
- `jrvc.org.conf` — complete HTTP, TLS, apex redirect, and canonical `www` vhosts.
- `../jrvc-site.inc` — shared JRVC security/CSP, long asset cache, HTML revalidation, legacy redirects, privacy guards, and 404 rules. It is included from the canonical TLS server.

This replaces VULTR's sample default `http.conf` / `https.conf` layout. Do **not** leave those old server blocks enabled alongside this setup. Do not include a complete `server {}` vhost inside a server-context directory such as VULTR's `site-extras`.

## Before installation

1. Confirm this is the VULTR origin for `jrvc.org` and `www.jrvc.org` and that no other sites depend on its current nginx configuration.
2. Back up the full config and inspect `sudo nginx -T` to identify every loaded `http.conf`, `https.conf`, `sites-enabled`, and `conf.d` file.
3. Confirm the TLS worker user in the existing config. `www-data` is set in this sample; change it in `nginx.conf` if the VULTR image uses a different worker account (often `nginx`).
4. Confirm `/etc/nginx/modules-enabled/*.conf` exists, and these Certbot files are readable:
   - `/etc/letsencrypt/live/jrvc.org/fullchain.pem`
   - `/etc/letsencrypt/live/jrvc.org/privkey.pem`
5. Move the old active VULTR `http.conf` / `https.conf` (and any duplicated JRVC `server {}` file) outside directories included by nginx. Keep backups; do not delete them. Ensure the only active JRVC vhost is the one below.

## Install

From the repository root, after backup and removal/disablement of the old active server blocks:

```bash
sudo install -d -m 755 /etc/nginx/conf.d /etc/nginx/snippets
sudo install -m 644 deploy/vultr/nginx.conf /etc/nginx/nginx.conf
sudo install -m 644 deploy/vultr/jrvc.org.conf /etc/nginx/conf.d/jrvc.org.conf
sudo install -m 644 deploy/jrvc-site.inc /etc/nginx/snippets/jrvc-site.inc
sudo nginx -t
```

If `nginx -t` succeeds, inspect the loaded config and reload:

```bash
sudo nginx -T 2>&1 | grep -nE '^# configuration file|server_name|listen .*80|listen .*443|jrvc-site.inc'
sudo systemctl reload nginx
```

If the test fails, do not reload; restore the backed-up config. This configuration assumes the existing certificate includes both `jrvc.org` and `www.jrvc.org`. If either hostname/certificate is different or the certificate files are absent, provision/renew the certificate before enabling the TLS vhosts.

## Verify

```bash
curl -sSI http://jrvc.org/
curl -sSI https://jrvc.org/
curl -sSI https://www.jrvc.org/
curl -sSI https://www.jrvc.org/assets/img/hero-sm-v2.webp
curl -sSI https://www.jrvc.org/assets/fonts/inter-latin-wght-normal.woff2
curl -sSI https://www.jrvc.org/register.html
sudo certbot renew --dry-run
```

Expected: HTTP redirects to `https://www.jrvc.org/`; apex HTTPS redirects to `www`; static `/assets/` files return `Cache-Control: public, max-age=31536000, immutable`; HTML returns `Cache-Control: public, max-age=0, must-revalidate`. Then browser-test Turnstile-protected forms, Apps Script form delivery, the Zeffy donation modal, and fallback checkout links. A `curl -I`/HEAD response alone does not verify those browser flows.

No production server is changed by installing these repository files until an administrator runs the commands above.
