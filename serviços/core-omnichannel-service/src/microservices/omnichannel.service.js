import express from 'express';
import cors from 'cors';
import { ENV } from '../infrastructure/config/env.config.js';
import { StructuredLogger } from '../infrastructure/logging/structured-logger.js';
import { AdminRepository } from '../infrastructure/persistence/admin.repository.js';
import { getSupabaseClient } from '../infrastructure/persistence/supabase.client.js';
import { SupabaseAdminRepository } from '../infrastructure/persistence/supabase-admin.repository.js';
import { NodemailerAdapter } from '../infrastructure/mail/nodemailer.adapter.js';
import { EmailCenterService } from '../infrastructure/mail/email-center.service.js';
import { EvolutionService } from '../infrastructure/services/evolution.service.js';

const logger = new StructuredLogger('jogimil-omnichannel-service');
const supabase = getSupabaseClient();
const repo = supabase ? new SupabaseAdminRepository(supabase) : new AdminRepository();
const mailProvider = new NodemailerAdapter({ logger });
const emailCenter = new EmailCenterService({ mailProvider, logger });
const evolution = new EvolutionService({ logger });

try {
  const saved = await repo.getSettings();
  if (saved?.evolution || saved?.evolutionApi) evolution.configure(saved.evolution || saved.evolutionApi);
  if (saved?.email || saved?.emailServer) emailCenter.configure(saved.email || saved.emailServer);
} catch {
  // fallback to ENV
}

const app = express();
app.use(cors({ origin: ENV.CORS_ORIGIN === '*' ? true : ENV.CORS_ORIGIN.split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', async (_req, res) => {
  const [wa, mail] = await Promise.all([evolution.getConnectionStatus(), emailCenter.getStatus()]);
  res.json({
    status: 'ok',
    service: 'jogimil-omnichannel-microservice',
    whatsapp: wa,
    email: { smtpConfigured: mail.smtp.configured, smtpVerified: mail.smtp.verified, imapConnected: mail.imap.connected },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/admin/whatsapp/status', async (_req, res) => {
  res.json({ success: true, status: await evolution.getConnectionStatus() });
});

app.post('/api/v1/admin/whatsapp/send', async (req, res, next) => {
  try {
    const { phone, message } = req.body;
    const result = await evolution.sendText(phone, message);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
});

app.get('/api/v1/admin/email/status', async (_req, res) => {
  res.json({ success: true, status: await emailCenter.getStatus() });
});

app.post('/api/v1/admin/email/test-send', async (req, res, next) => {
  try {
    res.json(await emailCenter.sendTestEmail(req.body?.email));
  } catch (err) {
    next(err);
  }
});

app.post('/api/v1/webhooks/evolution', async (req, res) => {
  logger.info('[OmnichannelMicroservice] Webhook Evolution recebido', { event: req.body?.event });
  res.json({ success: true, received: true });
});

const port = Number(process.env.OMNICHANNEL_PORT || process.env.PORT || 3002);
app.listen(port, ENV.HOST, () => {
  logger.info(`[OmnichannelMicroservice] Ativo em http://${ENV.HOST}:${port}`);
});
