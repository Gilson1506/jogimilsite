export function requestLoggerMiddleware(logger) {
  return (req, res, next) => {
    const start = Date.now();
    const correlationId = req.correlationId;

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const status = res.statusCode;

      const meta = {
        correlationId,
        method: req.method,
        path: req.originalUrl || req.url,
        status,
        durationMs,
        ip: req.ip || req.socket?.remoteAddress,
      };

      if (status >= 500) {
        logger.error(`[HTTP] ${req.method} ${meta.path} -> ${status} (${durationMs}ms)`, meta);
      } else if (status >= 400) {
        logger.warn(`[HTTP] ${req.method} ${meta.path} -> ${status} (${durationMs}ms)`, meta);
      } else {
        logger.info(`[HTTP] ${req.method} ${meta.path} -> ${status} (${durationMs}ms)`, meta);
      }
    });

    next();
  };
}
