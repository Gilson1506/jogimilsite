import { ENV } from '../config/env.config.js';

function basicAuthHeader(user, pass) {
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
}

function escapeIcsText(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function unescapeIcsText(str) {
  return String(str || '')
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function toIcsDate(isoOrDate) {
  const d = new Date(isoOrDate || Date.now());
  if (Number.isNaN(d.getTime())) return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function parseIcsDate(raw) {
  if (!raw) return null;
  const cleaned = String(raw).trim();
  // YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
  const m = cleaned.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) {
    const d = new Date(cleaned);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const [, y, mo, da, h = '09', mi = '00', s = '00', z] = m;
  return `${y}-${mo}-${da}T${h}:${mi}:${s}${z || 'Z'}`;
}

export function buildEventIcs(event) {
  const uid = event.caldavUid || event.id || `jogimil-${Date.now()}@jogimiltecnologias.it.ao`;
  const now = toIcsDate(new Date());
  const start = toIcsDate(event.startAt || event.date);
  const end = toIcsDate(
    event.endAt || new Date(new Date(event.startAt || event.date || Date.now()).getTime() + 60 * 60 * 1000)
  );
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JOGIMIL Tecnologias//Admin Calendar//PT',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(event.title || 'Evento JOGIMIL')}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function generateIcsCalendar(events = []) {
  const now = toIcsDate(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JOGIMIL Tecnologias//Calendario Corporativo//PT',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:JOGIMIL Tecnologias',
    'X-WR-TIMEZONE:Africa/Luanda',
  ];

  for (const ev of events) {
    const uid = ev.caldavUid || ev.id || `ev-${Date.now()}@jogimiltecnologias.it.ao`;
    const start = toIcsDate(ev.startAt || ev.date);
    const end = toIcsDate(
      ev.endAt || new Date(new Date(ev.startAt || ev.date || Date.now()).getTime() + 60 * 60 * 1000)
    );
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeIcsText(ev.title || 'Evento JOGIMIL')}`
    );
    if (ev.description) lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escapeIcsText(ev.location)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function parseVEventsFromXmlOrIcs(rawText) {
  if (!rawText) return [];
  const events = [];
  const unfolded = String(rawText).replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const blocks = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gi) || [];

  for (const block of blocks) {
    const getProp = (name) => {
      const re = new RegExp(`^${name}(?:;[^:]*)?:(.*)$`, 'im');
      const m = block.match(re);
      return m ? m[1].trim() : '';
    };
    const uid = getProp('UID') || `caldav-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const summary = unescapeIcsText(getProp('SUMMARY')) || 'Evento CalDAV';
    const description = unescapeIcsText(getProp('DESCRIPTION'));
    const location = unescapeIcsText(getProp('LOCATION'));
    const startAt = parseIcsDate(getProp('DTSTART')) || new Date().toISOString();
    const endAt = parseIcsDate(getProp('DTEND')) || new Date(new Date(startAt).getTime() + 3600000).toISOString();

    events.push({
      caldavUid: uid,
      title: summary,
      description,
      location,
      startAt,
      endAt,
      type: 'reuniao',
      source: 'caldav',
    });
  }
  return events;
}

export class CalDavService {
  getConfig(overrides = {}) {
    const user = overrides.user || ENV.DAV.auth.user;
    const pass = overrides.pass || ENV.DAV.auth.pass;
    const server = (overrides.server || ENV.DAV.server).replace(/\/$/, '');
    const caldavUrl = overrides.caldavUrl || ENV.DAV.caldavUrl;
    const carddavUrl = overrides.carddavUrl || ENV.DAV.carddavUrl;
    return { user, pass, server, caldavUrl, carddavUrl };
  }

  async getStatus(overrides = {}) {
    const cfg = this.getConfig(overrides);
    const configured = Boolean(cfg.user && cfg.pass && cfg.caldavUrl);
    if (!configured) {
      return {
        configured: false,
        caldavOnline: false,
        carddavOnline: false,
        server: cfg.server,
        caldavUrl: cfg.caldavUrl,
        carddavUrl: cfg.carddavUrl,
        user: cfg.user,
        diagnostic: 'Credenciais CalDAV/CardDAV não configuradas no servidor.',
      };
    }

    const headers = {
      Authorization: basicAuthHeader(cfg.user, cfg.pass),
      Depth: '0',
      'Content-Type': 'application/xml; charset=utf-8',
      'User-Agent': 'JOGIMIL-Admin-CalDAV/1.0',
    };
    const propfindBody =
      '<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:displayname/><D:resourcetype/></D:prop></D:propfind>';

    const probe = async (url) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 7000);
        const res = await fetch(url, {
          method: 'PROPFIND',
          headers,
          body: propfindBody,
          signal: controller.signal,
        });
        clearTimeout(timer);
        return { ok: res.status >= 200 && res.status < 300, status: res.status };
      } catch (err) {
        return { ok: false, status: 0, error: err.message };
      }
    };

    const [calRes, cardRes] = await Promise.all([probe(cfg.caldavUrl), probe(cfg.carddavUrl)]);

    let diagnostic = 'CalDAV e CardDAV conectados ao servidor cPanel.';
    if (!calRes.ok) {
      if (calRes.status === 403) {
        diagnostic =
          'O servidor cPanel (porta 2080) respondeu 403 Forbidden. No alojamento Angoweb, ative o serviço "Calendar and Contacts Server (CCS)" no cPanel ou utilize o calendário nativo JOGIMIL + exportação .ics.';
      } else if (calRes.status === 401) {
        diagnostic = 'Autenticação CalDAV recusada (401). Verifique o utilizador e palavra-passe do e-mail.';
      } else {
        diagnostic = `Servidor CalDAV indisponível (HTTP ${calRes.status || 'timeout'}). O calendário nativo continua 100% operacional.`;
      }
    }

    return {
      configured: true,
      caldavOnline: calRes.ok,
      carddavOnline: cardRes.ok,
      caldavStatus: calRes.status,
      carddavStatus: cardRes.status,
      server: cfg.server,
      caldavUrl: cfg.caldavUrl,
      carddavUrl: cfg.carddavUrl,
      user: cfg.user,
      diagnostic,
    };
  }

  async fetchEvents(overrides = {}) {
    const cfg = this.getConfig(overrides);
    const reportBody = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag />
    <C:calendar-data />
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT" />
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

    const res = await fetch(cfg.caldavUrl, {
      method: 'REPORT',
      headers: {
        Authorization: basicAuthHeader(cfg.user, cfg.pass),
        Depth: '1',
        'Content-Type': 'application/xml; charset=utf-8',
        'User-Agent': 'JOGIMIL-Admin-CalDAV/1.0',
      },
      body: reportBody,
    });

    if (!res.ok) {
      const err = new Error(
        res.status === 403
          ? 'cPanel CalDAV (porta 2080) retornou 403 Forbidden — serviço CCS não ativo na conta de alojamento.'
          : `Falha ao sincronizar CalDAV (HTTP ${res.status})`
      );
      err.httpStatus = res.status;
      throw err;
    }

    const xml = await res.text();
    return parseVEventsFromXmlOrIcs(xml);
  }

  async pushEvent(event, overrides = {}) {
    const cfg = this.getConfig(overrides);
    const uid = event.caldavUid || event.id || `jogimil-${Date.now()}@jogimiltecnologias.it.ao`;
    const ics = buildEventIcs({ ...event, caldavUid: uid });
    const targetUrl = `${cfg.caldavUrl.replace(/\/$/, '')}/${encodeURIComponent(uid)}.ics`;

    try {
      const res = await fetch(targetUrl, {
        method: 'PUT',
        headers: {
          Authorization: basicAuthHeader(cfg.user, cfg.pass),
          'Content-Type': 'text/calendar; charset=utf-8',
          'User-Agent': 'JOGIMIL-Admin-CalDAV/1.0',
        },
        body: ics,
      });
      return { synced: res.ok, status: res.status, uid };
    } catch (err) {
      return { synced: false, status: 0, uid, error: err.message };
    }
  }
}

export const calDavService = new CalDavService();
