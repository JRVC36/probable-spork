# 2027 content and registration rollout

The website now uses the approved 2027 camp lineup and tuition in its FAQ and FAQ JSON-LD. The retired day-camp panel is replaced with a 2027 overview while preserving its legacy anchor. Expired open-retreat advertising is removed; no replacement dates or meal prices were invented.

## Registration backend deployment required
Deploy the updated `deploy/apps-script/Code.gs` to the existing forms web app as a new version. Session labels in acknowledgment emails are now 2027 labels. Three columns were appended to the registration schema **after Status**, without reordering existing columns:
- P1: Stay option
- Q1: Adult occupancy
- R1: Family members and ages

For an existing Registrations sheet, add these three header cells before rollout (the handler only initializes headers on empty sheets). Existing rows remain unchanged. New web fields are `stay`, `occupancy`, and `family_members`. Stay and occupancy choices, family details, session IDs, and youth grade eligibility are also checked by the updated backend. This is not a substitute for bot protection. Family member names/ages are personal information; restrict sheet access to staff who need it.

Test one youth, Adult, and Family registration after deployment: session preselection, eligible grades, conditional required fields, correct sheet columns, staff notification, and acknowledgment. No real submissions or payments were made as part of this patch.

## Follow-ups requiring configuration/decisions
- Turnstile public site key and backend secret in Script Properties; server-side verification and abuse limits still need implementation. This patch does NOT stop bot submissions.
- Confirm any updated deposit/discount/cancellation policies, Wednesday check-in/out times, meal quotes, and new retreat dates before adding specifics.
- Zeffy API documentation and supported camp/event checkout mechanism before implementing calculated payments.
- No new wedding capacities, testimonials, or staff policy claims were invented.

## Consistency follow-up
Retired 2026 recruiting/about/giving and mission-month copy is removed. Registration acknowledgments now use 2027 and include stay/occupancy/family details. Existing seven-year retention and unsubscribe policy claims still require operational confirmation; they were not invented or silently changed. Family group handling and deposit-per-person versus deposit-per-family policy still need staff confirmation.

Regression checks: `node --test tests/*.test.cjs`. Deploy website and backend together so conditional field requirements and confirmation emails stay in sync.
