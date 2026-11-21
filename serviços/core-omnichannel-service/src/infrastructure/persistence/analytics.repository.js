import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ENV } from '../config/env.config.js';

const PAGE_LABELS = {
  inicio: 'Página Inicial',
  servicos: 'Serviços',
  portfolio: 'Portfólio',
  produtos: 'Produtos',
  sobre: 'Sobre Nós',
  parceiros: 'Parceiros',
  noticias: 'Notícias',
  contacto: 'Contacto',
  privacidade: 'Privacidade',
};

function parseDevice(ua = '') {
  const s = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(s)) return 'Tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(s)) return 'Mobile';
  return 'Desktop';
}

function parseSource(referrer = '', utmSource = '') {
  if (utmSource) return utmSource;
  const r = referrer.toLowerCase();
  if (!r) return 'Direto';
  if (r.includes('google.') || r.includes('bing.') || r.includes('duckduckgo.')) return 'Pesquisa Orgânica';
  if (r.includes('whatsapp') || r.includes('wa.me')) return 'WhatsApp';
  if (r.includes('facebook.') || r.includes('instagram.') || r.includes('linkedin.') || r.includes('t.co')) return 'Redes Sociais';
  return 'Referência Externa';
}

export class AnalyticsRepository {
  constructor(visitsFile = path.join(ENV.DATA_DIR, 'visits.jsonl')) {
    this.visitsFile = visitsFile;
    const dir = path.dirname(this.visitsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.visitsFile)) {
      fs.writeFileSync(this.visitsFile, '', 'utf-8');
    }
  }

  async recordVisit(payload = {}) {
    const timestamp = payload.timestamp || new Date().toISOString();
    const page = String(payload.page || 'inicio').slice(0, 64);
    const routeId = payload.id ? String(payload.id).slice(0, 120) : null;
    const fullPath = routeId ? `#/${page}/${routeId}` : `#/${page}`;
    const userAgent = String(payload.userAgent || '').slice(0, 300);
    const referrer = String(payload.referrer || '').slice(0, 300);
    const utmSource = String(payload.utmSource || '').slice(0, 80);

    const ipHash = payload.ip
      ? crypto.createHash('sha256').update(String(payload.ip)).digest('hex').slice(0, 12)
      : 'anon';

    const visit = {
      id: `vis_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp,
      page,
      routeId,
      path: payload.path || fullPath,
      title: PAGE_LABELS[page] || page,
      visitorId: String(payload.visitorId || ipHash).slice(0, 64),
      sessionId: String(payload.sessionId || `sess_${Date.now()}`).slice(0, 64),
      device: parseDevice(userAgent),
      source: parseSource(referrer, utmSource),
      referrer: referrer || 'direct',
      screen: String(payload.screen || '').slice(0, 32),
      language: String(payload.language || 'pt-AO').slice(0, 20),
      ipHash,
    };

    await fs.promises.appendFile(this.visitsFile, JSON.stringify(visit) + '\n', 'utf-8');
    return visit;
  }

  async getAllVisits() {
    try {
      const content = await fs.promises.readFile(this.visitsFile, 'utf-8');
      if (!content.trim()) return [];
      const lines = content.trim().split('\n');
      const visits = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          visits.push(JSON.parse(line));
        } catch {
          // ignore malformed line
        }
      }
      return visits;
    } catch {
      return [];
    }
  }

  async getVisitAnalytics(period = '30d') {
    const allVisits = await this.getAllVisits();
    const now = Date.now();

    const periodMsMap = {
      '24h': 24 * 3600 * 1000,
      '7d': 7 * 86400 * 1000,
      '30d': 30 * 86400 * 1000,
      '90d': 90 * 86400 * 1000,
      '1y': 365 * 86400 * 1000,
    };
    const windowMs = periodMsMap[period] || periodMsMap['30d'];
    const cutoff = now - windowMs;
    const prevCutoff = cutoff - windowMs;

    const currentVisits = allVisits.filter((v) => new Date(v.timestamp).getTime() >= cutoff);
    const previousVisits = allVisits.filter((v) => {
      const t = new Date(v.timestamp).getTime();
      return t >= prevCutoff && t < cutoff;
    });

    const uniqueVisitorsSet = new Set(currentVisits.map((v) => v.visitorId));
    const sessionsMap = new Map();
    for (const v of currentVisits) {
      sessionsMap.set(v.sessionId, (sessionsMap.get(v.sessionId) || 0) + 1);
    }

    const totalSessions = sessionsMap.size || 1;
    const singlePageSessions = Array.from(sessionsMap.values()).filter((c) => c === 1).length;
    const bounceRate = currentVisits.length > 0 ? Math.round((singlePageSessions / totalSessions) * 100) : 0;
    const avgPagesPerSession =
      currentVisits.length > 0 ? Number((currentVisits.length / totalSessions).toFixed(1)) : 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayVisits = allVisits.filter((v) => v.timestamp?.startsWith(todayStr)).length;
    const activeCutoff = now - 5 * 60 * 1000;
    const activeNow = new Set(
      allVisits.filter((v) => new Date(v.timestamp).getTime() >= activeCutoff).map((v) => v.visitorId)
    ).size;

    const growthPct =
      previousVisits.length > 0
        ? Number((((currentVisits.length - previousVisits.length) / previousVisits.length) * 100).toFixed(1))
        : currentVisits.length > 0
        ? 100
        : 0;

    // Timeline aggregation
    const timelineMap = new Map();
    if (period === '24h') {
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now - i * 3600 * 1000);
        const key = `${String(d.getHours()).padStart(2, '0')}h`;
        timelineMap.set(key, { date: key, visits: 0, visitors: new Set() });
      }
      for (const v of currentVisits) {
        const d = new Date(v.timestamp);
        const key = `${String(d.getHours()).padStart(2, '0')}h`;
        const bucket = timelineMap.get(key);
        if (bucket) {
          bucket.visits += 1;
          bucket.visitors.add(v.visitorId);
        }
      }
    } else {
      const days = period === '7d' ? 7 : period === '90d' ? 30 : period === '1y' ? 12 : 14;
      if (period === '1y') {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now);
          d.setMonth(d.getMonth() - i);
          const key = `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          timelineMap.set(ym, { date: key, visits: 0, visitors: new Set() });
        }
        for (const v of currentVisits) {
          const ym = v.timestamp.slice(0, 7);
          const bucket = timelineMap.get(ym);
          if (bucket) {
            bucket.visits += 1;
            bucket.visitors.add(v.visitorId);
          }
        }
      } else {
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now - i * 86400 * 1000);
          const iso = d.toISOString().slice(0, 10);
          const label = d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
          timelineMap.set(iso, { date: label, visits: 0, visitors: new Set() });
        }
        for (const v of currentVisits) {
          const iso = v.timestamp.slice(0, 10);
          const bucket = timelineMap.get(iso);
          if (bucket) {
            bucket.visits += 1;
            bucket.visitors.add(v.visitorId);
          }
        }
      }
    }

    const timeline = Array.from(timelineMap.values()).map((b) => ({
      date: b.date,
      visits: b.visits,
      uniqueVisitors: b.visitors.size,
    }));

    // Top pages
    const pageCounts = new Map();
    for (const v of currentVisits) {
      const key = v.page || 'inicio';
      pageCounts.set(key, (pageCounts.get(key) || 0) + 1);
    }
    const totalCurrent = currentVisits.length || 1;
    const topPages = Array.from(pageCounts.entries())
      .map(([page, views]) => ({
        page,
        label: PAGE_LABELS[page] || page,
        views,
        sharePct: Math.round((views / totalCurrent) * 100),
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    // Devices
    const deviceCounts = new Map();
    for (const v of currentVisits) {
      deviceCounts.set(v.device, (deviceCounts.get(v.device) || 0) + 1);
    }
    const deviceColors = { Desktop: '#0066FF', Mobile: '#10B981', Tablet: '#38BDF8' };
    const devices = Array.from(deviceCounts.entries()).map(([name, value]) => ({
      name,
      value,
      color: deviceColors[name] || '#818CF8',
    }));

    // Sources
    const sourceCounts = new Map();
    for (const v of currentVisits) {
      sourceCounts.set(v.source, (sourceCounts.get(v.source) || 0) + 1);
    }
    const sources = Array.from(sourceCounts.entries())
      .map(([source, visits]) => ({ source, visits }))
      .sort((a, b) => b.visits - a.visits);

    return {
      period,
      summary: {
        totalVisits: currentVisits.length,
        allTimeVisits: allVisits.length,
        uniqueVisitors: uniqueVisitorsSet.size,
        todayVisits,
        activeNow,
        avgPagesPerSession,
        bounceRate,
        growthPct,
      },
      timeline,
      topPages,
      devices,
      sources,
      recentVisits: [...currentVisits].reverse().slice(0, 20),
    };
  }
}
