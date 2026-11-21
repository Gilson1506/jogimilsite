import { Router } from 'express';
import { createFormsRouter } from './v1/forms.router.js';
import { createHealthRouter } from './v1/health.router.js';
import { createAdminRouter } from './v1/admin.router.js';

export function createApiRouter({ formsController, healthController, adminController }) {
  const router = Router();

  const formsV1 = createFormsRouter(formsController);
  const healthV1 = createHealthRouter(healthController);
  const adminV1 = adminController ? createAdminRouter(adminController) : Router();

  // 1. Versioned routes (v1 standard)
  router.use('/v1/forms', formsV1);
  router.use('/v1/health', healthV1);
  router.use('/v1/admin', adminV1);

  // Rotas públicas de conteúdo (notícias/blog, equipa, portfólio), analytics e webhooks
  if (adminController) {
    router.get('/v1/news', adminController.listNews);
    router.get('/news', adminController.listNews);
    router.get('/v1/team', adminController.listTeam);
    router.get('/team', adminController.listTeam);
    router.get('/v1/portfolio', adminController.listPortfolio);
    router.get('/portfolio', adminController.listPortfolio);
    router.get('/v1/products', adminController.listProducts);
    router.get('/products', adminController.listProducts);
    router.post('/v1/analytics/visit', adminController.recordVisit);
    router.post('/analytics/visit', adminController.recordVisit);
    router.post('/v1/webhooks/evolution', adminController.handleEvolutionWebhook);
    router.post('/v1/webhook/whatsapp', adminController.handleEvolutionWebhook);
    // Webhooks & OAuth Callback oficiais da Meta (Facebook Messenger, Instagram Direct, Pages & Threads)
    router.get('/v1/webhooks/meta', adminController.verifyMetaWebhook);
    router.post('/v1/webhooks/meta', adminController.handleMetaWebhook);
    router.get('/v1/meta/auth/callback', adminController.handleMetaAuthCallback);
  }

  // 2. Legacy aliases for backwards compatibility with existing clients
  router.post('/forms/submit', formsController.submit);
  router.get('/forms/recent', formsController.listRecent);
  router.get('/health', healthController.getHealth);

  return router;
}
