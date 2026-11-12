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
    // Permitir requisições OPTIONS e health checks sem restrição
    if (req.method === 'OPTIONS' || req.path === '/health' || req.path.startsWith('/health/')) {
      return next();
    }

    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    let record = ipRequests.get(ip);
    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      ipRequests.set(ip, record);
    } else {
      record.count++;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));

    if (record.count > max) {
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
