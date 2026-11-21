import { Router } from 'express';

export function createFormsRouter(formsController) {
  const router = Router();

  router.post('/submit', formsController.submit);
  router.get('/recent', formsController.listRecent);

  return router;
}
