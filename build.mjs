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
  url: "https://www.jrvc.org",
  phone: "828-387-5736",
  phoneHref: "tel:+18283875736",
  campPhone: "828-754-7067",
  email: "kevin@jrvc.org",
  address: "6211 NC-90, Collettsville, NC 28611",
  maps: "https://www.google.com/maps/dir//6211+NC-90,+Collettsville,+NC+28611",
  est: "1936",
};


/* ---------------------------------------------------------------------------
   Form endpoints & optional privacy-friendly analytics.
   Paste the Apps Script Web App URL (ends in /exec) after deploying
   deploy/apps-script/Code.gs. See deploy/GOOGLE-SHEET.md.
   Leave empty and the form falls back to emailing the camp instead of
   pretending to have received anything.

   For cookie-free analytics (Plausible), set ANALYTICS_PLAUSIBLE_DOMAIN to
   "jrvc.org" (and allow plausible.io in deploy/jrvc-site.inc script-src/connect-src).
   Leave empty to emit zero third-party scripts (use GoAccess on nginx logs).
--------------------------------------------------------------------------- */
const ENDPOINT_REGISTRATION = "";
const ANALYTICS_PLAUSIBLE_DOMAIN = "";
const ANALYTICS_SCRIPT_SRC = "https://plausible.io/js/script.js";

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

/* Responsive image dimensions for automatic <picture> + WebP + JPEG srcset */
const IMAGES = {
  "hero":                   { sm: 1100, full: 2000, defaultSizes: "100vw" },
  "chapel":                 { sm: 800,  full: 1500, defaultSizes: "(max-width: 900px) 100vw, 50vw" },
  "lodge-timber":           { sm: 800,  full: 1600, defaultSizes: "(max-width: 900px) 100vw, 50vw" },
  "lodge-aerial":           { sm: 800,  full: 1400, defaultSizes: "(max-width: 900px) 100vw, 50vw" },
  "lodge-front":            { sm: 800,  full: 1400, defaultSizes: "100vw" },
  "valley-road":            { sm: 800,  full: 1400, defaultSizes: "100vw" },
  "aerial-overhead":        { sm: 800,  full: 1300, defaultSizes: "100vw" },
  "rafting":                { sm: 600,  full: 900,  defaultSizes: "(max-width: 900px) 100vw, 50vw" },
  "gallery-dining-hall":    { sm: 640,  full: 1200, defaultSizes: "(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" },
  "gallery-rafting":        { sm: 640,  full: 1200, defaultSizes: "(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" },
  "gallery-archery":        { sm: 640,  full: 1200, defaultSizes: "(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" },
  "gallery-swimming-hole":  { sm: 640,  full: 1200, defaultSizes: "(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" },
  "gallery-lodge-hammocks": { sm: 640,  full: 1200, defaultSizes: "(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" },
  "gallery-cabin-story":    { sm: 640,  full: 1200, defaultSizes: "(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" },
};

/* 2026 Summer Camp sessions (single-sourced for structured data) */
const SESSIONS_2026 = [
  {
    id: "juniors-crafts",
    name: "Juniors: Arts & Crafts (Rising Grades 3–5)",
    startDate: "2026-06-21",
    endDate: "2026-06-27",
    price: "485",
    description: "Six-night residential camp session for rising 3rd–5th graders focused on making things by hand, archery, tubing the Johns River, hiking, and campfire.",
  },
  {
    id: "juniors-cooking",
    name: "Juniors: Cooking (Rising Grades 3–5)",
    startDate: "2026-07-12",
    endDate: "2026-07-18",
    price: "485",
    description: "Six-night residential camp session for rising 3rd–5th graders cooking alongside camp kitchen staff plus afternoon outdoor camp activities.",
  },
  {
    id: "mh-paddle",
    name: "Middle High: Paddle (Rising Grades 6–8)",
    startDate: "2026-07-12",
    endDate: "2026-07-18",
    price: "545",
    description: "Six-night residential camp session for rising 6th–8th graders built around paddling, river time, and an overnight under the stars.",
  },
  {
    id: "mh-caving",
    name: "Middle High: Caving (Rising Grades 6–8)",
    startDate: "2026-07-19",
    endDate: "2026-07-25",
    price: "545",
    description: "Six-night residential camp session for rising 6th–8th graders featuring guided off-site cave exploration and classic camp activities.",
  },
  {
    id: "sh-adventure",
    name: "Senior High: High Adventure (Rising Grades 9–12)",
    startDate: "2026-06-21",
    endDate: "2026-06-27",
    price: "545",
    description: "Six-night residential camp session for rising 9th–12th graders with off-site climbing and whitewater paddling trips.",
  },
  {
    id: "sh-paddle",
    name: "Senior High: Paddle (Rising Grades 9–12)",
    startDate: "2026-06-28",
    endDate: "2026-07-04",
    price: "545",
    description: "Six-night residential camp session for rising 9th–12th graders with river days, lake afternoons, and a July 4 campfire.",
  },
  {
    id: "day-camp",
    name: "JRVC Summer Day Camp (Rising Grades 1–6)",
    startDate: "2026-06-22",
    endDate: "2026-07-31",
    price: "249",
    description: "Six weekly Monday–Friday day camp sessions (8:30 a.m. to 4:30 p.m.) for rising 1st–6th graders, including lunch and all activities.",
  },
];

const PAGES = [
  { slug: "index", file: "home.html", nav: "", ogImage: "assets/img/hero.jpg", title: "Summer Camp & Retreat Center in the Blue Ridge Mountains", desc: "Johns River Valley Camp has welcomed campers to the Blue Ridge foothills since 1936. Summer camp, retreats, and mission trips in Collettsville, NC." },
  { slug: "summer-camp", file: "summer-camp.html", nav: "summer-camp.html", ogImage: "assets/img/rafting.jpg", title: "2026 Summer Camp — Sessions, Ages & Tuition", desc: "Six residential sessions for rising 3rd–12th graders plus six weeks of day camp for rising 1st–6th graders, June–July 2026. Ages, dates, tuition, and what's included." },
  { slug: "retreats", file: "retreats.html", nav: "retreats.html", ogImage: "assets/img/lodge-timber.jpg", title: "Group Retreats & Meeting Space — Rates & Booking", desc: "Plan a retreat, staff training, family reunion, or wedding at JRVC. Lodging for 8–120, meals included, published rates, year-round availability." },
  { slug: "mission-trips", file: "mission-trips.html", nav: "mission-trips.html", ogImage: "assets/img/valley-road.jpg", title: "Youth & College Mission Trips in Appalachia", desc: "All-inclusive mission trips for youth groups and college teams in the Southern Appalachian Mountains. Serving others, built around your group." },
  { slug: "facilities", file: "facilities.html", nav: "facilities.html", ogImage: "assets/img/aerial-overhead.jpg", title: "Lodging & Meeting Facilities", desc: "Modern accessible living units, cabins, primitive outpost, and meeting space across 150 acres beside the Johns River." },
  { slug: "get-involved", file: "get-involved.html", nav: "get-involved.html", ogImage: "assets/img/valley-road.jpg", title: "Give, Volunteer & Work at Camp", desc: "Fund a campership, join a work weekend, or spend a summer on staff at Johns River Valley Camp." },
  { slug: "about", file: "about.html", nav: "about.html", ogImage: "assets/img/chapel.jpg", title: "About JRVC — Outdoor Ministry Since 1936", desc: "Johns River Valley Camp is the outdoor ministry site of the Southern Conference, United Church of Christ. Our mission, our place, and our people." },
  { slug: "faq", file: "faq.html", nav: "", ogImage: "assets/img/valley-road.jpg", title: "Frequently Asked Questions", desc: "Tuition, drop-off times, packing lists, staff screening, allergies, financial aid, and everything else families ask before camp." },
  { slug: "register", file: "register.html", nav: "", ogImage: "assets/img/lodge-front.jpg", title: "Register for 2026 Summer Camp", desc: "Register for a 2026 JRVC summer session. Deposit, cancellation policy, and what happens next." },
  { slug: "visit", file: "visit.html", nav: "", ogImage: "assets/img/hero.jpg", title: "Visit & Contact JRVC", desc: "Directions to 6211 NC-90, Collettsville NC. Phone, email, mailing address, and what to expect on the drive in." },
  { slug: "404", file: "404.html", nav: "", ogImage: "assets/img/hero.jpg", noindex: true, title: "Page not found", desc: "That page has moved or never existed. Find summer camp, retreats, and contact details for Johns River Valley Camp." },
  { slug: "privacy", file: "privacy.html", nav: "", ogImage: "assets/img/hero.jpg", title: "Privacy Policy", desc: "What information Johns River Valley Camp collects, why, and how to have it removed." },
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

function structuredData(p) {
  const orgId = `${SITE.url}/#organization`;
  const placeAddress = {
    "@type": "PostalAddress",
    streetAddress: "6211 NC-90",
    addressLocality: "Collettsville",
    addressRegion: "NC",
    postalCode: "28611",
    addressCountry: "US",
  };
  const orgNode = {
    "@type": ["Organization", "Campground", "LocalBusiness"],
    "@id": orgId,
    name: SITE.name,
    alternateName: "JRVC",
    foundingDate: SITE.est,
    url: `${SITE.url}/`,
    logo: `${SITE.url}/assets/img/favicon.svg`,
    image: `${SITE.url}/${p.ogImage || "assets/img/hero.jpg"}`,
    telephone: "+1-828-387-5736",
    email: SITE.email,
    priceRange: "$48–$545",
    address: placeAddress,
    geo: {
      "@type": "GeoCoordinates",
      latitude: 35.9325,
      longitude: -81.6689,
    },
    parentOrganization: {
      "@type": "Organization",
      name: "Southern Conference of the United Church of Christ",
      url: "https://soc-ucc.org",
    },
  };

  const graph = [orgNode];

  if (p.slug === "summer-camp" || p.slug === "index") {
    for (const s of SESSIONS_2026) {
      graph.push({
        "@type": "ChildrensEvent",
        name: s.name,
        description: s.description,
        startDate: s.startDate,
        endDate: s.endDate,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        image: `${SITE.url}/assets/img/rafting.jpg`,
        location: {
          "@type": "Place",
          name: SITE.name,
          address: placeAddress,
        },
        organizer: { "@id": orgId },
        offers: {
          "@type": "Offer",
          price: s.price,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: `${SITE.url}/register.html?session=${s.id}#form`,
        },
      });
    }
  }

  if (p.slug === "faq") {
    graph.push({
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What does resident camp cost, and what is included?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "$485 for Juniors (rising grades 3–5) and $545 for Middle High (6–8) and Senior High (9–12). Tuition covers six nights in a cabin, all meals, all activities, staffing, and any off-site trips within the session.",
          },
        },
        {
          "@type": "Question",
          name: "What are the day camp hours, grades, and tuition?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Day camp serves rising grades 1–6 and runs Monday through Friday, 8:30 a.m. to 4:30 p.m., for six weeks from June 22 to July 31, 2026. Tuition is $249 per week, including lunch.",
          },
        },
        {
          "@type": "Question",
          name: "What are the drop-off and pick-up times for resident camp?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Drop-off is Sunday from 3:00 to 4:30 p.m. at the lodge. Pick-up is Saturday from 9:00 to 10:00 a.m.",
          },
        },
        {
          "@type": "Question",
          name: "Is financial aid (camperships) available?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The Campership Fund covers part or all of tuition depending on need for both residential and day camp. Requests are confidential.",
          },
        },
      ],
    });
  }

  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };
  return `\n<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

/**
 * Upgrades every <img ... src="assets/img/<key>.jpg" ...> into a responsive
 * <picture> with WebP <source srcset> and JPEG <img srcset> + sizes.
 */
function enhanceImages(html) {
  return html.replace(/<img\b([^>]*?\bsrc="assets\/img\/([a-z0-9-]+)\.jpg"[^>]*)>/g, (fullMatch, attrs, key) => {
    const meta = IMAGES[key];
    if (!meta) return fullMatch;

    const isHero = /\bclass="[^"]*\bhero-img\b/.test(attrs);
    const sizesMatch = attrs.match(/\bsizes="([^"]+)"/);
    const sizes = sizesMatch ? sizesMatch[1] : (isHero ? "100vw" : meta.defaultSizes);

    const jpgSrcset = `assets/img/${key}-sm.jpg ${meta.sm}w, assets/img/${key}.jpg ${meta.full}w`;
    const webpSrcset = `assets/img/${key}-sm.webp ${meta.sm}w, assets/img/${key}.webp ${meta.full}w`;

    let cleanAttrs = attrs
      .replace(/\s*\bsrcset="[^"]*"/g, "")
      .replace(/\s*\bsizes="[^"]*"/g, "");

    const imgTag = `<img${cleanAttrs} srcset="${jpgSrcset}" sizes="${sizes}">`;
    const sourceTag = `<source type="image/webp" srcset="${webpSrcset}" sizes="${sizes}">`;
    return `<picture>${sourceTag}${imgTag}</picture>`;
  });
}

function head(p) {
  const canonical = `${SITE.url}/${p.slug === "index" ? "" : `${p.slug}.html`}`;
  const ogImage = `${SITE.url}/${p.ogImage || "assets/img/hero.jpg"}`;
  const robots = p.noindex ? '\n<meta name="robots" content="noindex">' : "";
  const analytics = ANALYTICS_PLAUSIBLE_DOMAIN
    ? `\n<script defer data-domain="${esc(ANALYTICS_PLAUSIBLE_DOMAIN)}" src="${esc(ANALYTICS_SCRIPT_SRC)}"></script>`
    : "";
  const jsonLd = p.noindex ? "" : structuredData(p);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}${p.slug === "index" ? "" : " — JRVC"}</title>
<meta name="description" content="${esc(p.desc)}">${robots}
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:image" content="${ogImage}">
<meta name="theme-color" content="#1f3a2e">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/fraunces-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css?v=${assetVersion}">${analytics}${jsonLd}
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
    <div class="foot-top">
      <div class="foot-brand">
        <p class="foot-name">Johns River Valley<br>Camp &amp; Retreat Center</p>
        <p class="foot-note">Outdoor ministry of the Southern Conference, United Church of Christ. Welcoming campers, families, and groups since ${SITE.est}.</p>
        <p class="foot-note foot-addr">${SITE.address}</p>
      </div>

      <div class="foot-groups">
        <div class="foot-group">
          <h2 class="foot-h">Visit</h2>
          <ul class="foot-list">
            <li><a href="summer-camp.html">Summer Camp</a></li>
            <li><a href="retreats.html">Retreats</a></li>
            <li><a href="mission-trips.html">Mission Trips</a></li>
            <li><a href="facilities.html">Facilities</a></li>
            <li><a href="visit.html">Directions</a></li>
          </ul>
        </div>
        <div class="foot-group">
          <h2 class="foot-h">Connect</h2>
          <ul class="foot-list">
            <li><a href="get-involved.html">Give</a></li>
            <li><a href="get-involved.html#volunteer">Volunteer</a></li>
            <li><a href="get-involved.html#staff">Work at Camp</a></li>
            <li><a href="faq.html">FAQ</a></li>
            <li><a href="visit.html">Contact</a></li>
          </ul>
        </div>
        <div class="foot-group">
          <h2 class="foot-h">Get in touch</h2>
          <ul class="foot-list foot-contact">
            <li><a href="${SITE.phoneHref}">${SITE.phone}</a> <span class="foot-dim">cell</span></li>
            <li><a href="tel:+18287547067">${SITE.campPhone}</a> <span class="foot-dim">camp office</span></li>
            <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
            <li><a href="${SITE.maps}" target="_blank" rel="noopener">Google Maps</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="foot-cta">
      <a class="btn btn-ghost btn-sm foot-give" href="get-involved.html">Support the Campership Fund</a>
    </div>

    <div class="foot-base">
      <p>&copy; ${SITE.est}–<span data-year>2026</span> Johns River Valley Camp. A 501(c)(3) nonprofit.</p>
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
    body = enhanceImages(body);
    const html = head(p) + header(p.nav) + body + footer();
    writeFileSync(`${p.slug}.html`, html, "utf8");
    console.log(`  ${p.slug}.html`.padEnd(24), `${(html.length / 1024).toFixed(1)} KB`);
  }

  const urls = PAGES.filter((p) => !p.noindex).map((p) => {
    const loc = `${SITE.url}/${p.slug === "index" ? "" : `${p.slug}.html`}`;
    return `  <url><loc>${loc}</loc></url>`;
  });
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  writeFileSync("sitemap.xml", sitemap, "utf8");

  const robots = `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`;
  writeFileSync("robots.txt", robots, "utf8");

  if (!ENDPOINT_REGISTRATION) {
    console.log("\n\u26a0  ENDPOINT_REGISTRATION is empty — register.html will refuse to submit");
    console.log("   It shows a 'call the camp' message, never a false confirmation.");
    console.log("   Deploy deploy/apps-script/Code.gs and paste the /exec URL into build.mjs.");
  }
  console.log(`\nBuilt ${PAGES.length} pages + sitemap.xml + robots.txt.`);
}

build();
