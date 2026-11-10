# Private calendar → public retreat availability

## Activation (requires the calendar owner's Google authorization)
1. Create a **separate** project at script.google.com. Copy `Code.gs` in this directory into it; do not replace the forms project.
2. Under **Services → +**, add **Google Calendar API** (advanced Calendar service).
3. Deploy → New deployment → Web app. Execute as **Me** (the Reservations calendar owner); access **Anyone**. Authorize calendar access. The source calendar stays private; do not change its sharing settings.
4. Open the deployment's `/exec` URL. Confirm JSON `ok: true`, an `updated` timestamp, and sanitized date ranges. No names, event IDs, descriptions or titles should be present. If it returns `ok: false`, check authorization/service setup in the Apps Script editor.
5. Paste that URL into `ENDPOINT_AVAILABILITY` in `build.mjs`, run `node build.mjs`, and deploy the website using the normal publishing workflow. Check the browser calendar and last-updated timestamp. Test from a signed-out browser, including that the JSON response can be fetched cross-origin. If blocked, retain the safe fallback and use a same-origin server proxy; do not expose private calendar feeds or credentials.
6. After code changes, edit the Apps Script deployment to use a new version.

## Daily workflow
Keep using Reservations. Add these labels to event titles (multiple space labels may be used):
- `[WHOLE CAMP]` / `[CLOSED]`: unavailable for retreats.
- `[MT ZION]`, `[DINING HALL]`, `[LODGE: BOGER]`, `[LODGE: SHUFORD]`: limited availability; only these public space names leave the backend. Confirm the actual lodge names before using those labels.
- `[INFO]`: no availability effect. Use only when the event does not block rentals.
- No recognized label or an unknown label: contact us to confirm, never assumed open.
- Google tentative status: on hold, except unknown labels remain unverified.

Free/Busy does not control this feed. All noncancelled matching events are read, including those marked Free. Deleted/cancelled events disappear on refresh. Never place private information inside labels. Titles and guest details remain server-side.

Label existing bookings and create/label summer camp and closure entries before relying on the public calendar. No existing events or sharing permissions have been changed by this implementation. An absent booking is not proof of availability.

## Refresh and date rules
Server cache: 5 minutes. Browser refresh: every 5 minutes and on returning to the tab. Normal propagation can approach 10 minutes. Last-updated time is shown in Eastern Time; responses older than 15 minutes or failed requests display unverified availability, not open dates. No recurring trigger is necessary: requests read/cache the calendar.

Rolling 366-day horizon; dates outside the returned coverage are unverified. Google all-day ends are exclusive. Timed events conservatively mark every touched Eastern calendar day (except an exact-midnight end). No turnover buffer or same-day rental guarantee is inferred. Unavailable days remain selectable for inquiry, but clearly labeled; requests never create calendar events or reservations.

Tests: `node --test tests/availability.test.cjs`.
