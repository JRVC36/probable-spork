/**
 * Static site builder for jrvc.org redesign.
 * Zero dependencies. Renders src/pages/*.html into a shared shell.
 *   node build.mjs        → writes .html files to the repo root
 */
import { readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const SITE = {
  name: "Johns River Valley Camp",
  phone: "828-387-5736",
  phoneHref: "tel:+18283875736",
  campPhone: "828-754-7067",
  email: "kevin@jrvc.org",
  address: "6211 NC-90, Collettsville, NC 28611",
  maps: "https://www.google.com/maps/dir//6211+NC-90,+Collettsville,+NC+28611",
  est: "1936",
};


/* ---------------------------------------------------------------------------
   Form endpoints.
   Paste the Apps Script Web App URL (ends in /exec) after deploying
   deploy/apps-script/Code.gs. See deploy/GOOGLE-SHEET.md.
   Leave empty and the form falls back to emailing the camp instead of
   pretending to have received anything.
--------------------------------------------------------------------------- */
const ENDPOINT_REGISTRATION = "";

const ENDPOINTS = {
  __ENDPOINT_REGISTRATION__: ENDPOINT_REGISTRATION,
};

const NAV = [
  { href: "summer-camp.html", label: "Summer Camp" },
  { href: "retreats.html", label: "Retreats" },
  { href: "mission-trips.html", label: "Mission Trips" },
  { href: "facilities.html", label: "Facilities" },
  { href: "get-involved.html", label: "Get Involved" },
  { href: "about.html", label: "About" },
];

const PAGES = [
  { slug: "index", file: "home.html", nav: "", title: "Summer Camp & Retreat Center in the Blue Ridge Mountains", desc: "Johns River Valley Camp has welcomed campers to the Blue Ridge foothills since 1936. Summer camp, retreats, and mission trips in Collettsville, NC." },
  { slug: "summer-camp", file: "summer-camp.html", nav: "summer-camp.html", title: "2026 Summer Camp — Sessions, Ages & Tuition", desc: "Six residential sessions for rising 3rd–12th graders plus day camp, June–July 2026. Ages, dates, tuition, and what's included." },
  { slug: "retreats", file: "retreats.html", nav: "retreats.html", title: "Group Retreats & Meeting Space — Rates & Booking", desc: "Plan a retreat, staff training, family reunion, or wedding at JRVC. Lodging for 8–120, meals included, published rates, year-round availability." },
  { slug: "mission-trips", file: "mission-trips.html", nav: "mission-trips.html", title: "Youth & College Mission Trips in Appalachia", desc: "All-inclusive mission trips for youth groups and college teams in the Southern Appalachian Mountains. Serving others, built around your group." },
  { slug: "facilities", file: "facilities.html", nav: "facilities.html", title: "Lodging & Meeting Facilities", desc: "Modern accessible living units, cabins, primitive outpost, and meeting space across 150 acres beside the Johns River." },
  { slug: "get-involved", file: "get-involved.html", nav: "get-involved.html", title: "Give, Volunteer & Work at Camp", desc: "Fund a campership, join a work weekend, or spend a summer on staff at Johns River Valley Camp." },
  { slug: "about", file: "about.html", nav: "about.html", title: "About JRVC — Outdoor Ministry Since 1936", desc: "Johns River Valley Camp is the outdoor ministry site of the Southern Conference, United Church of Christ. Our mission, our place, and our people." },
  { slug: "faq", file: "faq.html", nav: "", title: "Frequently Asked Questions", desc: "Tuition, drop-off times, packing lists, staff screening, allergies, financial aid, and everything else families ask before camp." },
  { slug: "register", file: "register.html", nav: "", title: "Register for 2026 Summer Camp", desc: "Register for a 2026 JRVC summer session. Deposit, cancellation policy, and what happens next." },
  { slug: "visit", file: "visit.html", nav: "", title: "Visit & Contact JRVC", desc: "Directions to 6211 NC-90, Collettsville NC. Phone, email, mailing address, and what to expect on the drive in." },
  { slug: "404", file: "404.html", nav: "", title: "Page not found", desc: "That page has moved or never existed. Find summer camp, retreats, and contact details for Johns River Valley Camp." },
  { slug: "privacy", file: "privacy.html", nav: "", title: "Privacy Policy", desc: "What information Johns River Valley Camp collects, why, and how to have it removed." },
];


/* Asset version — appended as ?v= to CSS/JS URLs so the one-year immutable
   cache in the nginx config can never serve a stale stylesheet. */
import { createHash } from "node:crypto";
const assetVersion = (() => {
  const h = createHash("sha256");
  for (const f of ["assets/css/site.css", "assets/js/site.js"]) {
    try { h.update(readFileSync(f)); } catch {}
  }
  return h.digest("hex").slice(0, 8);
})();

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function head(p) {
  const canonical = `https://www.jrvc.org/${p.slug === "index" ? "" : p.slug}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}${p.slug === "index" ? "" : " — JRVC"}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:image" content="https://www.jrvc.org/assets/img/hero.jpg">
<meta name="theme-color" content="#1f3a2e">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/fraunces-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css?v=${assetVersion}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>`;
}

function header(active) {
  const links = NAV.map(
    (n) => `        <li><a href="${n.href}"${n.href === active ? ' aria-current="page"' : ""}>${n.label}</a></li>`
  ).join("\n");
  return `
<header class="site-head">
  <div class="shell head-inner">
    <a class="brand" href="index.html" aria-label="${SITE.name} — home">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 23.5 L12 9 L17.5 17.5"/><path d="M13.5 23.5 L21 11.5 L29 23.5"/>
          <path d="M2 27.5 h28"/>
        </svg>
      </span>
      <span class="brand-text">
        <span class="brand-name">Johns River Valley</span>
        <span class="brand-sub">Camp &amp; Retreat Center &middot; Est. ${SITE.est}</span>
      </span>
    </a>
    <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="primaryNav">
      <span class="nav-toggle-bars" aria-hidden="true"></span>
      <span class="sr-only">Menu</span>
    </button>
    <nav class="primary-nav" id="primaryNav" aria-label="Primary">
      <ul>
${links}
      </ul>
      <a class="btn btn-primary btn-sm nav-cta" href="register.html">Register</a>
    </nav>
    <a class="head-phone" href="${SITE.phoneHref}">
      <span class="head-phone-label">Talk to us</span>
      <span class="head-phone-num">${SITE.phone}</span>
    </a>
  </div>
</header>`;
}

function footer() {
  return `
<footer class="site-foot">
  <div class="shell">
    <div class="foot-grid">
      <div class="foot-brand">
        <p class="foot-name">Johns River Valley<br>Camp &amp; Retreat Center</p>
        <p class="foot-note">Outdoor ministry of the Southern Conference, United Church of Christ. Welcoming campers, families, and groups since ${SITE.est}.</p>
        <p class="foot-note foot-addr">${SITE.address}</p>
      </div>
      <div>
        <h2 class="foot-h">Visit</h2>
        <ul class="foot-list">
          <li><a href="summer-camp.html">Summer Camp</a></li>
          <li><a href="retreats.html">Retreats</a></li>
          <li><a href="mission-trips.html">Mission Trips</a></li>
          <li><a href="facilities.html">Facilities</a></li>
          <li><a href="visit.html">Directions</a></li>
        </ul>
      </div>
      <div>
        <h2 class="foot-h">Connect</h2>
        <ul class="foot-list">
          <li><a href="get-involved.html">Give</a></li>
          <li><a href="get-involved.html#volunteer">Volunteer</a></li>
          <li><a href="get-involved.html#staff">Work at Camp</a></li>
          <li><a href="faq.html">FAQ</a></li>
          <li><a href="visit.html">Contact</a></li>
        </ul>
      </div>
      <div>
        <h2 class="foot-h">Get in touch</h2>
        <ul class="foot-list foot-contact">
          <li><a href="${SITE.phoneHref}">${SITE.phone}</a> <span class="foot-dim">cell</span></li>
          <li><a href="tel:+18287547067">${SITE.campPhone}</a> <span class="foot-dim">camp office</span></li>
          <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
          <li><a href="${SITE.maps}" target="_blank" rel="noopener">Directions on Google Maps</a></li>
        </ul>
        <a class="btn btn-ghost btn-sm foot-give" href="get-involved.html">Support the Campership Fund</a>
      </div>
    </div>
    <div class="foot-base">
      <p>&copy; ${SITE.est}–2026 Johns River Valley Camp. A 501(c)(3) nonprofit.</p>
      <ul class="foot-legal">
        <li><a href="privacy.html">Privacy Policy</a></li>
        <li><a href="faq.html">FAQ</a></li>
      </ul>
    </div>
  </div>
</footer>
<script src="assets/js/site.js?v=${assetVersion}" defer></script>
</body>
</html>`;
}

async function build() {
  for (const p of PAGES) {
    let body = await readFile(path.join("src/pages", p.file), "utf8");
    for (const [token, value] of Object.entries(ENDPOINTS)) {
      body = body.split(token).join(value);
    }
    const html = head(p) + header(p.nav) + body + footer();
    writeFileSync(`${p.slug}.html`, html, "utf8");
    console.log(`  ${p.slug}.html`.padEnd(24), `${(html.length / 1024).toFixed(1)} KB`);
  }
  if (!ENDPOINT_REGISTRATION) {
    console.log("\n\u26a0  ENDPOINT_REGISTRATION is empty — register.html will refuse to submit");
    console.log("   It shows a 'call the camp' message, never a false confirmation.");
    console.log("   Deploy deploy/apps-script/Code.gs and paste the /exec URL into build.mjs.");
  }
  console.log(`\nBuilt ${PAGES.length} pages.`);
}

build();
