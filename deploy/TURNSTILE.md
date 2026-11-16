# Existing Turnstile widget integration

Existing public site key: `0x4AAAAAAGDaf1mnfpcLVWMM`. No widget was created, replaced, or reconfigured. The widget secret was not retrieved, printed, or stored in Git.

## Deployment checklist
1. In the existing **forms** Apps Script project (not availability), confirm Script Properties:
   - `TURNSTILE_SECRET`: the existing widget's secret (never put this in source or chat).
   - `TURNSTILE_HOSTNAMES`: `www.jrvc.org,jrvc.org`.
2. Confirm both frontend hostnames are enabled on that widget in Cloudflare. Production verification rejects localhost, preview hosts, wildcard strings, and any host outside these two production names.
3. Replace the forms project's source with the updated `deploy/apps-script/Code.gs`. Deploy → Manage deployments → Edit the current web app → New version → Deploy. Retain its URL, execute-as-owner/access settings, and existing Script Properties. Authorize external requests if prompted. If separate form deployments are in use, update every one; leaving an old unprotected deployment accepting submissions is a bypass.
4. Publish the generated website in the same maintenance window. Publishing the backend first briefly rejects old frontend submissions; publishing only the frontend does not stop direct bot requests to the old backend.
5. Follow the current branch's registration Sheet/header instructions in `deploy/2027-CLEANUP.md` as part of this combined rollout.

## Protection contract
All five `doPost` routes are gated before Sheet access, newsletter opt-in copies, staff notifications, or acknowledgments:

| Form | Expected verified action |
| --- | --- |
| Registration | `registration` |
| Retreat inquiry | `retreat` |
| Mission inquiry | `mission` |
| Contact | `contact` |
| Newsletter | `newsletter` |

The browser automatically submits `cf-turnstile-response` in the existing FormData/JSON request. The backend POSTs it to `https://challenges.cloudflare.com/turnstile/v0/siteverify`, using the secret only from Script Properties. It requires boolean `success === true`, exact expected action, and an approved exact frontend hostname. Empty/oversized tokens, absent properties, API errors, malformed JSON, expired tokens and replay rejection all fail closed. Apps Script does not expose a trustworthy client IP; none is invented or sent. UrlFetchApp has no per-request timeout option: a fetch error fails closed under the Apps Script runtime limits.

Honeypot submissions retain the existing pretend-success/drop behavior and cause no persistence or email. The old public form secret is not considered bot protection. Turnstile is not a full rate-limiting system.

The widget is rendered explicitly per form. The challenge response is not copied into mailto fallbacks. The widget resets after each attempted request, including failed requests, because tokens are single-use. Expired challenges auto-refresh. No-JavaScript users are directed to call the camp; they cannot bypass backend verification. Zeffy checkout and the read-only availability feed are not changed.

## Validation status and required live checks
Local: `node build.mjs`, `node --check assets/js/site.js`, `node --check assets/js/turnstile.js`, `node --test tests/*.test.cjs`, and `git diff --check`.

Tests exercise the real `doPost` code with mocked Google/Cloudflare services and assert zero writes/emails on failed verification. These are not live token or account validation.

**Still required after deployment:**
- Open each form on a production hostname in a signed-out browser. Confirm the widget loads (including mobile/newsletter layouts) and a real token allows one submission to the expected Sheet.
- Confirm staff notifications/acknowledgments still work as appropriate. Use a clearly labeled staff test record and clean it up afterwards.
- Replay the *same captured request/token* once. It must return `ok:false` with `verification_failed`, with no second row/email. Do not publish or share captured tokens or request secrets.
- Submit without a token, and with a made-up token; both must fail without rows/emails.
- Test an expired challenge, a failed submission followed by a fresh challenge, and a second legitimate submission after a successful form reset.
- If the widget is blocked/offline, the form must explain that verification is needed and never report success. Use a fresh token if fixing other form validation after a failed attempt.

No real submission, live replay test, widget-account metadata check, or secret-value validation was performed by the coding agent. Apps Script deployment and those checks must be completed before calling protection live.
