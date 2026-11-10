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
   Each of the 5 website forms writes to its own separate Google Sheet:
     1. Camper Registrations : 17aeWZVJoGTIb7XWhFJFZVkwO1dfiHqcAQpVFpl5nAvI
     2. Retreat Inquiries    : 184KUGM_9Ri-oUM_tE_FX_zG4jyfOl2nkwCWufJNZo6Y
     3. Mission Inquiries    : 1hH2vkYJA6TLFvsC6bw9uQoWV0-zAjrGdG_iEXRXuP8A
     4. Contact Messages     : 11xcJ3W0349-BV7-7XC0JhCR3rPnvYJGaBznx4FsqKyA
     5. Newsletter Signups   : 158yCHNPupvhBcvsPMPycVNCzhOFnCw_LcDXJOPmAN4w

   Paste the Apps Script Web App URL (ends in /exec) into ENDPOINT_DEFAULT
   (if using deploy/apps-script/Code.gs, which routes each form to its own
   separate Google Sheet), or paste 5 separate /exec URLs below.
   See deploy/GOOGLE-SHEET.md.
--------------------------------------------------------------------------- */
const FORM_SECRET = "jrvc_2026_0842e65cca05b7011542ac74b693378881f166b1a41c6364";
const ENDPOINT_DEFAULT = "";
// Separate privacy-filtered web app; see deploy/availability/README.md.
const ENDPOINT_AVAILABILITY = "https://script.google.com/macros/s/AKfycbyVG-ciz8JUV0XzaZ5Nmhkog0uGPdXlEdqoDTf9DG-84HoVXdZ6H866LooXwJD656M/exec";
const ENDPOINT_REGISTRATION = "" || ENDPOINT_DEFAULT;
const ENDPOINT_RETREATS     = "" || ENDPOINT_DEFAULT;
const ENDPOINT_MISSIONS     = "" || ENDPOINT_DEFAULT;
const ENDPOINT_CONTACT      = "" || ENDPOINT_DEFAULT;
const ENDPOINT_NEWSLETTER   = "" || ENDPOINT_DEFAULT;
const ANALYTICS_PLAUSIBLE_DOMAIN = "";
const ANALYTICS_SCRIPT_SRC = "https://plausible.io/js/script.js";

const ENDPOINTS = {
  __FORM_SECRET__: FORM_SECRET,
  __ENDPOINT_AVAILABILITY__: ENDPOINT_AVAILABILITY,
  __ENDPOINT_REGISTRATION__: ENDPOINT_REGISTRATION,
  __ENDPOINT_RETREATS__: ENDPOINT_RETREATS,
  __ENDPOINT_MISSIONS__: ENDPOINT_MISSIONS,
  __ENDPOINT_CONTACT__: ENDPOINT_CONTACT,
  __ENDPOINT_NEWSLETTER__: ENDPOINT_NEWSLETTER,
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

/* 2027 Summer Camp sessions; Adult Camp and Family Camp package rates are published. */
const SESSIONS_2027 = [
  {
    "id": "adult-camp",
    "name": "Adult Camp (Adults only)",
    "startDate": "2027-06-13",
    "endDate": "2027-06-19",
    "description": "Who says camp is just for kids? Rediscover the joy of summer camp—with the freedom to enjoy it your way. Join in scheduled activities, share laughter and conversation, or settle beside the river with a good book. Whether you’re looking for adventure, connection, or a little breathing room, Adult Camp offers traditional camp fun at your own pace. Come ready to play, rest, and make room for joy. Rates include lodging, meals, and camp activities: $99 per adult per night double occupancy or $125 single occupancy. Stay June 13–16 or June 16–19 (3 nights: $297 double / $375 single per adult), or June 13–19 (6 nights: $594 double / $750 single per adult)."
  },
  {
    "id": "valleywide-1",
    "name": "Valleywide 1 (Rising grades 3–12 and graduating seniors)",
    "startDate": "2027-06-20",
    "endDate": "2027-06-26",
    "description": "One valley. A whole camp community. A week to belong. Valleywide brings campers of different ages together for the friendships, outdoor adventures, and shared faith that make JRVC special. Activities tailored to different ages and interests give everyone room to explore, build confidence, and try something new. Shared experiences connect the whole community, from first-time campers to graduating seniors. Wherever you are in your camp journey, there’s a place for you in the valley. Tuition is $475 per camper for the session."
  },
  {
    "id": "drama",
    "name": "Drama Camp (Rising grades 6–12 and graduating seniors)",
    "startDate": "2027-06-27",
    "endDate": "2027-07-03",
    "description": "Find your voice. Bring a story to life. Join fellow campers for a week of imagination, rehearsals, and teamwork as you create a production together. Whether you love the spotlight or are stepping onto the stage for the first time, you’ll have opportunities to build confidence, stretch your creativity, and discover the joy of making something bigger than yourself. The week culminates in a Saturday-morning performance for families at pickup—a chance to share the story and celebrate everything you’ve created. Tuition is $560 per camper for the session."
  },
  {
    "id": "family-camp",
    "name": "Family Camp (Children and the adults who call them family)",
    "startDate": "2027-07-04",
    "endDate": "2027-07-10",
    "description": "Your family. Your adventure. Time together that matters. Bring the children in your life to JRVC for a week with room for both togetherness and independence. Parents, grandparents, aunts, uncles, guardians, foster families, and multigenerational groups are welcome—children and the adults who call them family. Enjoy activities as a family, let kids connect with other kids, and take advantage of time just for adults. With opportunities to choose your own adventure, you can find the balance of exploration, play, and rest that fits your family. Make new friends, share in the camp community, and head home with stories you’ll keep telling long after summer ends. Rates per person per night include lodging, meals, and camp activities: adults 18+ $75, teens 12–17 $50, children 4–11 $30, and children 3 and under free. Choose July 4–7 or July 7–10 (3 nights: adults $225, teens $150, children 4–11 $90), or July 4–10 (6 nights: adults $450, teens $300, children 4–11 $180)."
  },
  {
    "id": "sh-paddle",
    "name": "Senior High Paddle Camp (Rising grades 9–12 and graduating seniors)",
    "startDate": "2027-07-11",
    "endDate": "2027-07-17",
    "description": "Adventure is waiting around the next bend. Explore area rivers, learn paddling skills, and take on new challenges alongside fellow campers—no previous paddling experience required. An overnight trip extends the adventure, giving you more time outdoors and opportunities to build friendships and discover what you can accomplish together. Add in traditional JRVC camp activities, and you have a week of adventure, community, and faith—on and off the water. Tuition is $560 per camper for the session."
  },
  {
    "id": "valleywide-2",
    "name": "Valleywide 2 (Rising grades 3–12 and graduating seniors)",
    "startDate": "2027-07-18",
    "endDate": "2027-07-24",
    "description": "One valley. A whole camp community. A week to belong. Valleywide brings campers of different ages together for the friendships, outdoor adventures, and shared faith that make JRVC special. Activities tailored to different ages and interests give everyone room to explore, build confidence, and try something new. Shared experiences connect the whole community, from first-time campers to graduating seniors. Wherever you are in your camp journey, there’s a place for you in the valley. Tuition is $475 per camper for the session."
  },
  {
    "id": "mh-paddle",
    "name": "Middle High Paddle Camp (Rising grades 6–9)",
    "startDate": "2027-07-25",
    "endDate": "2027-07-31",
    "description": "Grab a paddle and discover what’s around the bend. Explore area rivers, practice new skills, and grow in confidence as you share an adventure with fellow campers. No previous paddling experience is required—just a willingness to learn and try something new. An overnight trip adds to the adventure, while traditional JRVC activities round out a week of outdoor exploration, friendship, and camp fun. Tuition is $560 per camper for the session."
  }
];

const PAGES = [
  { slug: "index", file: "home.html", nav: "", ogImage: "assets/img/hero.jpg", title: "Summer Camp & Retreat Center in the Blue Ridge Mountains", desc: "Johns River Valley Camp has welcomed campers to the Blue Ridge foothills since 1936. Summer camp, retreats, and mission trips in Collettsville, NC." },
  { slug: "summer-camp", file: "summer-camp.html", nav: "summer-camp.html", ogImage: "assets/img/rafting.jpg", title: "2027 Summer Camp — Sessions, Dates & Adventures", desc: "Explore JRVC summer 2027: Adult Camp, Valleywide, Drama, Family Camp, and Paddle Camps, June 13–July 31. Dates, rising grades, and camp descriptions." },
  { slug: "retreats", file: "retreats.html", nav: "retreats.html", ogImage: "assets/img/lodge-timber.jpg", title: "Group Retreats & Meeting Space — Rates & Booking", desc: "Plan a retreat, staff training, family reunion, or wedding at JRVC. Lodging for 8–120, meals included, published rates, year-round availability." },
  { slug: "mission-trips", file: "mission-trips.html", nav: "mission-trips.html", ogImage: "assets/img/valley-road.jpg", title: "Youth & College Mission Trips in Appalachia", desc: "All-inclusive mission trips for youth groups and college teams in the Southern Appalachian Mountains. Serving others, built around your group." },
  { slug: "facilities", file: "facilities.html", nav: "facilities.html", ogImage: "assets/img/aerial-overhead.jpg", title: "Lodging & Meeting Facilities", desc: "Modern accessible living units, cabins, primitive outpost, and meeting space across 150 acres beside the Johns River." },
  { slug: "get-involved", file: "get-involved.html", nav: "get-involved.html", ogImage: "assets/img/valley-road.jpg", title: "Give, Volunteer & Work at Camp", desc: "Fund a campership, join a work weekend, or spend a summer on staff at Johns River Valley Camp." },
  { slug: "about", file: "about.html", nav: "about.html", ogImage: "assets/img/chapel.jpg", title: "About JRVC — Outdoor Ministry Since 1936", desc: "Johns River Valley Camp is the outdoor ministry site of the Southern Conference, United Church of Christ. Our mission, Statement of Faith, our place, and our people." },
  { slug: "faq", file: "faq.html", nav: "", ogImage: "assets/img/valley-road.jpg", title: "Frequently Asked Questions", desc: "Tuition, drop-off times, packing lists, staff screening, allergies, financial aid, and everything else families ask before camp." },
  { slug: "register", file: "register.html", nav: "", ogImage: "assets/img/lodge-front.jpg", title: "Register for 2027 Summer Camp", desc: "Register for a 2027 JRVC summer session. Deposit, cancellation policy, and what happens next." },
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
    priceRange: "$18–$545",
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
    for (const s of SESSIONS_2027) {
      graph.push({
        "@type": "Event",
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
        {
          "@type": "Question",
          name: "Is JRVC a Christian camp? Are campers of all backgrounds welcome?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Our camp is rooted in the Christian faith and the belief that God’s love invites us into a life of discovery, compassion, and community. Our welcome extends to campers and families of all backgrounds and faith traditions — wherever you are on your journey, you are welcome here.",
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
            <li><a href="about.html#faith">Statement of Faith</a></li>
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
