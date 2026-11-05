# Registrations → Google Sheet

The camper registration form posts to a **Google Apps Script Web App**, which
appends one row per camper to a Google Sheet and optionally emails the director.

`deploy/apps-script/Code.gs` is the whole backend. There is no server to run and
no API key to rotate — but read the security section before you deploy.

```
register.html  ──POST──▶  Apps Script Web App  ──▶  Google Sheet
    (fetch, JSON)              (/exec)                 (one row per camper)
                               └──▶ email notification (optional)
```

---

## 1. Create the Sheet

1. Go to <https://sheets.new> and name it **JRVC Registrations 2026**.
2. Leave it empty — the script creates the header row.

**Set sharing now:** Share → *Restricted*. Add only the people who need it.
This sheet will hold minors' names, dates of birth, home addresses and medical
notes. It must never be "anyone with the link".

---

## 2. Add the script

1. In the Sheet: **Extensions → Apps Script**.
2. Delete the sample `myFunction` stub.
3. Paste the entire contents of `deploy/apps-script/Code.gs`.
4. Change this line to a **long random string** (32+ characters):

   ```js
   const SECRET = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';
   ```

   Generate one: `openssl rand -hex 32`

   > **This must be changed.** The script refuses every submission while the
   > placeholder is present (`not_configured`), by design — a public endpoint
   > must not accept data just because nobody set a password. You will see this
   > in the execution log until you fix it.

5. Set `NOTIFY_EMAIL` if you want an email per registration (or `''` to disable).
6. **Save** (⌘/Ctrl+S).
7. In the function dropdown pick **`setupSheet`**, then **Run**.
   Authorise it when prompted (Google will warn "unverified app" — choose
   *Advanced → Go to project*; it is your own script).
   You should get a popup confirming 15 columns, and row 1 of the Sheet fills in.

---

## 3. Deploy as a Web App

1. **Deploy → New deployment**.
2. Gear icon → **Web app**.
3. Set:
   - **Description:** `registration v1`
   - **Execute as:** `Me`
   - **Who has access:** **Anyone**

   > "Anyone" is required — visitors are not signed into Google. The secret
   > token plus the honeypot are the access control. See security below.
4. **Deploy**, then copy the **Web app URL**. It ends in `/exec`.

**Test it before touching the website.** Paste the `/exec` URL into a browser.
You should see:

```json
{"ok":true,"service":"jrvc-registration","sheet":"Registrations"}
```

If you see a login page instead, "Who has access" is not set to *Anyone*.
If you see an error, re-read section 2 — most likely `setupSheet` has not run.

---

## 4. Point the site at it

Edit `build.mjs` and paste the URL:

```js
const ENDPOINT_REGISTRATION = "https://script.google.com/macros/s/AKfy…/exec";
```

Edit `src/pages/register.html` and set the same secret you used in the script:

```html
data-secret="the-same-long-random-string"
```

Rebuild and redeploy:

```bash
node build.mjs
./deploy/publish.sh
```

The build prints a warning if `ENDPOINT_REGISTRATION` is still empty.

---

## 5. Verify end to end

On the live site, submit a **real test registration** with your own details:

- ✅ A row appears in the Sheet with a timestamp
- ✅ The page shows "Thanks — your camper is registered."
- ✅ Turning off JavaScript and submitting still works — the native form POST
      lands on an Apps Script confirmation page instead

Then test the **failure** path, because a form that fails silently is worse
than one that is visibly down: temporarily set a wrong `data-secret`, submit,
and confirm you get *"That didn't go through… please call the camp"* and **no
row is added**. Restore the secret afterwards.

---

## Security, honestly

What this setup does and does not protect:

| Concern | Status |
|---|---|
| Public `/exec` URL discovered by a spammer | Honeypot + secret token reduce it; not bulletproof. Watch the Sheet for junk. |
| Secret visible in page source | **Yes.** It stops naive drive-by posting and unknown bots, not a determined person reading the HTML. Treat it as a speed bump, not authentication. |
| Someone submits junk to your Sheet | Possible. Append `Status` = New so you can delete bad rows. Consider adding a `RECAPTCHA` later if it becomes a problem. |
| Data at rest | Google Drive. Privacy policy already covers "service providers… under agreements limiting their use". Keep sharing Restricted. |
| Retention | Delete rows after your retention window (the privacy policy says 7 years for registration records). Set a calendar reminder. |
| Rotating the secret | Edit `SECRET` in the script → **Deploy → Manage deployments → Edit → Version: New version → Deploy**. URL stays the same. Then update `data-secret` and redeploy the site. |

**If the secret is ever exposed**, rotate it. It costs 2 minutes.

---

## What this does *not* do

- **No payment.** The button says "Continue to deposit — $100", but no card is
  taken. Add Stripe/PayPal to the Sheet flow, or switch to a camp management
  system, before you advertise a deposit.
- **No confirmation email to the parent.** Only the director is notified
  (`NOTIFY_EMAIL`). Add `MailApp.sendEmail(data.email, …)` inside `doPost` if
  you want the family to get a receipt too.
- **No capacity limits.** Overbooking a session is possible. A `COUNTIF` guard
  per session is a reasonable next step.
- **No editing.** Rows are append-only; corrections happen in the Sheet.

---

## Other forms

The other five forms (retreat inquiry, mission inquiry, contact, donation,
newsletter) still carry `data-demo`. They now show **"Demo form. Nothing was
sent"** rather than a false confirmation, so they fail honestly.

To connect them the same way:

1. Add another `const ENDPOINT_X = ""` in `build.mjs` and a token in `src/pages/*.html`.
2. Duplicate `Code.gs` with a different `SHEET_NAME` and its own `SECRET`.
3. Set `action="__ENDPOINT_X__"`, `data-endpoint="__ENDPOINT_X__"`,
   `data-secret="…"`, and **remove `data-demo`**.

The submit handler in `assets/js/site.js` already handles all of it — it posts
any form that has `data-endpoint`, and refuses to claim success otherwise.
