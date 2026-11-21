import { ENV } from '../../../infrastructure/config/env.config.js';

export function rateLimiterMiddleware({ windowMs = ENV.RATE_LIMIT.windowMs, max = ENV.RATE_LIMIT.max } = {}) {
  const ipRequests = new Map();

  // Limpeza periódica a cada 5 minutos para evitar leak de memória
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipRequests.entries()) {
      if (now - data.startTime > windowMs) {
        ipRequests.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const reqPath = req.path || req.originalUrl || '';

    // Permitir OPTIONS, health checks e webhooks internos (Evolution API) sem rate limit
    // (evita tempestade de retries 429 quando o WhatsApp dispara múltiplos eventos)
    if (
      req.method === 'OPTIONS' ||
      reqPath === '/health' ||
      reqPath.startsWith('/health/') ||
      reqPath.startsWith('/api/v1/webhooks/')
    ) {
      return next();
    }

    const isAdminRoute = reqPath.startsWith('/api/v1/admin/');
    const effectiveMax = isAdminRoute ? Math.max(max * 10, 600) : max;
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const bucketKey = isAdminRoute ? `admin:${ip}` : `public:${ip}`;
    const now = Date.now();

    let record = ipRequests.get(bucketKey);
    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      ipRequests.set(bucketKey, record);
    } else {
      record.count++;
    }

    res.setHeader('X-RateLimit-Limit', effectiveMax);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, effectiveMax - record.count));

    if (record.count > effectiveMax) {
      return res.status(429).json({
        type: 'https://tools.ietf.org/html/rfc6585#section-4',
        title: 'Too Many Requests',
        status: 429,
        detail: 'Excedeu o limite de requisições. Por favor aguarde um momento antes de tentar novamente.',
        correlationId: req.correlationId,
      });
    }

    next();
  };
}
