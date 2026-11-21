import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MetaGraphService } from './meta-graph.service.js';

const PORT = Number(process.env.META_SERVICE_PORT || 3102);
const CORE_WEBHOOK_URL = process.env.CORE_META_WEBHOOK_URL || 'http://localhost:3101/api/v1/webhooks/meta';

const app = express();
const metaService = new MetaGraphService();

app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'jogimil-meta-social-microservice',
    port: PORT,
    status: metaService.getPublicStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Status & Configuração
app.get('/api/v1/meta/status', (_req, res) => {
  res.json({ success: true, ...metaService.getPublicStatus() });
});

app.post('/api/v1/meta/config', (req, res) => {
  try {
    const status = metaService.saveConfig(req.body || {});
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// OAuth (Facebook Unificado, Instagram Direto, Threads)
app.get('/api/v1/meta/auth/url', (req, res) => {
  try {
    const data = metaService.buildAuthUrl(req.query.mode, req.query.redirectUri);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/v1/meta/auth/callback', async (req, res) => {
  try {
    const status = await metaService.handleAuthCallback({
      code: req.query.code,
      state: req.query.state,
    });
    res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0c0d10;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;">
      <div style="text-align:center;">
        <h2>Conta Meta Conectada com Sucesso!</h2>
        <p>Pode fechar esta janela.</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'JOGIMIL_META_AUTH_OK', status: ${JSON.stringify(status)} }, '*');
            window.close();
          }
        </script>
      </div>
    </body></html>`);
  } catch (err) {
    res.status(400).send(`<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0c0d10;color:#fca5a5;display:flex;align-items:center;justify-content:center;height:100vh;">
      <div style="text-align:center;">
        <h2>Erro na Autenticação Meta</h2>
        <p>${String(err.message || 'Erro desconhecido')}</p>
      </div>
    </body></html>`);
  }
});

app.post('/api/v1/meta/disconnect', (req, res) => {
  const status = metaService.disconnect(req.body?.target || 'all');
  res.json({ success: true, ...status });
});

// Publicação Multiplataforma (Facebook Pages, Instagram Feed/Reels/Stories/Carousel, Threads)
app.get('/api/v1/meta/posts', (_req, res) => {
  res.json({ success: true, posts: metaService.listPosts() });
});

app.post('/api/v1/meta/publish', async (req, res) => {
  try {
    const record = await metaService.publishMultiPlatform(req.body || {});
    res.status(201).json({ success: true, post: record });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/v1/meta/posts/:id', (req, res) => {
  metaService.deletePost(req.params.id);
  res.json({ success: true });
});

// Mensagens Diretas (Messenger & Instagram Direct com tag HUMAN_AGENT)
app.post('/api/v1/meta/messages/send', async (req, res) => {
  const result = await metaService.sendDirectMessage(req.body || {});
  res.status(result.success ? 200 : 400).json(result);
});

// Webhook Oficial Meta (Verificação + Receção em Tempo Real -> encaminha ao Core Gateway)
app.get('/api/v1/meta/webhook', (req, res) => {
  const check = metaService.verifyWebhook(req.query);
  if (check.verified) return res.status(200).send(check.challenge);
  return res.status(403).send('Forbidden');
});

app.post('/api/v1/meta/webhook', async (req, res) => {
  const events = metaService.parseWebhookEvents(req.body);
  if (events.length > 0 && CORE_WEBHOOK_URL) {
    fetch(CORE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    }).catch(() => {});
  }
  res.status(200).send('EVENT_RECEIVED');
});

app.listen(PORT, () => {
  console.log(`[Meta Social Microservice] Online na porta ${PORT}`);
});
