# nginx cache configuration for JRVC

## VULTR layout (the active layout supplied by the site owner)

VULTR's `https.conf` contains two TLS servers:

- A generic `listen 443 ssl default_server` server (`server_name _`) that includes `/etc/nginx/sites-enabled/*.conf`.
- A separate Certbot TLS server for `www.jrvc.org jrvc.org` that includes `/etc/nginx/site-extras/*.conf`.

Requests for the JRVC host select the second server because its `server_name` matches. Therefore a file in `sites-enabled` is **not** the right place for JRVC server-location directives on this host. The `jrvc-site.inc` must be included from the JRVC server's `site-extras` glob. Do not place a `server {}` block in `site-extras`: that directory is included inside an existing server block.

Install the shared policy and its VULTR server-context wrapper:

```bash
sudo install -d -m 755 /etc/nginx/snippets /etc/nginx/site-extras
sudo install -m 644 deploy/jrvc-site.inc /etc/nginx/snippets/jrvc-site.inc
sudo install -m 644 deploy/vultr-site-extra.conf /etc/nginx/site-extras/jrvc.org.conf
sudo nginx -t
```

The wrapper contains only `include /etc/nginx/snippets/jrvc-site.inc;`. Because VULTR's matching JRVC TLS block already includes `/etc/nginx/site-extras/*.conf`, the JRVC policies and locations will be expanded inside that server. Leave the unrelated VULTR default-server config alone. Before reloading, verify the effective configuration shows both `/etc/nginx/site-extras/jrvc.org.conf` and `/etc/nginx/snippets/jrvc-site.inc` within the `server_name www.jrvc.org jrvc.org` block:

```bash
sudo nginx -T 2>&1 | grep -n -A100 -B12 -E 'configuration file .*https\.conf|server_name www\.jrvc\.org jrvc\.org|site-extras/jrvc\.org\.conf|snippets/jrvc-site\.inc'
```

If `nginx -t` succeeds and the expanded includes are in the matching JRVC TLS server, reload and check:

```bash
sudo systemctl reload nginx
curl -sSI https://www.jrvc.org/assets/img/hero-sm-v2.webp
curl -sSI https://www.jrvc.org/assets/fonts/inter-latin-wght-normal.woff2
curl -sSI https://www.jrvc.org/assets/css/site.css?v=539b2ccb
curl -sSI https://www.jrvc.org/
curl -sSI https://www.jrvc.org/register.html
```

Files under `/assets/` should return `Cache-Control: public, max-age=31536000, immutable`; `/` and HTML documents should revalidate (`Cache-Control: public, max-age=0, must-revalidate`). Replace the CSS version in the example with the current `site.css?v=...` found in the homepage source.

### Why `/assets/` uses `^~`

VULTR's JRVC TLS server also has a regex location that applies `expires 30d` to common extensions such as CSS and JS. A plain `location /assets/` prefix can lose to a matching regex location. `location ^~ /assets/` makes the specific asset policy win for all `/assets/` paths, including WebP, WOFF2, CSS, and JS.

The shared snippet intentionally has no exact `location = /`; that would outrank a generic HTTP root redirect. Keep the HTTP server responsible for ACME and HTTPS redirects; include the JRVC site policies in the matching HTTPS server via the VULTR `site-extras` glob.

## Debian/Ubuntu sites-enabled layout

For a standard Debian/Ubuntu nginx configuration that includes `/etc/nginx/sites-enabled/*.conf`, use the separate vhost approach in `deploy/nginx.conf` and `deploy/SETUP.md`. Its enabled symlink must end in `.conf`. Do not mix that vhost layout with VULTR's server-context `site-extras` layout without checking the active `nginx -T` output first.

## Deployment limits

These files and instructions do not alter the live server by themselves. Do not install them on an unverified host or overwrite Certbot certificate settings. After the nginx change, inspect effective headers with `curl -sSI`, check browser CSP errors, and verify Turnstile, Apps Script forms, and the Zeffy modal. If a proxy/CDN is in front of VULTR, check its response headers too.
