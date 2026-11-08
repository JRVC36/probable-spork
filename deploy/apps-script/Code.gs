/**
 * JRVC — Website Forms → 5 Separate Google Sheets + Email Notifications
 * ---------------------------------------------------------------------------
 * Routes each of the 5 website forms to its own dedicated Google Sheet in
 * Google Drive, emails kevin@jrvc.org on each submission, and automatically
 * replies to summer-camp parents with the two health PDFs attached.
 *
 * THE 5 SEPARATE GOOGLE SHEETS (already created in your Google Drive):
 *   1. Camper Registrations 2026 : 17aeWZVJoGTIb7XWhFJFZVkwO1dfiHqcAQpVFpl5nAvI
 *   2. Retreat Inquiries         : 184KUGM_9Ri-oUM_tE_FX_zG4jyfOl2nkwCWufJNZo6Y
 *   3. Mission Trip Inquiries    : 1hH2vkYJA6TLFvsC6bw9uQoWV0-zAjrGdG_iEXRXuP8A
 *   4. Contact Messages          : 11xcJ3W0349-BV7-7XC0JhCR3rPnvYJGaBznx4FsqKyA
 *   5. Newsletter Signups        : 158yCHNPupvhBcvsPMPycVNCzhOFnCw_LcDXJOPmAN4w
 *
 * You can either:
 *   • Deploy THIS file once (it writes each form into its own separate Google
 *     Sheet above via SpreadsheetApp.openById), OR
 *   • Deploy 5 separate Web Apps (one inside each of the 5 Google Sheets) and
 *     paste their 5 /exec URLs into ENDPOINT_REGISTRATION, ENDPOINT_RETREATS,
 *     ENDPOINT_MISSIONS, ENDPOINT_CONTACT, and ENDPOINT_NEWSLETTER in build.mjs.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Pre-generated shared secret matching FORM_SECRET in build.mjs. */
const SECRET = 'jrvc_2026_0842e65cca05b7011542ac74b693378881f166b1a41c6364';

/** Optional: get an email notification for each submission. '' to disable. */
const NOTIFY_EMAIL = 'kevin@jrvc.org';

/** Send an automatic confirmation email + PDF attachments to camper parents. */
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

/**
 * Each website form maps to its own separate Google Sheet in Google Drive.
 */
const FORMS = {
  registration: {
    spreadsheetId: '17aeWZVJoGTIb7XWhFJFZVkwO1dfiHqcAQpVFpl5nAvI',
    sheetName: 'Registrations',
    required: ['camper_first', 'camper_last', 'parent_name', 'email', 'session'],
    defaultStatus: 'New — deposit pending',
    subject: function (data) {
      return 'Camp registration — ' + (data.camper_first || '') + ' ' + (data.camper_last || '') + ' (' + (data.session || '') + ')';
    },
    columns: [
      { key: '_timestamp',   label: 'Received' },
      { key: 'session',      label: 'Session' },
      { key: 'dayweek',      label: 'Day camp week' },
      { key: 'camper_first', label: 'Camper first' },
      { key: 'camper_last',  label: 'Camper last' },
      { key: 'grade',        label: 'Rising grade' },
      { key: 'dob',          label: 'DOB' },
      { key: 'parent_name',  label: 'Parent / guardian' },
      { key: 'email',        label: 'Email' },
      { key: 'phone',        label: 'Phone' },
      { key: 'address',      label: 'Address' },
      { key: 'medical',      label: 'Allergies / medical / dietary' },
      { key: 'newsletter',   label: 'Mailing list' },
      { key: 'agreement',    label: 'Agreed to policies' },
      { key: '_status',      label: 'Status' },
    ],
  },

  retreat: {
    spreadsheetId: '184KUGM_9Ri-oUM_tE_FX_zG4jyfOl2nkwCWufJNZo6Y',
    sheetName: 'Retreat Inquiries',
    required: ['group', 'name', 'email'],
    defaultStatus: 'New — quote pending',
    subject: function (data) {
      return 'Retreat inquiry — ' + (data.group || data.name || 'Group');
    },
    columns: [
      { key: '_timestamp', label: 'Received' },
      { key: 'group',      label: 'Group / organization' },
      { key: 'name',       label: 'Contact name' },
      { key: 'size',       label: 'Group size' },
      { key: 'email',      label: 'Email' },
      { key: 'phone',      label: 'Phone' },
      { key: 'arrival',    label: 'Preferred arrival' },
      { key: 'departure',  label: 'Departure' },
      { key: 'type',       label: 'Gathering type' },
      { key: 'notes',      label: 'Notes' },
      { key: '_status',    label: 'Status' },
    ],
  },

  mission: {
    spreadsheetId: '1hH2vkYJA6TLFvsC6bw9uQoWV0-zAjrGdG_iEXRXuP8A',
    sheetName: 'Mission Trip Inquiries',
    required: ['org', 'name', 'email'],
    defaultStatus: 'New — quote pending',
    subject: function (data) {
      return 'Mission trip inquiry — ' + (data.org || data.name || 'Group');
    },
    columns: [
      { key: '_timestamp', label: 'Received' },
      { key: 'org',        label: 'Church / school / organization' },
      { key: 'name',       label: 'Contact name' },
      { key: 'email',      label: 'Email' },
      { key: 'size',       label: 'Group size' },
      { key: 'month',      label: 'Preferred month' },
      { key: 'theme',      label: 'Theme' },
      { key: 'notes',      label: 'Notes' },
      { key: '_status',    label: 'Status' },
    ],
  },

  contact: {
    spreadsheetId: '11xcJ3W0349-BV7-7XC0JhCR3rPnvYJGaBznx4FsqKyA',
    sheetName: 'Contact Messages',
    required: ['name', 'email', 'message'],
    defaultStatus: 'New',
    subject: function (data) {
      return 'Website message — ' + (data.topic || 'General') + ' (' + (data.name || '') + ')';
    },
    columns: [
      { key: '_timestamp', label: 'Received' },
      { key: 'name',       label: 'Name' },
      { key: 'email',      label: 'Email' },
      { key: 'phone',      label: 'Phone' },
      { key: 'topic',      label: 'Topic' },
      { key: 'message',    label: 'Message' },
      { key: '_status',    label: 'Status' },
    ],
  },

  newsletter: {
    spreadsheetId: '158yCHNPupvhBcvsPMPycVNCzhOFnCw_LcDXJOPmAN4w',
    sheetName: 'Newsletter Signups',
    required: ['email'],
    defaultStatus: 'Subscribed',
    subject: function (data) {
      return 'Newsletter signup — ' + (data.email || '');
    },
    columns: [
      { key: '_timestamp', label: 'Received' },
      { key: 'email',      label: 'Email' },
      { key: '_page',      label: 'Page' },
      { key: '_status',    label: 'Status' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

function doPost(e) {
  var wantsHtml = false;
  try {
    var data = parseRequest_(e);
    if (!data) return respond_(false, 'bad_request', {}, wantsHtml);

    wantsHtml = String(data._ajax || '') !== '1';

    if (!SECRET || SECRET === 'CHANGE_ME_TO_A_LONG_RANDOM_STRING') {
      console.error('SECRET is not configured.');
      return respond_(false, 'not_configured', {}, wantsHtml);
    }
    if (data._secret !== SECRET) {
      return respond_(false, 'unauthorized', {}, wantsHtml);
    }

    // Honeypot: real users never see this field. Pretend success, drop it.
    if (String(data._gotcha || '').trim() !== '') {
      return respond_(true, 'ignored', {}, wantsHtml);
    }

    var formKey = detectFormKey_(data);
    var cfg = FORMS[formKey];
    if (!cfg) {
      return respond_(false, 'unknown_form', { form: formKey }, wantsHtml);
    }

    var missing = cfg.required.filter(function (k) {
      return !String(data[k] || '').trim();
    });
    if (missing.length) {
      return respond_(false, 'missing_fields', { fields: missing }, wantsHtml);
    }

    var now = new Date();
    var row = cfg.columns.map(function (c) {
      if (c.key === '_timestamp') return now;
      if (c.key === '_status') return cfg.defaultStatus;
      return data[c.key] === undefined ? '' : String(data[c.key]);
    });

    var sheet = getTargetSheet_(cfg);
    sheet.appendRow(row);

    // If a parent checked "Send me camp news" on the registration form,
    // also add their email to the separate Newsletter Signups Google Sheet.
    if (formKey === 'registration' && isChecked_(data.newsletter) && data.email) {
      try {
        var nlSheet = getTargetSheet_(FORMS.newsletter);
        nlSheet.appendRow([now, String(data.email).trim(), 'register.html (opt-in)', 'Subscribed']);
      } catch (nlErr) {
        console.error('newsletter opt-in copy failed: ' + nlErr);
      }
    }

    // 1. Notify the camp director
    if (NOTIFY_EMAIL) {
      try {
        var mailOpts = {
          to: NOTIFY_EMAIL,
          subject: cfg.subject(data),
          body: cfg.columns.map(function (c, i) {
            return c.label + ': ' + (c.key === '_timestamp' ? now : row[i]);
          }).join('\n'),
        };
        if (data.email) {
          mailOpts.replyTo = String(data.email).trim();
        }
        MailApp.sendEmail(mailOpts);
      } catch (mailErr) {
        console.error('notify failed: ' + mailErr);
      }
    }

    // 2. Send automatic confirmation email + health PDFs to camper parent/guardian
    if (formKey === 'registration' && SEND_PARENT_CONFIRMATION && data.email) {
      try {
        sendParentConfirmation_(data);
      } catch (replyErr) {
        console.error('parent confirmation failed: ' + replyErr);
      }
    }

    return respond_(true, 'ok', { form: formKey }, wantsHtml);
  } catch (err) {
    console.error(err);
    return respond_(false, 'server_error', {}, wantsHtml);
  }
}

/** Health check: visit the /exec URL in a browser and you should see {"ok":true}. */
function doGet() {
  return json_({
    ok: true,
    service: 'jrvc-forms',
    sheets: Object.keys(FORMS).map(function (k) {
      return { form: k, spreadsheetId: FORMS[k].spreadsheetId, sheet: FORMS[k].sheetName };
    }),
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectFormKey_(data) {
  var explicit = String(data._form || '').trim().toLowerCase();
  if (explicit && FORMS[explicit]) return explicit;
  if (data.camper_first || data.session) return 'registration';
  if (data.group || data.arrival || data.departure) return 'retreat';
  if (data.org || data.theme || data.month) return 'mission';
  if (data.message || data.topic) return 'contact';
  if (data.email && !data.name) return 'newsletter';
  return 'registration';
}

function isChecked_(val) {
  var s = String(val || '').trim().toLowerCase();
  return s === 'on' || s === 'true' || s === 'yes' || s === '1';
}

function getTargetSheet_(cfg) {
  var ss = cfg.spreadsheetId
    ? SpreadsheetApp.openById(cfg.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(cfg.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(cfg.sheetName);
    var headers = cfg.columns.map(function (c) { return c.label; });
    sheet.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight('bold')
      .setBackground('#e8dfcd');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

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
    var title = ok ? 'Submission received' : 'Something went wrong';
    var msg = ok
      ? 'Thank you — we have received your submission and will be in touch soon.'
      : 'Your submission did not save. Please call the camp at 828-387-5736 so we can take it by phone.';
    var html =
      '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + title + ' — JRVC</title>' +
      '<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
      'max-width:34rem;margin:14vh auto;padding:0 1.5rem;line-height:1.6;color:#17211c;' +
      'background:#faf7f1}h1{font-size:1.6rem;color:#16291f}a{color:#8f3d1d}' +
      'p.muted{color:#6b7d72;font-size:.9rem}</style></head><body>' +
      '<h1>' + title + '</h1><p>' + msg + '</p>' +
      '<p><a href="https://www.jrvc.org/">Back to the camp website</a></p>' +
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

/**
 * Run this ONCE from the Apps Script editor to authorise Spreadsheet, Mail,
 * and Drive access and verify all 5 Google Sheets + both health PDFs.
 */
function setupSheet() {
  var summary = [];
  Object.keys(FORMS).forEach(function (key) {
    var cfg = FORMS[key];
    var sheet = getTargetSheet_(cfg);
    var headers = cfg.columns.map(function (c) { return c.label; });
    sheet.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight('bold')
      .setBackground('#e8dfcd');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
    summary.push(cfg.sheetName + ' (' + headers.length + ' cols)');
  });

  var loaded = [];
  PARENT_ATTACHMENTS.forEach(function (item) {
    if (!item || !item.id) return;
    var f = DriveApp.getFileById(item.id);
    loaded.push((item.filename || f.getName()) + ' (' + Math.round(f.getSize() / 1024) + ' KB)');
  });

  // Reference MailApp so Google prompts for email permission during setupSheet()
  var quota = MailApp.getRemainingDailyQuota();

  Logger.log('Verified 5 separate Google Sheets: ' + summary.join(', '));
  Logger.log('Verified attachments: ' + loaded.join(', '));
  Logger.log('Remaining daily email quota: ' + quota);

  try {
    SpreadsheetApp.getUi().alert(
      'All 5 separate Google Sheets are ready!\n\n' +
      '• ' + summary.join('\n• ') + '\n\n' +
      'Verified parent email PDF attachments:\n• ' + loaded.join('\n• ') + '\n\n' +
      'Remaining daily email quota: ' + quota
    );
  } catch (_) {
    // Running standalone in script.google.com without a bound spreadsheet UI
  }
}
