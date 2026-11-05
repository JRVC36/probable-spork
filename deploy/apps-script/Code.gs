/**
 * JRVC — camper registration → Google Sheet + automatic parent confirmation email
 * ---------------------------------------------------------------------------
 * Receives the POST from register.html, appends one row per camper, notifies
 * the camp director, and replies to the parent with the two health PDFs attached.
 *
 * SETUP (see deploy/GOOGLE-SHEET.md for the full walkthrough):
 *   1. Create the Google Sheet, then Extensions → Apps Script.
 *   2. Paste this file in, replacing the default contents.
 *   3. Change SECRET below to a long random string.
 *   4. Run setupSheet() once and authorise it (grants Sheet, Mail, and Drive access).
 *   5. Optional: run testAttachments() to verify both Drive PDFs can be read.
 *   6. Deploy → New deployment → Web app
 *        Execute as: Me
 *        Who has access: Anyone
 *   7. Copy the /exec URL into ENDPOINT_REGISTRATION in build.mjs.
 *
 * SECURITY NOTES
 *   - A Web App deployed as "Anyone" is a public URL. SECRET + the honeypot
 *     below are the only things between it and a spammer. Rotate SECRET by
 *     editing this file and re-deploying (the URL stays the same).
 *   - This handles minors' names, dates of birth, addresses and medical
 *     notes. Keep the Sheet private (share with named accounts only), and
 *     delete rows once the season's retention window has passed.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Must match data-secret on the <form> in src/pages/register.html. */
const SECRET = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';

/** Tab that receives the rows. Created by setupSheet() if missing. */
const SHEET_NAME = 'Registrations';

/** Optional: get an email for each registration. '' to disable. */
const NOTIFY_EMAIL = 'kevin@jrvc.org';

/** Send an automatic confirmation email + attachments to the parent/guardian. */
const SEND_PARENT_CONFIRMATION = true;

/** Google Drive PDFs attached to every parent confirmation email. */
const PARENT_ATTACHMENTS = [
  {
    id: '112O9axC9-jKRgLTImXHxrLoa5OJpYt53',
    filename: 'Camper-Health-History-Form.pdf',
  },
  {
    id: '1vD7_JdbExAdxKhABoppvSJ6GQBJvP9n2',
    filename: 'Camper-HealthCare-Recommendations.pdf',
  },
];

/** Human-readable session names for the parent confirmation email. */
const SESSION_LABELS = {
  'juniors-crafts':  'Juniors · Arts & Crafts (June 21–27, 2026 — $485)',
  'juniors-cooking': 'Juniors · Cooking (July 12–18, 2026 — $485)',
  'mh-paddle':       'Middle High · Paddle (July 12–18, 2026 — $545)',
  'mh-caving':       'Middle High · Caving (July 19–25, 2026 — $545)',
  'sh-adventure':    'Senior High · High Adventure (June 21–27, 2026 — $545)',
  'sh-paddle':       'Senior High · Paddle (June 28–July 4, 2026 — $545)',
  'day-camp':        'Day Camp ($249/week)',
};

/** Column order. Keys must match the `name` attributes in the HTML form. */
const COLUMNS = [
  { key: '_timestamp',     label: 'Received' },
  { key: 'session',        label: 'Session' },
  { key: 'dayweek',        label: 'Day camp week' },
  { key: 'camper_first',   label: 'Camper first' },
  { key: 'camper_last',    label: 'Camper last' },
  { key: 'grade',          label: 'Rising grade' },
  { key: 'dob',            label: 'DOB' },
  { key: 'parent_name',    label: 'Parent / guardian' },
  { key: 'email',          label: 'Email' },
  { key: 'phone',          label: 'Phone' },
  { key: 'address',        label: 'Address' },
  { key: 'medical',        label: 'Allergies / medical / dietary' },
  { key: 'newsletter',     label: 'Mailing list' },
  { key: 'agreement',      label: 'Agreed to policies' },
  { key: '_status',        label: 'Status' },
];

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

function doPost(e) {
  var wantsHtml = false;
  try {
    var data = parseRequest_(e);
    if (!data) return respond_(false, 'bad_request', {}, wantsHtml);

    // Non-JS fallback posts a normal form, which we answer with a web page.
    wantsHtml = String(data._ajax || '') !== '1';

    // Fail CLOSED. A public web app must not accept submissions just because
    // someone forgot to change the placeholder secret — that would leave an
    // open endpoint quietly collecting children's data.
    if (!SECRET || SECRET === 'CHANGE_ME_TO_A_LONG_RANDOM_STRING') {
      console.error('SECRET is still the default placeholder — refusing submission. Edit SECRET and re-deploy.');
      return respond_(false, 'not_configured', {}, wantsHtml);
    }
    if (data._secret !== SECRET) {
      return respond_(false, 'unauthorized', {}, wantsHtml);
    }

    // Honeypot: real users never see this field. Pretend success, drop it.
    if (String(data._gotcha || '').trim() !== '') {
      return respond_(true, 'ignored', {}, wantsHtml);
    }

    var required = ['camper_first', 'camper_last', 'parent_name', 'email', 'session'];
    var missing = required.filter(function (k) {
      return !String(data[k] || '').trim();
    });
    if (missing.length) {
      return respond_(false, 'missing_fields', { fields: missing }, wantsHtml);
    }

    var row = COLUMNS.map(function (c) {
      if (c.key === '_timestamp') return new Date();
      if (c.key === '_status') return 'New — deposit pending';
      return data[c.key] === undefined ? '' : String(data[c.key]);
    });

    var sheet = getSheet_();
    sheet.appendRow(row);

    // 1. Notify the camp director
    if (NOTIFY_EMAIL) {
      try {
        MailApp.sendEmail({
          to: NOTIFY_EMAIL,
          replyTo: String(data.email).trim(),
          subject: 'Camp registration — ' + row[3] + ' ' + row[4] + ' (' + row[1] + ')',
          body: COLUMNS.map(function (c, i) {
            return c.label + ': ' + (c.key === '_timestamp' ? new Date() : row[i]);
          }).join('\n'),
        });
      } catch (mailErr) {
        // Never fail the submission because a notification bounced.
        console.error('notify failed: ' + mailErr);
      }
    }

    // 2. Send automatic confirmation email + health PDFs to parent/guardian
    if (SEND_PARENT_CONFIRMATION && data.email) {
      try {
        sendParentConfirmation_(data);
      } catch (replyErr) {
        console.error('parent confirmation failed: ' + replyErr);
      }
    }

    return respond_(true, 'ok', {}, wantsHtml);
  } catch (err) {
    console.error(err);
    return respond_(false, 'server_error', {}, wantsHtml);
  }
}

/** Health check: visit the /exec URL in a browser and you should see {"ok":true}. */
function doGet() {
  return json_({ ok: true, service: 'jrvc-registration', sheet: SHEET_NAME });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sends a confirmation email to the parent/guardian with the PDF attachments
 * configured in PARENT_ATTACHMENTS.
 */
function sendParentConfirmation_(data) {
  var attachments = [];
  PARENT_ATTACHMENTS.forEach(function (item) {
    if (!item || !item.id) return;
    try {
      var blob = DriveApp.getFileById(item.id).getAs(MimeType.PDF);
      if (item.filename) blob.setName(item.filename);
      attachments.push(blob);
    } catch (fileErr) {
      console.error('Could not load attachment ' + item.id + ': ' + fileErr);
    }
  });

  var sessionDesc = SESSION_LABELS[data.session] || data.session;
  if (data.session === 'day-camp' && data.dayweek) {
    sessionDesc += ' — ' + data.dayweek;
  }

  var subject =
    'Registration received for ' +
    data.camper_first +
    ' ' +
    data.camper_last +
    ' — Johns River Valley Camp';

  var body =
    'Dear ' + data.parent_name + ',\n\n' +
    'Thank you for registering ' + data.camper_first + ' ' + data.camper_last +
    ' for Summer 2026 at Johns River Valley Camp!\n\n' +
    'REGISTRATION SUMMARY\n' +
    '• Camper: ' + data.camper_first + ' ' + data.camper_last +
    (data.grade ? ' (Rising grade ' + data.grade + ')' : '') + '\n' +
    '• Session: ' + sessionDesc + '\n\n' +
    'NEXT STEPS & ATTACHED FORMS\n' +
    '1. $100 Deposit: A $100 deposit holds your camper\'s spot (applied to tuition and refundable until 30 days before the session). We will follow up if you need payment arrangement details.\n' +
    '2. Health Forms (Attached): Please review the attached Camper Health-Care Recommendations and complete the Camper Health History Form prior to arrival.\n' +
    '3. Check-In: Residential check-in is Sunday from 3:00–4:30 p.m. (pick-up Saturday 9:00–10:00 a.m.). Day camp runs Monday–Friday, 8:30 a.m.–4:30 p.m.\n\n' +
    'If you have any questions or would like to inquire about the Campership Fund, simply reply to this email or call Kevin at 828-387-5736.\n\n' +
    'Grace and peace,\n' +
    'Johns River Valley Camp\n' +
    '6211 NC-90, Collettsville, NC 28611\n' +
    '828-387-5736 | kevin@jrvc.org\n' +
    'https://www.jrvc.org';

  MailApp.sendEmail({
    to: String(data.email).trim(),
    replyTo: NOTIFY_EMAIL || 'kevin@jrvc.org',
    name: 'Johns River Valley Camp',
    subject: subject,
    body: body,
    attachments: attachments,
  });
}

/**
 * Accepts both an XHR POST (JSON in postData, text/plain to avoid preflight)
 * and a native no-JS form POST (application/x-www-form-urlencoded).
 */
function parseRequest_(e) {
  if (!e) return null;
  if (e.parameter && Object.keys(e.parameter).length && !e.postData) {
    return e.parameter;
  }
  if (e.postData && e.postData.contents) {
    var body = e.postData.contents;
    try {
      return JSON.parse(body);
    } catch (_) {
      var out = {};
      body.split('&').forEach(function (pair) {
        if (!pair) return;
        var i = pair.indexOf('=');
        var k = decodeURIComponent((pair.slice(0, i)).replace(/\+/g, ' '));
        var v = decodeURIComponent((pair.slice(i + 1)).replace(/\+/g, ' '));
        out[k] = v;
      });
      return out;
    }
  }
  return e.parameter || null;
}

function respond_(ok, code, extra, wantsHtml) {
  if (wantsHtml) {
    var title = ok ? 'Registration received' : 'Something went wrong';
    var msg = ok
      ? 'Thanks — your camper is registered. A confirmation email with your health forms is on its way.'
      : 'Your registration did not save. Please call the camp at 828-387-5736 so we can take it by phone.';
    var html =
      '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + title + ' — JRVC</title>' +
      '<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
      'max-width:34rem;margin:14vh auto;padding:0 1.5rem;line-height:1.6;color:#17211c;' +
      'background:#faf7f1}h1{font-size:1.6rem;color:#16291f}a{color:#8f3d1d}' +
      'p.muted{color:#6b7d72;font-size:.9rem}</style></head><body>' +
      '<h1>' + title + '</h1><p>' + msg + '</p>' +
      '<p><a href="/">Back to the camp website</a></p>' +
      '<p class="muted">Reference: ' + code + '</p>' +
      '</body></html>';
    return HtmlService.createHtmlOutput(html).setTitle(title);
  }
  var out = { ok: ok, code: code };
  Object.keys(extra || {}).forEach(function (k) { out[k] = extra[k]; });
  return json_(out);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = createSheet_(ss);
  return sheet;
}

function createSheet_(ss) {
  var sheet = ss.insertSheet(SHEET_NAME);
  var headers = COLUMNS.map(function (c) { return c.label; });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#e8dfcd');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  sheet.getRange(2, 12, sheet.getMaxRows() - 1, 1).setNotes(''); // no-op, keeps linter quiet
  return sheet;
}

/**
 * Run this ONCE from the Apps Script editor to create the header row and
 * verify Drive access to the parent attachment PDFs.
 * Also safe to re-run: it will not duplicate the sheet.
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || createSheet_(ss);
  var headers = COLUMNS.map(function (c) { return c.label; });
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#e8dfcd');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);

  var loaded = [];
  PARENT_ATTACHMENTS.forEach(function (item) {
    if (!item || !item.id) return;
    var f = DriveApp.getFileById(item.id);
    loaded.push((item.filename || f.getName()) + ' (' + Math.round(f.getSize() / 1024) + ' KB)');
  });

  SpreadsheetApp.getUi().alert(
    'Sheet "' + SHEET_NAME + '" is ready with ' + headers.length + ' columns.\n\n' +
    'Verified parent email attachments:\n• ' + loaded.join('\n• ')
  );
}
