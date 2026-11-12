import { ENV, isSmtpConfigured } from '../config/env.js';
import { formatLuandaTimestamp } from '../templates/email.template.js';

const startedAt = Date.now();

export function getHealth(req, res) {
  return res.json({
    status: 'ok',
    service: 'jogimil-forms-microservice',
    version: '1.0.0',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    smtpActive: isSmtpConfigured,
    destinationEmail: ENV.DESTINATION_EMAIL,
    timezone: 'Africa/Luanda (WAT / UTC+1)',
    timestamp: formatLuandaTimestamp(),
  });
}
