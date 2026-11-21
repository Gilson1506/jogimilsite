import express from 'express';
import cors from 'cors';
import { ENV } from '../infrastructure/config/env.config.js';
import { StructuredLogger } from '../infrastructure/logging/structured-logger.js';
import { AnalyticsRepository } from '../infrastructure/persistence/analytics.repository.js';
import { getSupabaseClient } from '../infrastructure/persistence/supabase.client.js';
import { SupabaseAnalyticsRepository } from '../infrastructure/persistence/supabase-analytics.repository.js';

const logger = new StructuredLogger('jogimil-analytics-service');
const supabase = getSupabaseClient();
const analyticsRepo = supabase ? new SupabaseAnalyticsRepository(supabase) : new AnalyticsRepository();

const app = express();
app.use(cors({ origin: ENV.CORS_ORIGIN === '*' ? true : ENV.CORS_ORIGIN.split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '512kb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'jogimil-analytics-microservice',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/analytics/visit', async (req, res, next) => {
  try {
    const visit = await analyticsRepo.recordVisit({
      ...req.body,
      userAgent: req.headers['user-agent'] || req.body?.userAgent || '',
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '',
    });
    res.status(201).json({ success: true, id: visit.id });
  } catch (err) {
    next(err);
  }
});

app.get('/api/v1/admin/analytics/visits', async (req, res, next) => {
  try {
    const period = String(req.query?.period || '30d');
    const data = await analyticsRepo.getVisitAnalytics(period);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

const port = Number(process.env.ANALYTICS_PORT || process.env.PORT || 3003);
app.listen(port, ENV.HOST, () => {
  logger.info(`[AnalyticsMicroservice] Ativo em http://${ENV.HOST}:${port}`);
});
