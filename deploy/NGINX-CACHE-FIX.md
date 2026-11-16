# Targeted nginx cache/vhost correction

The host's `nginx -T` output reported only the main config and mime.types, and no `server {}` block or JRVC include. Its main config uses `include /etc/nginx/sites-enabled/*.conf;`. The JRVC setup instructions previously created a symlink named `sites-enabled/jrvc.org` (without `.conf`), which that glob will skip. The live `curl` headers also did not match the repository's intended asset-cache rules.

This repository corrects the symlink instructions and removes the exact-root location from the shared snippet. **It does not edit the production server.** First establish that this machine is actually the origin for `www.jrvc.org` and inspect its Certbot/TLS configuration.

## Inspect before changing anything

```bash
sudo nginx -T 2>&1 | grep -niE 'configuration file|server \{|listen|server_name|include|location|expires|add_header'
sudo ls -la /etc/nginx/sites-enabled/
sudo readlink -f /etc/nginx/sites-enabled/*
```

If the JRVC symlink exists without `.conf`, Debian/Ubuntu's `sites-enabled/*.conf` include skips it. If the vhost is absent, verify DNS / hosting ownership before enabling it: the public site may be served by a different nginx host or a proxy/CDN. Do not install an HTTP-only template over working TLS configuration.

## Enable only after confirming the host and TLS plan

For a first-time setup where HTTP-only service is intentional and DNS points to this host, the corrected setup command is:

```bash
sudo ln -sfn /etc/nginx/sites-available/jrvc.org /etc/nginx/sites-enabled/jrvc.org.conf
sudo nginx -t
```

Inspect the resulting `nginx -T` before reloading. The symlink target must contain the intended `server_name` and `root`; the installed `jrvc-site.inc` must resolve. Run `sudo systemctl reload nginx` only after confirming these conditions.

After Certbot has configured TLS, ensure the active **443** server includes `/etc/nginx/snippets/jrvc-site.inc`. Keep the HTTP server limited to the ACME challenge and the intended HTTP→HTTPS redirect after certificates exist. Remove the shared site-snippet include from that HTTP server after TLS is enabled: the snippet contains asset and legacy-route locations that could take precedence over a generic redirect. Do not overwrite Certbot's certificate paths or TLS options.

## Why the shared snippet changed

It no longer declares `location = /`. An exact-match root location wins over a `location / { return 301 ...; }` redirect. On HTTPS, nginx's `index index.html` handling internally serves `/index.html`, which is covered by the HTML revalidation rule. This avoids a root exception to the HTTP redirect.

## Verify the effective policy

After the correct active TLS server and snippet are in place:

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -sSI https://www.jrvc.org/assets/img/hero-sm-v2.webp
curl -sSI https://www.jrvc.org/assets/fonts/inter-latin-wght-normal.woff2
CSS_URL=$(grep -oE 'assets/css/site\.css\?v=[^\"]+' /usr/share/nginx/html/index.html | head -1)
curl -sSI "https://www.jrvc.org/$CSS_URL"
curl -sSI https://www.jrvc.org/
curl -sSI https://www.jrvc.org/register.html
curl -sSI http://www.jrvc.org/
```

Assets should return `200` with `Cache-Control: public, max-age=31536000, immutable`. `/` and HTML pages should return a revalidation policy (`public, max-age=0, must-revalidate`). HTTP should redirect to the canonical HTTPS host, while `/.well-known/acme-challenge/` remains reachable for renewals. Check the browser console and test Turnstile, Apps Script forms, and the Zeffy donation modal after CSP changes. If a CDN/proxy is in front, inspect and correct that layer too.

Do not run these commands on a server you have not confirmed is the production origin. No server command, reload, or live website change was made as part of this repo fix.
