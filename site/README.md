# jrvc.org — redesign

A rebuilt website for **Johns River Valley Camp**, a 90-year-old outdoor ministry and retreat center in Collettsville, NC. Static HTML/CSS/JS, no build dependencies, no framework, no CMS lock-in.

This was built from the audit in [`../jrvc-org-evaluation.md`](../jrvc-org-evaluation.md) (or `jrvc-org-evaluation.md` at the repo root). Every Priority 0 and Priority 1 fix in that document is addressed structurally here.

---

## Run it

```bash
node build.mjs            # regenerate the .html files from src/pages/
python3 -m http.server 8080
```

Pages are generated into the repo root so they can be deployed as-is to any static host. `netlify.toml` is included with caching and security headers; the `command` is `node build.mjs`.

**Source layout**

```
src/pages/*.html     page bodies (no <head>, <header>, or <footer> — those come from the shell)
build.mjs            shell + nav + footer + <head>/SEO, renders pages to repo root
assets/css/site.css  the entire design system (~1,100 lines, one file)
assets/js/site.js    mobile nav, FAQ tabs, form handling — all progressive enhancement
assets/img/          optimized photography pulled from the camp's own Drive
assets/fonts/        self-hosted Fraunces + Inter (woff2, no Google Fonts request)
```

---

## Pages

| Page | Replaces | What's new |
|---|---|---|
| `index.html` | HOME | Stale 90th-anniversary hero removed; price table above the fold; FAQ preview |
| `summer-camp.html` | `/summer-camps`, `/day-camp` | **Tuition on every session**, consistent grade labels, day camp merged in, CIT |
| `retreats.html` | `/retreats`, `/retreats-and-special-events` | **Published rate table**, on-page inquiry form, dated open retreat |
| `mission-trips.html` | `/mission-camps`, `/service-trips` | Youth and college trips on one page, both priced |
| `facilities.html` | `/lodging`, `/meeting-spaces` | Rates on all four accommodation types, no more "contact us for rates" |
| `get-involved.html` | `/give`, `/get-involved`, `/volunteeroportunities` | **Working donation form with named funds**, real projects, staff roles |
| `about.html` | `/about-us`, `/directors-statement` | One director, one set of facts, four programs named |
| `faq.html` | `/faqs` | **4 tabs × 8–9 real answers** (was 4 tabs × 1 answer) including a full safety section |
| `register.html` | `/register`, `/book-online`, Google Forms | Single registration flow with session selection and deposit |
| `visit.html` | `/contact-us` | Directions as *text*, not a PDF; both addresses explained |
| `privacy.html` | *(did not exist)* | Needed — the site collects minors' medical data |

---

## What the audit flagged, and what this does about it

**Fixed structurally**

- Hero no longer advertises a past event. Nearest dated content is the next real thing (spring retreat, April 2026), clearly dated.
- Tuition is on every session card and in a comparison table on the home page. No page requires a form submission to learn a price.
- Retreat rates are published in a table. "Contact us for rates" appears nowhere.
- The donation flow is a real form with fund designation and dollar amounts, plus the EIN.
- Registration is one flow with a session selector, so submissions are attributable — the original had one Google Form serving all three residential tiers with no session field.
- Alt text describes every image. Dimensions are set on every `<img>` to prevent layout shift. Images are lazy-loaded below the fold with `fetchpriority="high"` on the hero.
- The FAQ is written. Four audiences, real answers, including staff screening, ratios, health coverage, water safety, and allergies.
- No PDF-only directions; no "press and hold Enter" widget; no blank pages; no stock photos.
- Typo fixes: "Maintenance", "expiration", "Anniversary", "volunteer-opportunities".

**Deliberately not invented**

Anything that would be a factual claim about the camp has been built as a clearly-marked value rather than made up. Search `data-confirm` and the notes below.

---

## Before this goes live — replace these

The layout, copy structure, and interaction design are done. These values are **placeholders chosen to be plausible**, not sourced facts. Each needs one decision from the camp.

### Tuition and rates
I invented round numbers so the price tables would be complete. **The real figures are not published anywhere on the current site** — that is the gap this redesign closes, but only the camp can fill it.

| Value used | Where |
|---|---|
| Juniors $485 / MH & SH $545 | `summer-camp.html`, `index.html`, `faq.html` |
| $100 deposit | `register.html`, `faq.html` |
| Retreat rates $48–$78 /person /night | `retreats.html`, `facilities.html` |
| Meals $28 /person /day | `retreats.html` |
| Youth mission trip $395 /person | `mission-trips.html` |
| Women's Retreat $185, April 17–19 2026 | `retreats.html` |

Day camp ($249), college service trips ($250), sibling discounts, and the 50%-ish structure are the only figures grounded in the current site.

### Safety language — read this one carefully
`faq.html#safety` makes specific operational claims: national background checks, 1:6–1:8 cabin ratios, a health officer on site every session, Lenoir hospital ~30 minutes, swim tests, mandated-reporter training, ACA standards.

**These are written as what a well-run camp does, not as verified statements about JRVC.** They must be confirmed by Kevin before publishing. If any is wrong, the page is worse than the silence it replaced. The ACA answer is deliberately hedged — replace it with a plain yes or no.

### Organizations and identifiers
- **EIN `56-0640109` is a placeholder.** Use the camp's real EIN on `get-involved.html` and `privacy.html`.
- **Director:** I resolved the site's contradiction (director's statement signed *Phil Hardy*, contact page listing *Kevin Russell*) in favour of Kevin Russell, who appears as current ED on `/contact-us`, `/service-trips`, and `/book-online`. Confirm, and update `about.html`.

### Forms
**Registration posts to a Google Sheet** via an Apps Script Web App — see
[`deploy/GOOGLE-SHEET.md`](../deploy/GOOGLE-SHEET.md). Two values must be set:

- `ENDPOINT_REGISTRATION` in `build.mjs` (the deployed `/exec` URL)
- `data-secret` on the form in `src/pages/register.html` (must match `SECRET` in `Code.gs`)

Until both are set the form **refuses to submit** and tells the visitor to
call the camp — it never shows a false confirmation. The script also fails
closed if `SECRET` is left as the placeholder.

The other five forms (retreat, mission, contact, donation, newsletter) still
carry `data-demo` and now say **"Demo form. Nothing was sent."** rather than
pretending. Wire them the same way, or leave them clearly labelled.

Still outstanding:
1. **No payment is taken.** The registration button says "Continue to deposit
   — $100" but no card is charged. Add Stripe/PayPal, or move to a camp
   management system, before advertising a deposit.
2. No capacity limits — overbooking a session is possible. The audit flagged Google Forms as an exposure; this redesign's registration form inherits that risk until it posts somewhere appropriate.

### Photography
All images in `assets/img/` come from the camp's own **Drive "Photos" folder** and are real: the autumn valley aerials, the Boger Shuford lodge, the stone chapel, and a 2021 camper rafting photo. They are optimized to web sizes (90% smaller than the 12–28 MB originals).

Still needed:
- **Summer/activity photos.** The drone set is all October. A camp that shows only autumn foliage is selling the wrong season. The `Photos/Summer 2026/*` folders contain hundreds of HEIC session photos (MH Caving, MH Paddle, JA Cooking, SH Paddle, SH Adventure, JA Crafts) — these should replace the autumn aerials on `summer-camp.html`.
- **Named staff portraits** for `about.html`, with consent.
- **Real photos of the bathhouse and cabin projects** for `get-involved.html#volunteer`. I removed the image placeholders rather than repeat the original site's mistake of using Wix stock photos next to real projects.

### Content that needs a camp decision
- Retreat availability is stated as **Aug–May** (from `/retreats-and-special-events`, which said every month except June and July). Confirm.
- The mission trip themes are real. The pricing tiers split youth ($395) vs college ($250) — only the college figure is sourced.
- "Two emails a season" newsletter promise on `get-involved.html` — match it to real practice.

---

## Accessibility notes

- Semantic landmarks, one `<h1>` per page, no heading-level skips.
- Skip link; visible focus rings on all interactive elements.
- FAQ tabs implement the ARIA tabs pattern with arrow-key/Home/End support — and **all four panels render visible without JavaScript**, collapsing only once JS runs, so no content is ever unreachable.
- Form fields have real `<label>` elements, required-state text (not colour alone), and a `role="status"` confirmation.
- Images have descriptive alt text and intrinsic dimensions.
- Honours `prefers-reduced-motion`; print stylesheet included.
- Mobile has a sticky call/register bar.

## Known gaps

- **No screenshots were rendered** — this environment could not download a browser. The CSS has been validated only by construction, not by eye. Expect small spacing corrections on first real view.
- No automated a11y audit (axe/Lighthouse) has been run for the same reason.
- Analytics and a privacy-respecting consent banner are not wired up.
