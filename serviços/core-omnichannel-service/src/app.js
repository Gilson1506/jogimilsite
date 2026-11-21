import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import formsRouter from './routes/forms.routes.js';
import healthRouter from './routes/health.routes.js';

const app = express();

// Middlewares globais
app.use(cors({
  origin: ENV.CORS_ORIGIN === '*' ? true : ENV.CORS_ORIGIN.split(',').map((s) => s.trim()),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Logging simples de requisições
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.url} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// Rotas
app.use('/', healthRouter);
app.use('/api', healthRouter);
app.use('/api', formsRouter);
app.use('/api/v1', formsRouter);

// Rota raiz informativa
app.get('/', (req, res) => {
  res.json({
    name: 'JOGIMIL Forms & Email Microservice',
    status: 'online',
    docs: {
      health: 'GET /health ou GET /api/health',
      submit: 'POST /api/forms/submit ou POST /api/v1/forms/submit',
      recent: 'GET /api/forms/recent',
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado.',
    requestedUrl: req.url,
  });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('[App Error]', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno no servidor.',
  });
});

export default app;
