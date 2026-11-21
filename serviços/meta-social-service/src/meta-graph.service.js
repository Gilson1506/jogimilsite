import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATA_DIR = path.resolve(__dirname, '../data');

const GRAPH_VERSION = 'v21.0';
const FB_GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
const IG_GRAPH = 'https://graph.instagram.com';
const THREADS_GRAPH = 'https://graph.threads.net/v1.0';

export const META_AUTH_MODES = {
  facebook_unified: {
    id: 'facebook_unified',
    label: 'Facebook Login Unificado (Recomendado)',
    host: 'graph.facebook.com',
    description: 'Um único login conecta Página do Facebook, Instagram Business/Creator, Messenger e Instagram Direct.',
    scopes: [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'pages_messaging',
      'pages_manage_metadata',
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_messages',
      'instagram_manage_comments',
    ],
  },
  instagram_direct: {
    id: 'instagram_direct',
    label: 'Instagram Login Direto',
    host: 'graph.instagram.com',
    description: 'Ideal para contas Instagram Business/Creator sem Página do Facebook vinculada.',
    scopes: [
      'instagram_business_basic',
      'instagram_business_content_publish',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments',
    ],
  },
  threads: {
    id: 'threads',
    label: 'Threads API (OAuth)',
    host: 'graph.threads.net',
    description: 'Publicação e respostas orgânicas no Threads (até 250 posts e 1.000 respostas / 24h).',
    scopes: ['threads_basic', 'threads_content_publish', 'threads_manage_replies'],
  },
  manual_token: {
    id: 'manual_token',
    label: 'Token Manual / System User (Meta Business)',
    host: 'graph.facebook.com',
    description: 'Configure diretamente Page Access Token, Page ID e IG User ID gerados no Meta Business Suite.',
    scopes: [],
  },
};

export const POST_TYPES = ['post', 'reel', 'story', 'carousel'];

export class MetaGraphService {
  constructor({ dataDir = DEFAULT_DATA_DIR } = {}) {
    this.dataDir = dataDir;
    this.configFile = path.join(this.dataDir, 'meta-config.json');
    this.postsFile = path.join(this.dataDir, 'meta-posts.json');
    this.oauthStates = new Map();
    this._ensureStorage();
  }

  _ensureStorage() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.configFile)) {
      const initial = {
        authMode: 'facebook_unified',
        appId: process.env.META_APP_ID || '',
        appSecret: process.env.META_APP_SECRET || '',
        verifyToken: process.env.META_VERIFY_TOKEN || `jogimil_meta_${crypto.randomBytes(6).toString('hex')}`,
        redirectUri: process.env.META_REDIRECT_URI || 'http://localhost:3101/api/v1/meta/auth/callback',
        facebook: {
          connected: false,
          pageId: process.env.META_FB_PAGE_ID || '',
          pageName: '',
          pageAccessToken: process.env.META_FB_PAGE_TOKEN || '',
          connectedAt: null,
        },
        instagram: {
          connected: false,
          igUserId: process.env.META_IG_USER_ID || '',
          username: '',
          accessToken: process.env.META_IG_ACCESS_TOKEN || '',
          loginHost: 'graph.facebook.com',
          connectedAt: null,
        },
        threads: {
          connected: false,
          userId: process.env.META_THREADS_USER_ID || '',
          username: '',
          accessToken: process.env.META_THREADS_TOKEN || '',
          connectedAt: null,
        },
      };
      fs.writeFileSync(this.configFile, JSON.stringify(initial, null, 2), 'utf-8');
    }
    if (!fs.existsSync(this.postsFile)) {
      fs.writeFileSync(this.postsFile, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  readConfig() {
    this._ensureStorage();
    try {
      return JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
    } catch {
      return {};
    }
  }

  saveConfig(patch = {}) {
    const current = this.readConfig();
    const next = {
      ...current,
      authMode: patch.authMode || current.authMode || 'facebook_unified',
      appId: patch.appId !== undefined ? String(patch.appId).trim() : current.appId,
      appSecret:
        patch.appSecret !== undefined && patch.appSecret !== '••••••••'
          ? String(patch.appSecret).trim()
          : current.appSecret,
      verifyToken:
        patch.verifyToken !== undefined && String(patch.verifyToken).trim()
          ? String(patch.verifyToken).trim()
          : current.verifyToken,
      redirectUri:
        patch.redirectUri !== undefined && String(patch.redirectUri).trim()
          ? String(patch.redirectUri).trim()
          : current.redirectUri,
      facebook: {
        ...(current.facebook || {}),
        ...(patch.facebook || {}),
      },
      instagram: {
        ...(current.instagram || {}),
        ...(patch.instagram || {}),
      },
      threads: {
        ...(current.threads || {}),
        ...(patch.threads || {}),
      },
    };

    // Suporte a campos planos (conveniente para formulário de Definições)
    if (patch.pageId !== undefined) next.facebook.pageId = String(patch.pageId).trim();
    if (patch.pageName !== undefined) next.facebook.pageName = String(patch.pageName).trim();
    if (patch.pageAccessToken !== undefined && patch.pageAccessToken !== '••••••••') {
      next.facebook.pageAccessToken = String(patch.pageAccessToken).trim();
    }
    if (patch.igUserId !== undefined) next.instagram.igUserId = String(patch.igUserId).trim();
    if (patch.igUsername !== undefined) next.instagram.username = String(patch.igUsername).trim();
    if (patch.igAccessToken !== undefined && patch.igAccessToken !== '••••••••') {
      next.instagram.accessToken = String(patch.igAccessToken).trim();
    }
    if (patch.threadsUserId !== undefined) next.threads.userId = String(patch.threadsUserId).trim();
    if (patch.threadsUsername !== undefined) next.threads.username = String(patch.threadsUsername).trim();
    if (patch.threadsAccessToken !== undefined && patch.threadsAccessToken !== '••••••••') {
      next.threads.accessToken = String(patch.threadsAccessToken).trim();
    }

    next.facebook.connected = Boolean(next.facebook.pageId && next.facebook.pageAccessToken);
    if (next.facebook.connected && !next.facebook.connectedAt) {
      next.facebook.connectedAt = new Date().toISOString();
    }
    next.instagram.connected = Boolean(
      next.instagram.igUserId && (next.instagram.accessToken || next.facebook.pageAccessToken)
    );
    if (next.instagram.connected && !next.instagram.connectedAt) {
      next.instagram.connectedAt = new Date().toISOString();
    }
    next.threads.connected = Boolean(next.threads.userId && next.threads.accessToken);
    if (next.threads.connected && !next.threads.connectedAt) {
      next.threads.connectedAt = new Date().toISOString();
    }

    fs.writeFileSync(this.configFile, JSON.stringify(next, null, 2), 'utf-8');
    return this.getPublicStatus();
  }

  getPublicStatus() {
    const cfg = this.readConfig();
    return {
      service: 'meta-social-service',
      graphVersion: GRAPH_VERSION,
      authMode: cfg.authMode || 'facebook_unified',
      authModes: META_AUTH_MODES,
      appConfigured: Boolean(cfg.appId && cfg.appSecret),
      appId: cfg.appId || '',
      hasAppSecret: Boolean(cfg.appSecret),
      verifyToken: cfg.verifyToken || '',
      redirectUri: cfg.redirectUri || 'http://localhost:3101/api/v1/meta/auth/callback',
      facebook: {
        connected: Boolean(cfg.facebook?.connected && cfg.facebook?.pageId && cfg.facebook?.pageAccessToken),
        pageId: cfg.facebook?.pageId || '',
        pageName: cfg.facebook?.pageName || '',
        hasToken: Boolean(cfg.facebook?.pageAccessToken),
        connectedAt: cfg.facebook?.connectedAt || null,
      },
      instagram: {
        connected: Boolean(
          cfg.instagram?.connected &&
            cfg.instagram?.igUserId &&
            (cfg.instagram?.accessToken || cfg.facebook?.pageAccessToken)
        ),
        igUserId: cfg.instagram?.igUserId || '',
        username: cfg.instagram?.username || '',
        hasToken: Boolean(cfg.instagram?.accessToken || cfg.facebook?.pageAccessToken),
        loginHost: cfg.instagram?.loginHost || 'graph.facebook.com',
        connectedAt: cfg.instagram?.connectedAt || null,
      },
      threads: {
        connected: Boolean(cfg.threads?.connected && cfg.threads?.userId && cfg.threads?.accessToken),
        userId: cfg.threads?.userId || '',
        username: cfg.threads?.username || '',
        hasToken: Boolean(cfg.threads?.accessToken),
        connectedAt: cfg.threads?.connectedAt || null,
      },
      policies: {
        organicPublishing: '100% Gratuito (FB Pages, IG 100 posts/24h, Threads 250 posts/24h)',
        messagingWindow: '24h livre · Extensão 7 dias com tag HUMAN_AGENT (Messenger & IG Direct gratuitos)',
      },
    };
  }

  /**
   * Gera URL oficial de autorização OAuth da Meta conforme o fluxo selecionado
   */
  buildAuthUrl(modeOverride, redirectUriOverride) {
    const cfg = this.readConfig();
    const mode = modeOverride || cfg.authMode || 'facebook_unified';
    if (!cfg.appId) {
      throw new Error('Configure o Meta App ID nas Definições antes de iniciar o login OAuth.');
    }
    const redirectUri = redirectUriOverride || cfg.redirectUri || 'http://localhost:3101/api/v1/meta/auth/callback';
    const state = crypto.randomBytes(16).toString('hex');
    this.oauthStates.set(state, { mode, redirectUri, createdAt: Date.now() });

    // Limpar estados expirados (> 15 min)
    for (const [k, v] of this.oauthStates.entries()) {
      if (Date.now() - v.createdAt > 15 * 60 * 1000) this.oauthStates.delete(k);
    }

    if (mode === 'instagram_direct') {
      const scopes = META_AUTH_MODES.instagram_direct.scopes.join(',');
      const url = new URL('https://www.instagram.com/oauth/authorize');
      url.searchParams.set('enable_fb_login', '0');
      url.searchParams.set('force_authentication', '1');
      url.searchParams.set('client_id', cfg.appId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', scopes);
      url.searchParams.set('state', state);
      return { url: url.toString(), mode, state };
    }

    if (mode === 'threads') {
      const scopes = META_AUTH_MODES.threads.scopes.join(',');
      const url = new URL('https://threads.net/oauth/authorize');
      url.searchParams.set('client_id', cfg.appId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('scope', scopes);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('state', state);
      return { url: url.toString(), mode, state };
    }

    // Padrão: Facebook Login Unificado (conecta Página FB + Instagram Business + Messenger + IG Direct)
    const scopes = META_AUTH_MODES.facebook_unified.scopes.join(',');
    const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
    url.searchParams.set('client_id', cfg.appId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('scope', scopes);
    url.searchParams.set('response_type', 'code');
    return { url: url.toString(), mode: 'facebook_unified', state };
  }

  /**
   * Processa o callback OAuth da Meta e guarda os tokens e IDs das contas conectadas
   */
  async handleAuthCallback({ code, state }) {
    const cfg = this.readConfig();
    if (!code) throw new Error('Código de autorização OAuth em falta.');
    if (!cfg.appId || !cfg.appSecret) {
      throw new Error('App ID e App Secret da Meta são obrigatórios para trocar o código OAuth.');
    }

    const saved = this.oauthStates.get(state) || {
      mode: cfg.authMode || 'facebook_unified',
      redirectUri: cfg.redirectUri || 'http://localhost:3101/api/v1/meta/auth/callback',
    };
    if (state) this.oauthStates.delete(state);

    if (saved.mode === 'instagram_direct') {
      const form = new URLSearchParams({
        client_id: cfg.appId,
        client_secret: cfg.appSecret,
        grant_type: 'authorization_code',
        redirect_uri: saved.redirectUri,
        code,
      });
      const res = await fetch('https://api.instagram.com/oauth/access_token', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || data.error_message) {
        throw new Error(data.error_message || 'Falha ao trocar código Instagram Login.');
      }
      const shortToken = data.access_token;
      const longRes = await fetch(
        `${IG_GRAPH}/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
          cfg.appSecret
        )}&access_token=${encodeURIComponent(shortToken)}`
      );
      const longData = await longRes.json().catch(() => ({}));
      const finalToken = longData.access_token || shortToken;

      const meRes = await fetch(
        `${IG_GRAPH}/me?fields=user_id,username&access_token=${encodeURIComponent(finalToken)}`
      );
      const me = await meRes.json().catch(() => ({}));

      return this.saveConfig({
        authMode: 'instagram_direct',
        instagram: {
          connected: true,
          igUserId: String(me.user_id || data.user_id || ''),
          username: me.username || '',
          accessToken: finalToken,
          loginHost: 'graph.instagram.com',
          connectedAt: new Date().toISOString(),
        },
      });
    }

    if (saved.mode === 'threads') {
      const form = new URLSearchParams({
        client_id: cfg.appId,
        client_secret: cfg.appSecret,
        grant_type: 'authorization_code',
        redirect_uri: saved.redirectUri,
        code,
      });
      const res = await fetch(`${THREADS_GRAPH}/oauth/access_token`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Falha ao trocar código Threads OAuth.');
      }
      return this.saveConfig({
        threads: {
          connected: true,
          userId: String(data.user_id || ''),
          username: '',
          accessToken: data.access_token,
          connectedAt: new Date().toISOString(),
        },
      });
    }

    // Facebook Login Unificado
    const tokenUrl = new URL(`${FB_GRAPH}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', cfg.appId);
    tokenUrl.searchParams.set('client_secret', cfg.appSecret);
    tokenUrl.searchParams.set('redirect_uri', saved.redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || tokenJson.error) {
      throw new Error(tokenJson.error?.message || 'Falha ao obter token OAuth do Facebook.');
    }

    // Trocar por Long-Lived User Token
    const longUrl = new URL(`${FB_GRAPH}/oauth/access_token`);
    longUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longUrl.searchParams.set('client_id', cfg.appId);
    longUrl.searchParams.set('client_secret', cfg.appSecret);
    longUrl.searchParams.set('fb_exchange_token', tokenJson.access_token);
    const longRes = await fetch(longUrl.toString());
    const longJson = await longRes.json().catch(() => ({}));
    const userToken = longJson.access_token || tokenJson.access_token;

    // Descobrir Páginas + Conta Instagram Business vinculada
    const pagesRes = await fetch(
      `${FB_GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(
        userToken
      )}`
    );
    const pagesJson = await pagesRes.json();
    const firstPage = Array.isArray(pagesJson.data) ? pagesJson.data[0] : null;
    if (!firstPage) {
      throw new Error('Nenhuma Página do Facebook administrada foi encontrada nesta conta.');
    }

    const igBiz = firstPage.instagram_business_account || null;
    return this.saveConfig({
      authMode: 'facebook_unified',
      facebook: {
        connected: true,
        pageId: firstPage.id,
        pageName: firstPage.name || '',
        pageAccessToken: firstPage.access_token,
        connectedAt: new Date().toISOString(),
      },
      instagram: igBiz
        ? {
            connected: true,
            igUserId: igBiz.id,
            username: igBiz.username || '',
            accessToken: firstPage.access_token,
            loginHost: 'graph.facebook.com',
            connectedAt: new Date().toISOString(),
          }
        : cfg.instagram,
    });
  }

  disconnect(target = 'all') {
    const cfg = this.readConfig();
    if (target === 'facebook' || target === 'all') {
      cfg.facebook = { connected: false, pageId: '', pageName: '', pageAccessToken: '', connectedAt: null };
    }
    if (target === 'instagram' || target === 'all') {
      cfg.instagram = {
        connected: false,
        igUserId: '',
        username: '',
        accessToken: '',
        loginHost: 'graph.facebook.com',
        connectedAt: null,
      };
    }
    if (target === 'threads' || target === 'all') {
      cfg.threads = { connected: false, userId: '', username: '', accessToken: '', connectedAt: null };
    }
    fs.writeFileSync(this.configFile, JSON.stringify(cfg, null, 2), 'utf-8');
    return this.getPublicStatus();
  }

  // --- HISTÓRICO DE PUBLICAÇÕES MULTIPLATAFORMA ---
  listPosts() {
    this._ensureStorage();
    try {
      return JSON.parse(fs.readFileSync(this.postsFile, 'utf-8'));
    } catch {
      return [];
    }
  }

  deletePost(id) {
    const next = this.listPosts().filter((p) => p.id !== id);
    fs.writeFileSync(this.postsFile, JSON.stringify(next, null, 2), 'utf-8');
    return true;
  }

  schedulePost(payload = {}) {
    const safeType = POST_TYPES.includes(payload.postType) ? payload.postType : 'post';
    const record = {
      id: `mpost_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: String(payload.title || '').trim(),
      caption: String(payload.caption || '').trim(),
      excerpt: String(payload.excerpt || '').trim(),
      content: String(payload.content || '').trim(),
      category: String(payload.category || 'Tecnologia'),
      author: String(payload.author || 'Equipa JOGIMIL'),
      image: String(payload.image || '').trim(),
      postType: safeType,
      platforms: Array.isArray(payload.platforms) ? payload.platforms : [],
      mediaUrl: String(payload.mediaUrl || '').trim(),
      link: String(payload.link || '').trim(),
      scheduledAt: payload.scheduledAt || null,
      calendarEventId: payload.calendarEventId || null,
      status: 'scheduled',
      results: {},
      createdAt: new Date().toISOString(),
    };
    const existing = this.listPosts();
    existing.unshift(record);
    fs.writeFileSync(this.postsFile, JSON.stringify(existing.slice(0, 200), null, 2), 'utf-8');
    return record;
  }

  updatePost(id, patch = {}) {
    const list = this.listPosts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    fs.writeFileSync(this.postsFile, JSON.stringify(list, null, 2), 'utf-8');
    return list[idx];
  }

  /**
   * Publica simultaneamente ou individualmente no Facebook, Instagram e/ou Threads
   * respeitando os tipos oficiais: post | reel | story | carousel
   */
  async publishMultiPlatform({
    title = '',
    caption = '',
    postType = 'post',
    platforms = [],
    mediaUrl = '',
    mediaUrls = [],
    link = '',
    scheduledAt = '',
  }) {
    const cfg = this.readConfig();
    const safeType = POST_TYPES.includes(postType) ? postType : 'post';
    const messageText = [title, caption].filter(Boolean).join('\n\n').trim();
    const results = {};

    const isScheduled = Boolean(scheduledAt && new Date(scheduledAt).getTime() > Date.now() + 60000);
    const scheduledUnix = isScheduled ? Math.floor(new Date(scheduledAt).getTime() / 1000) : null;

    // 1. FACEBOOK PAGES API
    if (platforms.includes('facebook')) {
      if (!cfg.facebook?.pageId || !cfg.facebook?.pageAccessToken) {
        results.facebook = {
          success: false,
          status: 'not_connected',
          error: 'Página do Facebook não conectada em Definições → Redes Sociais (Meta).',
        };
      } else {
        try {
          const token = cfg.facebook.pageAccessToken;
          const pageId = cfg.facebook.pageId;
          let endpoint = `${FB_GRAPH}/${pageId}/feed`;
          const payload = { access_token: token };

          if (safeType === 'reel') {
            if (!mediaUrl) throw new Error('Reels no Facebook exigem um URL público de vídeo.');
            endpoint = `${FB_GRAPH}/${pageId}/videos`;
            payload.file_url = mediaUrl;
            payload.description = messageText;
          } else if (safeType === 'story') {
            if (!mediaUrl) throw new Error('Stories no Facebook exigem um URL público de imagem ou vídeo.');
            endpoint = `${FB_GRAPH}/${pageId}/photo_stories`;
            payload.url = mediaUrl;
          } else if (mediaUrl) {
            endpoint = `${FB_GRAPH}/${pageId}/photos`;
            payload.url = mediaUrl;
            payload.caption = messageText;
          } else {
            payload.message = messageText;
            if (link) payload.link = link;
          }

          if (scheduledUnix && safeType === 'post') {
            payload.published = false;
            payload.scheduled_publish_time = scheduledUnix;
          }

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error?.message || 'Erro ao publicar na Página do Facebook.');
          }
          results.facebook = {
            success: true,
            status: scheduledUnix ? 'scheduled' : 'published',
            remoteId: data.id || data.post_id || null,
          };
        } catch (err) {
          results.facebook = { success: false, status: 'failed', error: err.message };
        }
      }
    }

    // 2. INSTAGRAM CONTENT PUBLISHING API (Fluxo oficial em 2 etapas: Container -> Publish)
    if (platforms.includes('instagram')) {
      const igToken = cfg.instagram?.accessToken || cfg.facebook?.pageAccessToken;
      const igId = cfg.instagram?.igUserId;
      const host = cfg.instagram?.loginHost === 'graph.instagram.com' ? IG_GRAPH : FB_GRAPH;

      if (!igId || !igToken) {
        results.instagram = {
          success: false,
          status: 'not_connected',
          error: 'Conta Instagram Profissional não conectada em Definições → Redes Sociais (Meta).',
        };
      } else if (!mediaUrl && (!Array.isArray(mediaUrls) || mediaUrls.length === 0)) {
        results.instagram = {
          success: false,
          status: 'validation_error',
          error: 'A API do Instagram exige um URL público de imagem ou vídeo (HTTPS).',
        };
      } else {
        try {
          let creationId = null;

          if (safeType === 'carousel' && Array.isArray(mediaUrls) && mediaUrls.length >= 2) {
            const childIds = [];
            for (const url of mediaUrls.slice(0, 10)) {
              const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(url);
              const cRes = await fetch(`${host}/${igId}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...(isVideo ? { media_type: 'VIDEO', video_url: url } : { image_url: url }),
                  is_carousel_item: true,
                  access_token: igToken,
                }),
              });
              const cData = await cRes.json();
              if (!cRes.ok || cData.error) throw new Error(cData.error?.message || 'Erro ao criar item do carrossel.');
              childIds.push(cData.id);
            }
            const carRes = await fetch(`${host}/${igId}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                media_type: 'CAROUSEL',
                children: childIds.join(','),
                caption: messageText,
                access_token: igToken,
              }),
            });
            const carData = await carRes.json();
            if (!carRes.ok || carData.error) throw new Error(carData.error?.message || 'Erro ao criar carrossel IG.');
            creationId = carData.id;
          } else {
            const containerPayload = { caption: messageText, access_token: igToken };
            if (safeType === 'reel') {
              containerPayload.media_type = 'REELS';
              containerPayload.video_url = mediaUrl;
            } else if (safeType === 'story') {
              containerPayload.media_type = 'STORIES';
              if (/\.(mp4|mov|webm)(\?|$)/i.test(mediaUrl)) containerPayload.video_url = mediaUrl;
              else containerPayload.image_url = mediaUrl;
            } else {
              containerPayload.image_url = mediaUrl;
            }

            const step1 = await fetch(`${host}/${igId}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(containerPayload),
            });
            const step1Data = await step1.json();
            if (!step1.ok || step1Data.error) {
              throw new Error(step1Data.error?.message || 'Erro na etapa 1 (container de mídia Instagram).');
            }
            creationId = step1Data.id;
          }

          // Etapa 2: Disparar publicação
          const step2 = await fetch(`${host}/${igId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: creationId, access_token: igToken }),
          });
          const step2Data = await step2.json();
          if (!step2.ok || step2Data.error) {
            throw new Error(step2Data.error?.message || 'Erro na etapa 2 (media_publish Instagram).');
          }

          results.instagram = {
            success: true,
            status: 'published',
            remoteId: step2Data.id || creationId,
          };
        } catch (err) {
          results.instagram = { success: false, status: 'failed', error: err.message };
        }
      }
    }

    // 3. THREADS API (Fluxo oficial em 2 etapas)
    if (platforms.includes('threads')) {
      const thToken = cfg.threads?.accessToken;
      const thId = cfg.threads?.userId;
      if (!thId || !thToken) {
        results.threads = {
          success: false,
          status: 'not_connected',
          error: 'Conta Threads não conectada em Definições → Redes Sociais (Meta).',
        };
      } else {
        try {
          const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(mediaUrl);
          const container = {
            media_type: mediaUrl ? (isVideo ? 'VIDEO' : 'IMAGE') : 'TEXT',
            text: messageText.slice(0, 500),
            access_token: thToken,
          };
          if (mediaUrl) {
            if (isVideo) container.video_url = mediaUrl;
            else container.image_url = mediaUrl;
          }
          const s1 = await fetch(`${THREADS_GRAPH}/${thId}/threads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(container),
          });
          const s1Data = await s1.json();
          if (!s1.ok || s1Data.error) throw new Error(s1Data.error?.message || 'Erro ao criar container Threads.');

          const s2 = await fetch(`${THREADS_GRAPH}/${thId}/threads_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: s1Data.id, access_token: thToken }),
          });
          const s2Data = await s2.json();
          if (!s2.ok || s2Data.error) throw new Error(s2Data.error?.message || 'Erro ao publicar no Threads.');

          results.threads = { success: true, status: 'published', remoteId: s2Data.id || s1Data.id };
        } catch (err) {
          results.threads = { success: false, status: 'failed', error: err.message };
        }
      }
    }

    const record = {
      id: `mpost_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      caption,
      postType: safeType,
      platforms,
      mediaUrl,
      link,
      scheduledAt: scheduledAt || null,
      results,
      createdAt: new Date().toISOString(),
    };

    const existing = this.listPosts();
    existing.unshift(record);
    fs.writeFileSync(this.postsFile, JSON.stringify(existing.slice(0, 200), null, 2), 'utf-8');

    return record;
  }

  // --- MENSAGENS DIRETAS (MESSENGER PLATFORM API + INSTAGRAM MESSAGING API) ---
  async sendDirectMessage({ platform, recipientId, text = '', mediaUrl = '', mediaType = 'image', useHumanAgentTag = true }) {
    const cfg = this.readConfig();
    if (!recipientId) {
      return { success: false, error: 'ID do destinatário (PSID/IGSID) não fornecido.' };
    }

    const isInstagram = platform === 'instagram';
    const token = isInstagram
      ? cfg.instagram?.accessToken || cfg.facebook?.pageAccessToken
      : cfg.facebook?.pageAccessToken;
    const senderNode = isInstagram ? cfg.instagram?.igUserId || 'me' : cfg.facebook?.pageId || 'me';
    const host =
      isInstagram && cfg.instagram?.loginHost === 'graph.instagram.com' ? IG_GRAPH : FB_GRAPH;

    if (!token) {
      return {
        success: false,
        offline: true,
        error: `${isInstagram ? 'Instagram Messaging' : 'Facebook Messenger'} não conectado em Definições → Redes Sociais (Meta).`,
      };
    }

    const messagePayload = mediaUrl
      ? {
          attachment: {
            type: mediaType === 'video' ? 'video' : mediaType === 'file' ? 'file' : 'image',
            payload: { url: mediaUrl, is_reusable: true },
          },
        }
      : { text };

    const body = {
      recipient: { id: String(recipientId) },
      message: messagePayload,
      // Regra Meta: HUMAN_AGENT estende janela de resposta gratuita de 24h para 7 dias no CRM
      messaging_type: useHumanAgentTag ? 'MESSAGE_TAG' : 'RESPONSE',
      ...(useHumanAgentTag ? { tag: 'HUMAN_AGENT' } : {}),
    };

    try {
      const res = await fetch(`${host}/${senderNode}/messages?access_token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return {
          success: false,
          error: data.error?.message || `Erro ao enviar mensagem via ${platform}.`,
          code: data.error?.code,
        };
      }
      return {
        success: true,
        messageId: data.message_id || null,
        recipientId: data.recipient_id || recipientId,
        platform,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // --- WEBHOOKS EM TEMPO REAL (MESSENGER & INSTAGRAM DIRECT) ---
  verifyWebhook(query = {}) {
    const cfg = this.readConfig();
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];
    if (mode === 'subscribe' && token && token === cfg.verifyToken) {
      return { verified: true, challenge: String(challenge || '') };
    }
    return { verified: false };
  }

  parseWebhookEvents(payload = {}) {
    const object = payload.object; // 'page' (Messenger) | 'instagram' (IG Direct)
    const channel = object === 'instagram' ? 'instagram' : object === 'page' ? 'facebook' : null;
    if (!channel || !Array.isArray(payload.entry)) return [];

    const events = [];
    for (const entry of payload.entry) {
      const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];
      for (const ev of messaging) {
        if (!ev.sender?.id || ev.message?.is_echo) continue;
        const text = ev.message?.text || ev.postback?.title || '';
        const attachments = Array.isArray(ev.message?.attachments)
          ? ev.message.attachments.map((a, i) => ({
              name: a.payload?.title || `${a.type || 'anexo'}_${i + 1}`,
              type: a.type === 'image' ? 'image/jpeg' : a.type === 'video' ? 'video/mp4' : 'application/octet-stream',
              size: 0,
              url: a.payload?.url || '',
            }))
          : [];
        if (!text && attachments.length === 0) continue;

        events.push({
          channel,
          senderId: String(ev.sender.id), // PSID (FB) ou IGSID (IG)
          recipientId: String(ev.recipient?.id || ''),
          messageId: ev.message?.mid || `meta_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          text: text || (attachments.length ? '[Anexo recebido]' : ''),
          attachments,
          timestamp: ev.timestamp ? new Date(Number(ev.timestamp)).toISOString() : new Date().toISOString(),
        });
      }
    }
    return events;
  }
}
