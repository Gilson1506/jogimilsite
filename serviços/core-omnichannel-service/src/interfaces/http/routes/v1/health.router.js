import { Router } from 'express';

export function createHealthRouter(healthController) {
  const router = Router();

  router.get('/', healthController.getHealth);
  router.get('/live', healthController.getLive);
  router.get('/ready', healthController.getReady);

  return router;
}
