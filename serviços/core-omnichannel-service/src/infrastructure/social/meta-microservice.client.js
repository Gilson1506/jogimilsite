import { MetaGraphService } from '../../../../meta-social-service/src/meta-graph.service.js';

const DEFAULT_META_URL = process.env.META_SERVICE_URL || 'http://localhost:3102';

/**
 * Cliente HTTP para o Microserviço Autónomo Meta Social (porta 3102).
 * Se o microserviço estiver em execução na rede/porta configurada, comunica via HTTP;
 * caso contrário, ativa automaticamente a ponte local (fallback in-process) sem downtime.
 */
export class MetaMicroserviceClient {
  constructor({ baseUrl = DEFAULT_META_URL } = {}) {
    this.baseUrl = String(baseUrl || '').replace(/\/$/, '');
    this.localFallback = new MetaGraphService();
  }

  async _callRemote(path, options = {}) {
    if (!this.baseUrl) throw new Error('META_SERVICE_URL não configurado');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(json.error || `HTTP ${res.status}`);
        err.isRemoteError = true;
        err.statusCode = res.status;
        throw err;
      }
      return { ...json, mode: 'microservice_http', serviceUrl: this.baseUrl };
    } finally {
      clearTimeout(timer);
    }
  }

  async getStatus() {
    try {
      return await this._callRemote('/api/v1/meta/status');
    } catch (err) {
      if (err.isRemoteError) throw err;
      return { ...this.localFallback.getPublicStatus(), mode: 'in_process_fallback' };
    }
  }

  async saveConfig(patch) {
    try {
      return await this._callRemote('/api/v1/meta/config', {
        method: 'POST',
        body: JSON.stringify(patch || {}),
      });
    } catch (err) {
      if (err.isRemoteError) throw err;
      return { ...this.localFallback.saveConfig(patch), mode: 'in_process_fallback' };
    }
  }

  async buildAuthUrl(mode, redirectUri) {
    try {
      const qs = new URLSearchParams();
      if (mode) qs.set('mode', mode);
      if (redirectUri) qs.set('redirectUri', redirectUri);
      return await this._callRemote(`/api/v1/meta/auth/url?${qs.toString()}`);
    } catch (err) {
      if (err.isRemoteError) throw err;
      return { ...this.localFallback.buildAuthUrl(mode, redirectUri), mode: 'in_process_fallback' };
    }
  }

  async handleAuthCallback({ code, state }) {
    return this.localFallback.handleAuthCallback({ code, state });
  }

  async disconnect(target = 'all') {
    try {
      return await this._callRemote('/api/v1/meta/disconnect', {
        method: 'POST',
        body: JSON.stringify({ target }),
      });
    } catch (err) {
      if (err.isRemoteError) throw err;
      return { ...this.localFallback.disconnect(target), mode: 'in_process_fallback' };
    }
  }

  async listPosts() {
    try {
      const res = await this._callRemote('/api/v1/meta/posts');
      return res.posts || [];
    } catch (err) {
      if (err.isRemoteError) throw err;
      return this.localFallback.listPosts();
    }
  }

  async publishMultiPlatform(payload) {
    try {
      const res = await this._callRemote('/api/v1/meta/publish', {
        method: 'POST',
        body: JSON.stringify(payload || {}),
      });
      return res.post || res;
    } catch (err) {
      if (err.isRemoteError) throw err;
      return this.localFallback.publishMultiPlatform(payload);
    }
  }

  async deletePost(id) {
    try {
      await this._callRemote(`/api/v1/meta/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      if (err.isRemoteError) throw err;
      return this.localFallback.deletePost(id);
    }
  }

  schedulePost(payload) {
    return this.localFallback.schedulePost(payload);
  }

  updatePost(id, patch) {
    return this.localFallback.updatePost(id, patch);
  }

  async sendDirectMessage(payload) {
    try {
      return await this._callRemote('/api/v1/meta/messages/send', {
        method: 'POST',
        body: JSON.stringify(payload || {}),
      });
    } catch (err) {
      if (err.isRemoteError) return { success: false, error: err.message };
      return this.localFallback.sendDirectMessage(payload);
    }
  }

  verifyWebhook(query) {
    return this.localFallback.verifyWebhook(query);
  }

  parseWebhookEvents(payload) {
    return this.localFallback.parseWebhookEvents(payload);
  }
}
