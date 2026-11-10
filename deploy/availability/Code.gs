/** Deploy as a SEPARATE Apps Script web app. Enable the advanced Calendar service.
 * Execute as the calendar owner; access: Anyone. The source calendar stays private.
 * No event titles, IDs, descriptions, guest names or calendar IDs are returned.
 */
const RESERVATIONS_CALENDAR = 'c_d39ca9cf60bddc63f54c8df0d963f284184a8869f0c3331c2e713514cde4c09f@group.calendar.google.com';
const AVAILABILITY_ZONE = 'America/New_York';
function publicReservation_(event) {
  if (event.status === 'cancelled') return null;
  const title = event.summary || '';
  const labels = title.match(/\[[^\]]+\]/g) || [];
  const spaces = [];
  let closed = false, unknown = !labels.length;
  labels.forEach(function (raw) {
    const label = raw.slice(1, -1).trim().toUpperCase();
    if (label === 'WHOLE CAMP' || label === 'CLOSED') closed = true;
    else if (label === 'MT ZION') spaces.push('Mt. Zion');
    else if (label === 'DINING HALL') spaces.push('Dining Hall');
    // Explicit allowlist: never pass arbitrary lodge names or other title text through.
    else if (label === 'LODGE: SHUFORD') spaces.push('Shuford Lodge');
    else if (label === 'LODGE: BOGER') spaces.push('Boger Lodge');
    else if (label !== 'INFO') unknown = true;
  });
  if (!closed && !unknown && !spaces.length) return null;
  return {start: event.start.date || event.start.dateTime,
    end: event.end.date || event.end.dateTime,
    status: unknown ? 'confirm' : event.status === 'tentative' ? 'hold' : closed ? 'unavailable' : 'limited',
    spaces: Array.from(new Set(spaces))};
}
function doGet() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get('availability-v1');
    if (cached) return output_(JSON.parse(cached));
    const now = new Date();
    const start = new Date(now.getTime() - 86400000);
    const end = new Date(now.getTime() + 366 * 86400000);
    let page, ranges = [];
    do {
      const result = Calendar.Events.list(RESERVATIONS_CALENDAR, {
        timeMin: start.toISOString(), timeMax: end.toISOString(),
        singleEvents: true, showDeleted: false, maxResults: 2500,
        timeZone: AVAILABILITY_ZONE, pageToken: page,
        fields: 'items(summary,start,end,status),nextPageToken'
      });
      ranges = ranges.concat((result.items || []).map(publicReservation_).filter(Boolean));
      page = result.nextPageToken;
    } while (page);
    const data = {ok: true, updated: now.toISOString(), timeZone: AVAILABILITY_ZONE,
      from: Utilities.formatDate(now, AVAILABILITY_ZONE, 'yyyy-MM-dd'),
      through: Utilities.formatDate(end, AVAILABILITY_ZONE, 'yyyy-MM-dd'), ranges: ranges};
    cache.put('availability-v1', JSON.stringify(data), 300);
    return output_(data);
  } catch (err) {
    // Fail closed. Never return Google error text or private calendar information.
    return output_({ok: false});
  }
}
function output_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
