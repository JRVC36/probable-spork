# JRVC website punch list

These tasks accompany the policy, payment-link, and clarity changes on this branch. Previously activated forms and Turnstile do not need to be recreated; preserve their configuration when redeploying.

## 1. Publish the current changes
- [ ] Review and merge this branch through a pull request, then publish the rebuilt website.
- [ ] Redeploy the existing forms Apps Script with this branch’s `deploy/apps-script/Code.gs`. Preserve its deployment URL and Turnstile Script Properties. No new API key is needed for the hosted payment links.
- [ ] Confirm the Registrations Sheet has P1 **Stay option**, Q1 **Adult occupancy**, R1 **Family members and ages**, and add S1 **Payment preference** if absent. Do not move existing columns.
- [ ] Confirm an acknowledgment email includes the selected session, stay, occupancy/family information, payment preference, and correct camp payment links.

## 2. Finish Zeffy setup and payment operations
- [ ] Deposit campaign: explicitly state one $100 deposit per family reservation for Family Camp and that enrollment requires staff confirmation plus payment matching.
- [ ] Balance campaign: replace “Complete this form to reserve your spot” with staff-confirmation language. Explain that the payer must enter the exact JRVC-approved amount, not a voluntary tuition amount.
- [ ] Require participant/primary family name and session; include a registration reference if staff assigns one. Verify these questions in checkout, not just the campaign editor.
- [ ] Verify legitimate balances under $100 can be paid. Check ticket quantity/purchase restrictions and tuition receipt/tax settings separately from charitable donations.
- [ ] Establish a private payment ledger: approved tuition, discounts/camperships, deposit, later payments, refunds, outstanding balance, Zeffy transaction references, and enrollment confirmation.
- [ ] Establish a balance-reminder routine before the two-week deadline. Zeffy will not automatically charge a stored card for the balance.
- [ ] Confirm how sibling and multi-week discounts apply to unusual combinations (including Family/Adult Camp if applicable). Until resolved, staff calculates and approves totals; the website does not auto-apply discounts.
- [ ] Test deposit and balance workflows. If making a real test purchase, have an authorized person handle payment and any refund; no payment was submitted during development.

## 3. Run the live acceptance checks
- [ ] In a signed-out production browser, test youth, Adult, and Family registration: session preselection, eligible grades, conditional fields, submission, correct Sheet columns, and emails.
- [ ] Verify invalid/missing Turnstile tokens and replayed requests produce no new rows/emails. Use a fresh challenge for each legitimate request.
- [ ] Test retreat, mission, contact, and newsletter forms and their destinations. Remove clearly labeled test records afterwards.
- [ ] On a phone, test navigation, camp calendar, expanded pricing, retreat calendar, all form fields, Turnstile, and Zeffy checkout/fallback links.
- [ ] Use keyboard-only navigation to check menus, links, disclosures, forms, focus visibility, errors, and calendar controls. Run an accessibility scanner (such as WAVE or axe); automated checks do not replace manual testing.
- [ ] Confirm the retreat feed loads while signed out, shows a recent Eastern Time timestamp, and falls back safely when unavailable.

## 4. Confirm content and operating details
- [ ] Verify the Charlotte route directions and approximately 1 hour 45 minute estimate against a current route from an agreed starting point. The site now uses one qualified estimate; it was not independently route-verified.
- [ ] Confirm exactly what $475 Valleywide and $560 Drama/Paddle tuition includes (lodging, meals, activities, off-site trips, equipment, and any exceptions) before publishing an all-inclusive statement.
- [ ] Confirm youth and college mission-trip durations and why prices differ. Then add a factual comparison and an approved sample schedule; do not infer that both prices cover every 5–7-day itinerary.
- [ ] Label all future Reservations events and enter camp-wide summer/training/preparation closures. Confirm exact lodge naming and turnover rules. No calendar events were changed in this pass.
- [ ] Confirm staff handling of courtesy holds (up to one week) and how the 25% retreat deposit secures dates.
- [ ] Confirm current volunteer projects before dating the list as reviewed/current.
- [ ] Implement an internal record-review and secure-disposal routine consistent with “up to seven years”; website wording does not delete records. Confirm appropriate medical-record access and newsletter unsubscribe handling.

## 5. Gather assets for the next improvements
- [ ] Supply actual lodging interiors, bathrooms, dining/meeting setups, accessibility details, and an accurate property map/building layout with permission to publish.
- [ ] Supply approved wedding capacities, lodging arrangements, vendor/catering policies, and photos before building a wedding page.
- [ ] Collect permission-backed camper/parent/retreat testimonials and authentic historical photos/milestones.
- [ ] For sample retreat budgets, approve exact lodging/occupancy, nights, meal days, and rented spaces for each example. Label examples as estimates, not guaranteed quotes.

## 6. Optional growth and ongoing maintenance
- [ ] Verify Google Search Console ownership and submit the sitemap; check indexing and www/non-www redirects. Do not change canonical hosts without checking production redirects.
- [ ] Decide whether to enable privacy-friendly analytics and what constitutes a registration request, confirmed enrollment, inquiry, and donation conversion.
- [ ] Assign a quarterly review owner and a separate pre-registration-season review: dates, pricing, policies, links, forms, calendar labels, and current photos/projects.

## Checks completed in development
- Static site rebuild and existing automated tests passed.
- Added clearer registration sequencing, retreat status meanings, donation-designation instructions, and meal pricing on Facilities.
- Standardized Charlotte travel-time copy with a traffic caveat; route verification remains above.
- Kept the summer calendar immediately below the hero, with registration guidance and FAQ links near the top.
- No live forms or payment transactions were submitted, no secrets were retrieved, and no remote calendar/Sheet settings were changed.
