import { Router } from 'express';
import { submitForm, listRecent } from '../controllers/forms.controller.js';

const router = Router();

// Submissão de formulários (suporta v1 e legada)
router.post('/submit', submitForm);
router.post('/forms/submit', submitForm);
router.get('/recent', listRecent);
router.get('/forms/recent', listRecent);

export default router;
