import crypto from 'node:crypto';

export function correlationIdMiddleware(req, res, next) {
  const incomingId = req.headers['x-correlation-id'] || req.headers['x-request-id'];
  const correlationId = incomingId || `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', correlationId);

  next();
}
