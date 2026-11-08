# Website Forms → 5 Separate Google Sheets + Email Setup

All **5 separate Google Sheets** have already been created in your Google Drive with their formatted header rows (`#e8dfcd` sand header, bold labels, frozen top row):

1. **Camper Registrations (`register.html`)**
   - **Sheet:** [JRVC Website — Camper Registrations 2026](https://docs.google.com/spreadsheets/d/17aeWZVJoGTIb7XWhFJFZVkwO1dfiHqcAQpVFpl5nAvI/edit)
   - **ID:** `17aeWZVJoGTIb7XWhFJFZVkwO1dfiHqcAQpVFpl5nAvI`
   - **Behavior:** Appends row → emails `kevin@jrvc.org` → automatically sends parent confirmation email with both health PDFs attached (`Camper-Health-History-Form.pdf` & `Camper-HealthCare-Recommendations.pdf`) → if parent checked the newsletter box, also adds their email to the Newsletter Signups sheet.

2. **Retreat Inquiries (`retreats.html`)**
   - **Sheet:** [JRVC Website — Retreat Inquiries](https://docs.google.com/spreadsheets/d/184KUGM_9Ri-oUM_tE_FX_zG4jyfOl2nkwCWufJNZo6Y/edit)
   - **ID:** `184KUGM_9Ri-oUM_tE_FX_zG4jyfOl2nkwCWufJNZo6Y`
   - **Behavior:** Appends row → emails `kevin@jrvc.org` with `Reply-To` set to the group leader's email.

3. **Mission Trip Inquiries (`mission-trips.html`)**
   - **Sheet:** [JRVC Website — Mission Trip Inquiries](https://docs.google.com/spreadsheets/d/1hH2vkYJA6TLFvsC6bw9uQoWV0-zAjrGdG_iEXRXuP8A/edit)
   - **ID:** `1hH2vkYJA6TLFvsC6bw9uQoWV0-zAjrGdG_iEXRXuP8A`
   - **Behavior:** Appends row → emails `kevin@jrvc.org` with `Reply-To` set to the organizer's email.

4. **Contact Messages (`visit.html`)**
   - **Sheet:** [JRVC Website — Contact Messages](https://docs.google.com/spreadsheets/d/11xcJ3W0349-BV7-7XC0JhCR3rPnvYJGaBznx4FsqKyA/edit)
   - **ID:** `11xcJ3W0349-BV7-7XC0JhCR3rPnvYJGaBznx4FsqKyA`
   - **Behavior:** Appends row → emails `kevin@jrvc.org` with `Reply-To` set to the sender's email.

5. **Newsletter Signups (`get-involved.html`)**
   - **Sheet:** [JRVC Website — Newsletter Signups](https://docs.google.com/spreadsheets/d/158yCHNPupvhBcvsPMPycVNCzhOFnCw_LcDXJOPmAN4w/edit)
   - **ID:** `158yCHNPupvhBcvsPMPycVNCzhOFnCw_LcDXJOPmAN4w`
   - **Behavior:** Appends row → emails `kevin@jrvc.org`.

---

## Quick 3-Minute Setup

Because `deploy/apps-script/Code.gs` already has all **5 separate Spreadsheet IDs** and the shared `SECRET` (`jrvc_2026_0842e65cca05b7011542ac74b693378881f166b1a41c6364`) built in, you only need to deploy it once (or you can deploy it inside each of the 5 sheets separately if you prefer 5 separate `/exec` URLs).

### 1. Paste `deploy/apps-script/Code.gs` into Apps Script

1. Open [JRVC Website — Camper Registrations 2026](https://docs.google.com/spreadsheets/d/17aeWZVJoGTIb7XWhFJFZVkwO1dfiHqcAQpVFpl5nAvI/edit)
2. Click **Extensions → Apps Script**
3. Delete the placeholder `function myFunction() {}` and paste the entire contents of [`deploy/apps-script/Code.gs`](apps-script/Code.gs)
4. Click the **Save** icon (`Ctrl+S` / `Cmd+S`)

### 2. Authorize `setupSheet`

1. In the toolbar dropdown at the top of Apps Script, select **`setupSheet`** and click **Run**
2. Click **Review permissions** → choose your Google account → **Advanced** → **Go to Untitled project (unsafe)** → **Allow**
   - This grants permission to write to your 5 Google Sheets, read the 2 health PDFs from Google Drive, and send confirmation emails.

### 3. Deploy as a Web App

1. Click **Deploy → New deployment** (top right)
2. Click the gear icon next to *Select type* → choose **Web app**
3. Set:
   - **Description:** `JRVC Website Forms`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
4. Click **Deploy** and copy the **Web app URL** (ends in `/exec`)

### 4. Give us the `/exec` URL (or paste it into `build.mjs`)

Either paste the `/exec` URL right here in chat and we will wire it in, build, commit, and merge for you, or set it in `build.mjs`:

```js
const ENDPOINT_DEFAULT = "https://script.google.com/macros/s/AKfycb.../exec";
```

*(If you ever want 5 separate Web App deployments in addition to the 5 separate Google Sheets, you can paste `deploy/apps-script/Code.gs` into each of the 5 sheets and set `ENDPOINT_REGISTRATION`, `ENDPOINT_RETREATS`, `ENDPOINT_MISSIONS`, `ENDPOINT_CONTACT`, and `ENDPOINT_NEWSLETTER` individually in `build.mjs`.)*
