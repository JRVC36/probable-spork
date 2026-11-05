# jrvc.org — Website Evaluation

**Site:** Johns River Valley Camp (JRVC) & Retreat Center — `https://www.jrvc.org`
**Platform:** Wix (Wix Bookings, Wix Blog, Wix Stores modules all enabled)
**Audit date:** November 4, 2026
**Scope:** All 24 pages in `pages-sitemap.xml`, plus blog, booking, and service pages
**Method:** Full content retrieval of every page. I could not execute JavaScript or run Lighthouse (PageSpeed quota exhausted, raw HTTP blocked from my environment), so **performance and accessibility items are marked `VERIFY`** where they depend on the rendered DOM. Everything marked `OBSERVED` is directly confirmed from page content.

---

## 1. The headline

> **The site's biggest problem isn't design — it's that it sells four different products to four different audiences with one generic funnel, and the funnel leaks at exactly the moment a decision gets made: price and dates.**
>
> A parent ready to register for residential camp cannot find the price anywhere on the site. A retreat planner is told "contact us for rates" four times. A donor reading a compelling giving page finds no donate button. Meanwhile the hero banner is promoting a party that ended 39 days ago.

The bones are good — the photography is genuinely strong, the copywriting on the giving page is well above nonprofit average, and the mission is stated clearly. What's missing is **commercial completeness**: prices, dates, availability, safety credentials, and a single obvious next step.

**Overall:** ~65% of the way to a site that converts. The remaining gap is almost all content and information architecture, not visual design — which means most of it is fixable by the camp's own staff, without a developer.

---

## 2. Scorecard

| Dimension | Score | Notes |
|---|---|---|
| First impression / visual | 7/10 | Excellent photography, clean layout. Hero is stale. |
| Clarity of offering | 4/10 | Four audiences, overlapping age bands, no guidance on which to pick |
| Price & date transparency | 2/10 | Residential camp price absent entirely. Retreat rates withheld. |
| Conversion path (enroll) | 3/10 | Three different Google Forms + a Wix booking calendar + a booking service priced at $450 for "1 hr" |
| Trust & safety signals | 3/10 | No accreditation, no safety protocol, no staff credentials, no testimonials |
| Content freshness | 2/10 | Expired event in hero, "APR. 2025" retreat, "Ended Apr 3 2025" booking |
| Information architecture | 4/10 | 24 pages, several orphaned/blank/duplicated URLs |
| SEO | 3/10 | Low-content pages indexed, broken links, no FAQ schema, no privacy policy |
| Donation experience | 3/10 | Compelling copy, but giving is fragmented and the Give page has no action |
| Accessibility | `VERIFY` | Filename alt text, an "press and hold Enter" widget, PDF-only directions |

---

## 3. What's working — protect these

Being specific about strengths matters, because several fixes below risk throwing these away.

1. **The photography is a real asset.** The homepage hero (drone shot over the valley), the chapel shot, the bridge shot — this is the single most persuasive thing on the site. It sells the place better than any copy.
2. **The giving page copy is excellent.** "Spark a Future. Give the Gift of Camp." and the four named funds (Campership, Rocking Chair, Special Projects, Legacy) is genuinely good fundraising structure. The "Camperships — our greatest need and highest priority" framing is best practice. **It just needs a working donation button.**
3. **Mission camp positioning is differentiated.** "We handle the logistics so you can focus on your students' transformation" and "One price, zero stress" speaks directly to youth pastors' actual pain. The three themed trip options (Rural Appalachia / Unhoused Assistance / Environmental Justice) give groups a reason to choose JRVC over a generic site.
4. **The trip is priced.** Service Trips at $250/student with free staff advisors is clear and generous-sounding. This is the one place pricing is done right — use it as the model for everything else.
5. **Local business schema is present** (name, address, phone in structured data). Good SEO foundation.
6. **The CIT program page is thorough.** Ten numbered sections covering eligibility, compensation, code of conduct. Unusually complete for a camp of this size.
7. **Contact page surfaces a real cell number and both addresses.** Accessible, human.

---

## 4. Priority 0 — fix this week

These are actively costing money or credibility.

### 4.1 The hero banner advertises a party that already happened
**`OBSERVED`** — The homepage's first and largest element is:

> "Celebrate — Join Our 90th Anniversary Festivities — **RSVP Here**"

The event was **Saturday September 26, 2026**. Today is **November 4, 2026 — 39 days ago.** The RSVP page is still live, still collecting name/email/phone/address/party size, and still asks "I would like to stay Friday and/or Saturday night."

A first-time visitor — a parent, a pastor, a donor — lands on a dead event. It's the first thing they see, and it signals *nobody is home*.

**Fix (< 30 min):** Replace the hero with the current priority: 2026 summer camp registration. Move the anniversary to a "90 Years of JRVC" archive post with photos — it's a genuinely valuable trust asset, just not as the front door. **And turn the RSVP form off so you aren't collecting party sizes for a past event.**

### 4.2 A parent cannot find the price of residential camp
**`OBSERVED`** — `/summer-camps` lists six sessions with dates and grades — Arts & Crafts June 21–27, Cooking July 12–18, MH Paddle, Caving, High Adventure, SH Paddle — and **no price, no deposit amount, no cancellation policy, no "what's included."**

Meanwhile Day Camp volunteers `$249 per session`, Service Trips `$250 per student`, and the booking calendar lists "Camp Registration — 1 hr — **From $450**."

So the price signal a parent actually encounters is a **$450 for a "1 hr" service**, which is either wrong, a deposit, or a placeholder. No parent will complete a form to find out.

Price is the #1 question for any camp and the #1 cause of drop-off. Every competitor answers it on the program page.

**Fix:** Add a price block to each of the six sessions: tuition, deposit, what's included, sibling/multi-week discount (Day Camp already offers these — say if residential does), and a one-line cancellation policy. Fix or remove the `$450 / 1 hr` booking service.

### 4.3 The Give page has no donate button
**`OBSERVED`** — `/give` has a strong four-section narrative ending in four named funds:

- Campership Fund
- Rocking Chair Fund
- Special Projects (Kitchen and Water)
- Legacy Giving

The rendered content contains **no donation link, button, amount selector, or mail-in instruction** for any of them. The only live giving mechanism on the site is a **`btn_donate_LG.gif` PayPal button image** buried on `/get-involved`.

A donor who reads to the bottom of that page has nowhere to click.

**Fix:** One primary "Give Now" button in the hero and one under each fund, deep-linking to a real donation form with suggested amounts ($50 / $100 / $250 / other, one-time vs. monthly). Add the EIN and "501(c)(3) — gifts are tax-deductible" line. The copy is already written; it just needs a destination.

### 4.4 The "Current Volunteer Opportunities" page is stock photos
**`OBSERVED`** — `/volunteeroportunities` (sic — misspelled URL) is titled "Projects" and lists Women's Bathhouse, Vehicle Shelter, Men's Bathhouse, New Cabins — **with phases, but no dates, no group-size requirements, no skill requirements, no cost, and no sign-up.**

Worse, **two of the four images are Wix stock photos**, not JRVC:
- `Wooden Garage.jpg` — stock
- `Camping Cabin.jpg` — stock (`11062b_...` is a Wix media library ID, not the camp's `cd0057_...` prefix)

Every other image on the site uses the camp's `cd0057_` prefix. These two are generic stock. On a page asking people to show up with tools, fake photos of construction projects undercut the whole appeal.

**Fix:** Replace stock images with real photos of the actual bathhouses and build site. Add "what a volunteer day looks like," group-size capacity, what to bring, and a real signup (email link is fine). Fix the URL to `/volunteer-opportunities` with a redirect.

### 4.5 Two pages are completely blank
**`OBSERVED`** — Both are in the sitemap and both render as empty pages with only "top of page / bottom of page":

- **`/shop-1`** — titled "Mother's Retreat," zero content
- **`/kitchen-planner`** — zero content

Blank pages in a sitemap waste crawl budget and, if a visitor hits one, read as a broken site. **Fix:** Delete or unpublish both, and remove them from the sitemap.

### 4.6 The blog's only article is a 404
**`OBSERVED`** — `/blog` ("Poplar Thoughts") lists exactly one post: *"Did you know summer camp serves as a pipeline to full-time ministry?"* Its link points to `/post/summer-camp-to-ministry-pipeline`, which **redirects to `/single-post/...` and returns a 404 "Page Doesn't Exist."**

The one piece of content marketing on the site is unreachable. This is a classic Wix slug-migration artifact.

**Fix:** Re-save the post to regenerate its route, or update the link. Then either commit to 1 post/month or remove the blog from the nav — a blog with one broken post is worse than no blog.

---

## 5. Priority 1 — fix this month (revenue and trust)

### 5.1 The FAQ page has one answer and four empty tabs
**`OBSERVED`** — `/faqs` presents four tabs — **Day Camp | Resident Camp | Mission Camps | Retreats** — and the entire body of the page is a single answer: "What does a typical day look like?" (a day camp schedule).

For a camp, the FAQ is the highest-value page on the site. It's where you defuse every objection that blocks a registration. It also currently contains **no resident camp, mission camp, or retreat content at all**, despite having tabs for them.

The questions parents actually have — and which this site answers *nowhere*:

| Unanswered question | Why it blocks conversion |
|---|---|
| What does it cost and what's the deposit? | See 4.2 — biggest single drop-off |
| Drop-off and pick-up times? | Logistical blocker for every working parent |
| What's the packing list? | Parents want to print it |
| Do you do background checks on staff? | **Safety is the #1 parent concern, and it's absent from the entire site** |
| Is there a nurse / health officer on site? | Same |
| Are you ACA accredited? | Same — and if you are, it's a major conversion lever you're not using |
| What's the cancellation / refund policy? | Removes perceived risk |
| How do you handle allergies and medication? | Dealbreaker for a meaningful share of families |
| Can parents visit / phone access? | Separation anxiety cuts both ways |
| Is financial aid available? | You have a Campership Fund — say so on the camp page, not just the giving page |
| Where do I sleep if I'm a chaperone? | Group leaders need this |
| What's cell service / wifi like? | Practical, and a genuine differentiator ("we're a technology-free sanctuary" — say what that means for parents) |

**Fix:** Write 8–12 real Q&As per tab. This is a half-day of writing and it is the highest-ROI work available on this site. Then add `FAQPage` schema for search visibility.

### 5.2 Overlapping age bands with no guidance on which program to pick
**`OBSERVED`** — A parent of a rising 4th grader sees two options that both fit:

- **Day Camp — "The Explorers (Grades 3–4)"**, $249/week, sessions June 22 – July 31
- **Residential "Juniors (Rising 3rd–5th)"**, June 21–27, price unstated

And the age bands don't align between pages: Day Camp uses *Grades 1-2 / 3-4 / 5-6*; Residential uses *Rising 3rd-5th / 6th-8th / 9th-12th*. The residential page also has internal label drift — headers say "Middle High (Rising 6th-8th)" but the sessions underneath say "Grades 6-9," and "Senior High (Rising 9th-12th)" over sessions labeled "Grades 9-12."

**Fix:** Add a single "Which program is right for my camper?" comparison — a three-row table (Day Camp / Residential / Mission) with age, length, price, overnight, and "best for." Then make every grade label on the residential page consistent (`Rising 6th–8th`).

### 5.3 "Contact us for rates and availability" — four times
**`OBSERVED`** — `/lodging` describes four excellent accommodation types (Boger Shuford Living Unit, Mt. Zion Cabin, Main Site, Outpost) with real detail on capacity and accessibility. Each description then ends with the identical sentence: **"Contact us for rates and availability."**

`/meeting-spaces` does the same for the one unit it lists.

This is a group-retreat lead funnel with the pricing stage removed. Retreat planners — churches, corporations, family reunions — are comparing 3–5 sites and will skip any site that won't quote a rate. You've done the hard part (great descriptions, accessibility info) and stopped one step short.

**Fix:** Publish a rate table (per-person/night by unit, minimum group size, meals add-on) or at minimum a starting-from figure with a "get a custom quote in 24 hours" form. Then make the inquiry a **form on the page** — right now the path is:

> read "LEARN MORE" → download a **PDF** retreat information sheet → fill it out by hand → email it

That's 4 steps and an offline artifact for a task that should be one form. Replace the PDF with an embedded form.

### 5.4 Registration is split across five systems, none of which talk
**`OBSERVED`** — To register for anything, a family might touch:

1. `/register` → links out to Day Camp, Residential, and a Google Form for Mother's/Women's Retreat
2. `/summer-camps` → "Register Now" (all three tiers link to **the same** Google Form: `1FAIpQLSdAtqfVCGwdI3TXrs...`)
3. `/day-camp` → a **different** Google Form (`1FAIpQLSe03tql2qqi...`)
4. `/book-online` → Wix Bookings, listing "Camp Registration — 1 hr — From $450" and a retreat marked "Ended"
5. `/apply` and `/citapplication` → Wix forms
6. `/shop-1` → an empty Wix Store

**Problems this creates:**
- The single Google Form behind all three residential tiers **cannot tell you which session or tier the camper chose** — the form has no session field.
- **No payment is collected at registration** for residential camp. There's no tuition anywhere to pay.
- **No confirmation, no account, no way to see your registration.** Google Forms gives the family a receipt-free dead end.
- **Minors' PII — names, birthdays, addresses, medical conditions, emergency contacts — is being collected into Google Forms** with no privacy policy on the site (see 5.5). Target parent names, addresses, and children's medical data into a Google Form is a genuine data-protection exposure and, for a UCC-affiliated ministry, a policy question worth raising internally.
- Two different registration systems for the same summer season means the camp's own staff are reconciling spreadsheets.

**Fix (staged):**
- **Now:** Add a session/tier selector as a required field to each form so submissions are attributable.
- **Now:** Put the exact tuition and deposit on the page above each form, and state how payment happens.
- **This winter:** Consolidate onto one system. Wix Bookings is already licensed and installed — it can do session selection, capacity, intake questions, and payment in one flow. Pick one system and retire the Google Forms.

### 5.5 No privacy policy, and you're collecting children's health data
**`OBSERVED`** — `/privacy-policy` returns 404. There is no privacy policy, terms, or data-handling statement anywhere on the site.

Meanwhile the site collects: full names, emails, phones, **home addresses**, **birthdates of minors**, **parent/guardian contacts**, **emergency contacts**, **medical conditions and allergies**, and **references** — via `/citapplication`, `/apply`, `/90thanniversary`, `/contact-us`, and the Google Forms.

**Fix:** A one-page privacy policy (what you collect, why, how long you keep it, who you share it with, how to request deletion) linked in the footer. For a youth-serving organization this is table stakes, and some grant applications require it.

### 5.6 No safety, accreditation, or staff credential information anywhere
**`OBSERVED`** — Across all 24 pages there is **no mention of** background checks, staff training, ratios, ACA accreditation, health/nursing coverage, emergency procedures, or a safety record.

For a parent deciding where to send a child for a week, **this is the single largest trust gap on the site** — larger than price. The site is rich in emotional appeal ("confidence is found, resilience is built") and silent on the thing that actually gates the decision.

**Fix:** A `/safety` page or a homepage trust strip: staff screening process, training hours, camper-to-staff ratios, health officer coverage, ACA status (if accredited, lead with it — it's a differentiator most small camps can't claim), emergency and communication policy. Add 2–3 named staff bios with photos.

### 5.7 Who is the Executive Director?
**`OBSERVED` — contradiction, please confirm internally.** The two pages disagree:

- `/directors-statement` — signed **Phil Hardy**, "called to become Executive Director ... in 2017"
- `/contact-us` — lists **"Executive Director: Kevin Russell"** with his cell number
- `/service-trips` — "Contact Kevin Russell to learn more"

One of these is stale. Either way, a visitor who reads the director's page and then the contact page sees two different leaders. **Fix:** Update the statement page to the current director, or retitle the page so it's clear it's historical.

---

## 6. Priority 2 — content and structure

### 6.1 Retreat page is advertising a retreat from April 2025
**`OBSERVED`** — `/retreats-and-special-events` says:

> "We invite you to join us at one of our upcoming retreats: **MOTHERS RETREAT — APR. 2025**"
> "LEARN MORE & REGISTER" → links to `/shop-1`, which is **blank**

And `/book-online` and `/service-page/mother-s-women-s-retreat` both show the retreat as **"Ended Apr 3, 2025 – Apr 7, 2025."**

So the "upcoming retreat" ended 19 months ago and its registration page is empty. Same failure mode as the hero banner, in a different place. **Fix:** Either publish the next retreat date or change the copy to "our annual Mother's Retreat — dates announced each winter, join the mailing list." Turn this from dead content into a list-building asset.

### 6.2 Information architecture: duplicated and orphaned pages
**`OBSERVED`** — 24 indexed pages, with clear overlap and dead ends:

| Issue | Pages | Recommendation |
|---|---|---|
| Two retreat pages | `/retreats`, `/retreats-and-special-events` | Merge. `/retreats` is the better landing page; fold the special-events content in. |
| Two mission pages | `/mission-camps` (youth groups), `/service-trips` (college groups) | Keep both but **name them for the audience** — "Youth Mission Trips" / "College Service Trips" — and cross-link them |
| Three registration entry points | `/register`, `/book-online`, `/apply` | `/book-online` is a Wix default artifact; retire it or redirect to `/register` |
| Orphan pages in sitemap | `/kitchen-planner`, `/shop-1` (both blank), `/volunteeroportunities` (misspelled) | Delete blank pages, fix misspelled URL with a redirect |
| Misspelled URLs | `/volunteeroportunities`, `/citapplication` | Add proper slugs + 301 redirects. These hurt SEO and look sloppy in a shared link. |

Also fix the internal inconsistency: `/about-us` says "we offer **two** vibrant camp experiences: Classic Summer Camp and Mission Camp" — but the site actually sells **six residential sessions in three tiers, plus day camp, plus CIT, plus college service trips.** The about page is describing a smaller, older camp than the one the rest of the site sells.

### 6.3 The "Book Online" service priced at $450 for 1 hour
**`OBSERVED`** — `/book-online` lists:
- "Camp Registration — **1 hr** — From **$450** — Book Now"
- "Mother's/Women's Retreat — **Ended** — From $75"

A "1 hour" camp registration at $450 is a Wix Booking service template that was never configured. If $450 is the real deposit, label it "Deposit — $450." If it's the weekly rate, label it per week. As written it reads as an error, and an error on the registration page is the worst possible place for one.

### 6.4 Every image has filename alt text or none
**`OBSERVED`** — Alt text across the site reads like the upload folder:

- `Copy of DJI_20251024105103_0029_D-HDR.jpg`
- `IMG_3292_edited_edited`
- `PXL_20210713_004700182.PORTRAIT.jpg`
- `Fall Shuford.jpg`
- Several images have **no alt attribute at all** (`![](https://static.wixstatic.com/...)` on `/about-us`, `/lodging`, `/meeting-spaces`, `/retreats`)

This is a direct accessibility failure for screen-reader users and a wasted SEO signal — the camp's best photography is invisible to image search. **Fix:** Rewrite alt text to describe the scene ("Campers on the climbing wall at Johns River Valley Camp"). Wix lets you do this per-image in about 15 minutes per page.

### 6.5 An inaccessible interaction on the day camp page
**`OBSERVED`** — `/day-camp` opens with:

> "To play, press and **hold** the enter key. To stop, release the enter key."

This is an audio/video widget with a press-and-hold interaction. It's unusable on touch devices, unusable with a switch or voice input, and it precedes all real content — so a screen-reader or keyboard user's first encounter with the day camp page is an instruction they cannot follow, with no visible content until they figure it out.

**Fix:** Replace with a normal autoplay-muted looping video, a static hero image, or a standard play button. Add a visible hero headline *above* any media so the page's purpose is announced first.

### 6.6 The directions are a PDF
**`OBSERVED`** — `/contact-us` offers "Travel Directions" as a link to `/\_files/ugd/cd0057_bcd0c02027a84e7ea101d05696f3b40b.pdf`.

A rural camp's directions are exactly the thing people open on a phone, in a car, losing signal. A PDF is the wrong container: it doesn't zoom on mobile, isn't screen-reader friendly, and can't be searched. **Fix:** Put the directions inline as text plus the Google Maps embed. Note the last stretch of NC-90 is rural — cell service gaps are worth a sentence ("download directions before you leave Lenoir").

Related: the contact page lists a **Kannapolis mailing address** and a **Collettsville physical address** with no labels explaining the difference. A visitor may drive to Kannapolis. Add "Mailing address (not the camp)" / "Camp location."

### 6.7 Typos and mechanical errors
**`OBSERVED`** — Small, but they accumulate into a "nobody's checking" impression on a site asking for money and children:

- `/apply`: **"expiration date"** → "experation date"; **"Grounds/Maintainance"** → "Maintenance"
- `/90thanniversary`: **"JRVC 90 Anniversay"**
- `/volunteeroportunities`: URL misspelling
- `/summer-camps`: "Middle High (Rising 6th-8th)" but sessions say "Grades 6-9"
- `/get-involved`: "Johns River Valley Camp seeks four to six persons..." — description is for summer staff, but the section header is "Staff" under a page about donating and volunteering; the three columns (Donate / Volunteer / Staff) aren't parallel

### 6.8 No social proof
**`OBSERVED`** — Beyond photos, there are **zero testimonials, parent quotes, reviews, or outcome stories** anywhere on the site. No "what families say," no alumni voice — despite the camp being **90 years old**, which is itself a powerful proof point that's currently expressed only as a dead party invitation.

**Fix:** Pull 3–5 quotes from your registration database or Facebook reviews, with first name + town. Add a "90 years" trust strip: "Est. 1936 · Serving families for 90 years." That is the single most persuasive sentence available to you and it's not on the site.

### 6.9 No email capture that's actually used
**`OBSERVED`** — `/contact-us` has "Join our mailing list / Subscribe Now," and the 90th anniversary form has a mailing-list opt-in. But there's no newsletter promo, no "get the 2026 guide," no incentive to subscribe, and no visible evidence it's used. For a business this seasonal, email is the highest-value channel in the off-season.

**Fix:** One clear offer — "Get 2026 dates & early-bird registration alerts" — placed on the homepage, day camp, residential, and retreat pages. Since June/July are the only months you don't take retreat bookings, winter is your retreat-selling season: use email for it.

---

## 7. Items to verify on the live site

`VERIFY` — I couldn't render JavaScript or run performance tooling, so these need a human with a browser and DevTools:

1. **Mobile experience.** Wix defaults are responsive, but the homepage hero is a wide banner image (`1905×395`) and the day camp page has a press-and-hold widget. Check at 375px width.
2. **Performance / Core Web Vitals.** Images are requested at up to `w_1905, q_85` (`/90thanniversary` hero is `1905×1013`). Check LCP and whether hero images are lazy-loaded too late.
3. **The homepage hero text over the image.** Verify contrast ratio over the drone photo — white text over sky and trees varies. Needs a scrim.
4. **Can a donation actually be completed end-to-end?** Follow the PayPal path from `/get-involved`. Confirm the funds named on `/give` are selectable.
5. **Do form submissions arrive anywhere?** Submit `/apply`, `/citapplication`, and the contact form and confirm delivery — plus confirm the success messages ("Thanks for applying!") only appear after submit, not before.
6. **Is there a navigation menu at all?** Content extraction showed only "Skip to Main Content" — confirm the global nav exposes all sections, particularly whether `/faqs`, `/give`, and `/volunteeroportunities` are reachable without a URL.
7. **Keyboard/screen-reader pass** on the day camp and 90th anniversary pages.
8. **Check `/retreats` → "LEARN MORE"** for the Meeting Spaces and Lodging tiles — confirm they resolve (the Meeting Spaces tile image is `al_l` aligned, suggesting a layout that may be squeezed).

---

## 8. Recommended sequence

**Week 1 — stop the bleeding (all doable by staff, no developer)**
1. Replace the 90th-anniversary hero with 2026 registration. Turn off the dead RSVP form.
2. Add tuition, deposit, and "what's included" to all six residential sessions.
3. Add a donate button + EIN to `/give`.
4. Unpublish `/shop-1` and `/kitchen-planner`; fix the broken blog post.
5. Replace the two stock photos on the volunteer page with real ones.
6. Fix the five typos and the "Rising 6th-8th / Grades 6-9" mismatch.

**Weeks 2–4 — close the information gaps**
7. Write the FAQ properly: 8–12 Q&As × 4 tabs, plus `FAQPage` schema.
8. Publish the safety/trust page (screening, ratios, health coverage, ACA status) and link it from the homepage and every camp page.
9. Publish a retreat rate table and replace the PDF intake with an on-page form.
10. Add a "Which program is right for my camper?" comparison table.
11. Add 3–5 testimonials + an "Est. 1936" trust strip.
12. Publish a privacy policy; link it in the footer.
13. Rewrite alt text on the top 6 pages.

**This winter — the structural fix**
14. Consolidate registration onto **one** system (Wix Bookings is already paid for) with session selection, capacity, deposit payment, and confirmation email.
15. Merge the duplicate retreat and mission pages; redirect the misspelled URLs.
16. Update `/about-us` to describe what you actually run today.
17. Stand up a real email list with a single offer, and use it for winter retreat bookings.
18. Resolve the director-page / contact-page contradiction.

---

## 9. The one-paragraph version

JRVC's site looks good and tells the emotional story well — the photos do real work, and the giving page copy is better than most nonprofits manage. But it stops short at the exact moment a visitor decides. There is **no price** for residential camp, **no donate button** on the giving page, **no rates** for retreats, **one answer** in the FAQ, and **no mention of safety, ratios, or accreditation** for a program that takes children overnight. Registration is split across five disconnected systems, three of which are Google Forms, with no payment collected and children's medical data going into a spreadsheet. And the front door is advertising a party that ended 39 days ago. None of these are design problems and almost none need a developer — they're content and consolidation, fixable in about three weeks of focused staff time. Do that, and the strong parts of this site finally get a chance to convert.
