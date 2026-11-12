import express from 'express';
import cors from 'cors';
import { ENV } from '../../infrastructure/config/env.config.js';
import { correlationIdMiddleware } from './middlewares/correlation-id.middleware.js';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware.js';
import { rateLimiterMiddleware } from './middlewares/rate-limiter.middleware.js';
import { errorHandlerMiddleware } from './middlewares/error-handler.middleware.js';
import { createApiRouter } from './routes/index.js';

export function createApp({
  formsController,
  healthController,
  adminController,
  logger,
}) {
  const app = express();

  // 1. Tracing de Correlation ID no início da cadeia
  app.use(correlationIdMiddleware);

  // 2. Logging estruturado de latência e chamadas
  app.use(requestLoggerMiddleware(logger));

  // 3. CORS corporativo com suporte a wildcard e origens configuráveis
  app.use(cors({
    origin: ENV.CORS_ORIGIN === '*' ? true : ENV.CORS_ORIGIN.split(',').map((s) => s.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-ID', 'X-Request-ID'],
    exposedHeaders: ['X-Correlation-ID', 'X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  }));

  // 4. Rate limiting anti-spam
  app.use(rateLimiterMiddleware());

  // 5. Parsers de payload com limites seguros
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // 6. Probes no root para orquestradores (Kubernetes / Docker)
  app.get('/health', healthController.getHealth);
  app.get('/health/live', healthController.getLive);
  app.get('/health/ready', healthController.getReady);

  // 7. Rota informativa e catálogo da API
  app.get('/', (req, res) => {
    res.json({
      name: 'JOGIMIL Omnichannel & Forms Microservice',
      service: ENV.SERVICE_NAME,
      version: ENV.SERVICE_VERSION,
      architecture: 'Clean Architecture / Hexagonal',
      status: 'active',
      endpoints: {
        health: 'GET /health',
        submitV1: 'POST /api/v1/forms/submit',
        adminDashboard: 'GET /api/v1/admin/dashboard',
        adminContacts: 'GET /api/v1/admin/contacts',
        adminReminders: 'GET /api/v1/admin/reminders',
        adminWhatsapp: 'GET /api/v1/admin/whatsapp/status',
        adminEmail: 'GET /api/v1/admin/email/status',
        news: 'GET /api/v1/news',
      },
    });
  });

  // 8. Montagem do Router da API
  const apiRouter = createApiRouter({ formsController, healthController, adminController });
  app.use('/api', apiRouter);

  // 9. 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      type: 'https://tools.ietf.org/html/rfc7807',
      title: 'Resource Not Found',
      status: 404,
      detail: `Endpoint ${req.method} ${req.url} não existe no microserviço.`,
      correlationId: req.correlationId,
    });
  });

  // 10. Centralized Error Handler (RFC 7807)
  app.use(errorHandlerMiddleware(logger));

  return app;
}
