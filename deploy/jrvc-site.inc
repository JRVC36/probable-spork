# Shared site directives for Johns River Valley Camp.
# Installed to /etc/nginx/snippets/jrvc-site.inc
# Included by BOTH the :80 and :443 server blocks so behaviour is identical
# regardless of how a visitor arrives (important before HTTPS is enforced).

charset utf-8;
server_tokens off;

# ------------------------------------------------------------------ compression
gzip on;
gzip_vary on;
gzip_comp_level 6;
gzip_min_length 512;
gzip_types text/plain text/css text/xml application/javascript
           application/json image/svg+xml application/manifest+json;
# woff2 is already compressed; do not re-compress it.

# ------------------------------------------------------------------ caching
# Images never change in place, and CSS/JS are requested with a ?v=<hash>
# query the build emits — so a one-year immutable cache is safe.
location /assets/ {
    access_log off;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
}

# HTML must always revalidate, or visitors see stale prices.
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "public, max-age=0, must-revalidate";
    try_files $uri =404;
}

location = / {
    expires -1;
    add_header Cache-Control "public, max-age=0, must-revalidate";
    try_files /index.html =404;
}

# ------------------------------------------------------------------ privacy guards
# Defence in depth: even if the export is ever misconfigured, never serve
# dotfiles, the source tree, or build scripts.
location ~ /\.              { return 404; }
location ~ ^/(src|site|deploy)/ { return 404; }
location ~* \.(mjs|md|toml|sh)$ { return 404; }

# ------------------------------------------------------------------ errors
error_page 404 /404.html;
location = /404.html {
    internal;
    add_header Cache-Control "no-store";
}

# ------------------------------------------------------------------ security headers
add_header X-Content-Type-Options  "nosniff" always;
add_header X-Frame-Options         "SAMEORIGIN" always;
add_header Referrer-Policy         "strict-origin-when-cross-origin" always;
add_header Permissions-Policy      "geolocation=(), camera=(), microphone=()" always;
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'" always;

# ------------------------------------------------------------------ legacy redirects
# Old Wix URLs → new pages. Keeps search rankings and inbound links alive.
location = /summer-camps                 { return 301 /summer-camp.html; }
location = /day-camp                     { return 301 /summer-camp.html; }
location = /lodging                      { return 301 /facilities.html; }
location = /meeting-spaces               { return 301 /facilities.html; }
location = /retreats-and-special-events  { return 301 /retreats.html; }
location = /mission-camps                { return 301 /mission-trips.html; }
location = /service-trips                { return 301 /mission-trips.html; }
location = /faqs                         { return 301 /faq.html; }
location = /about-us                     { return 301 /about.html; }
location = /directors-statement          { return 301 /about.html; }
location = /contact-us                   { return 301 /visit.html; }
location = /give                         { return 301 /get-involved.html; }
location = /volunteeroportunities        { return 301 /get-involved.html#volunteer; }
location = /citapplication               { return 301 /summer-camp.html; }
location = /book-online                  { return 301 /register.html; }
location = /90thanniversary              { return 301 /about.html; }
location = /shop-1                       { return 301 /get-involved.html; }
location = /kitchen-planner              { return 301 /get-involved.html; }

# ------------------------------------------------------------------ logging
access_log /var/log/nginx/jrvc.org.access.log;
error_log  /var/log/nginx/jrvc.org.error.log warn;
