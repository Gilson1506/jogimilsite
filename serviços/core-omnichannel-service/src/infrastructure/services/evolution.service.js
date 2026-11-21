import { ENV } from '../config/env.config.js';

export class EvolutionService {
  constructor({ logger } = {}) {
    this.logger = logger || console;
    this.baseUrl = ENV.EVOLUTION.url;
    this.apiKey = ENV.EVOLUTION.apiKey;
    this.instanceName = ENV.EVOLUTION.instanceName;
    this.webhookUrl = '';
  }

  configure(evolutionSettings = {}) {
    if (evolutionSettings.serverUrl) {
      this.baseUrl = String(evolutionSettings.serverUrl).trim().replace(/\/$/, '');
    }
    if (evolutionSettings.apiKey && !String(evolutionSettings.apiKey).includes('••••')) {
      this.apiKey = String(evolutionSettings.apiKey).trim();
    }
    if (evolutionSettings.instanceName) {
      this.instanceName = String(evolutionSettings.instanceName).trim();
    }
    if (evolutionSettings.webhookUrl !== undefined) {
      this.webhookUrl = String(evolutionSettings.webhookUrl).trim();
    }
  }

  _headers(apiKey = this.apiKey) {
    return {
      'Content-Type': 'application/json',
      apikey: apiKey,
    };
  }

  async testConnection(override = null) {
    const baseUrl = (override?.serverUrl || this.baseUrl).replace(/\/$/, '');
    const apiKey =
      override?.apiKey && !String(override.apiKey).includes('••••')
        ? override.apiKey
        : this.apiKey;
    const instanceName = override?.instanceName || this.instanceName;

    try {
      const res = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: this._headers(apiKey),
        signal: AbortSignal.timeout(4000),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 404) {
        return {
          online: true,
          exists: false,
          connected: false,
          state: 'not_created',
          instance: instanceName,
          baseUrl,
          message: `Evolution API online em ${baseUrl}, mas a instância '${instanceName}' ainda não foi criada.`,
        };
      }
      if (!res.ok) {
        return {
          online: true,
          exists: true,
          connected: false,
          state: 'error',
          status: res.status,
          instance: instanceName,
          baseUrl,
          message: `Evolution API respondeu HTTP ${res.status}: ${data?.message || 'Verifique a API Key.'}`,
        };
      }
      const state = data?.instance?.state || data?.state || 'unknown';
      return {
        online: true,
        exists: true,
        connected: state === 'open',
        state,
        instance: instanceName,
        baseUrl,
        message:
          state === 'open'
            ? `Instância '${instanceName}' conectada e operacional!`
            : `Evolution API online em ${baseUrl}. Estado da instância '${instanceName}': ${state}.`,
      };
    } catch (err) {
      return {
        online: false,
        exists: false,
        connected: false,
        state: 'offline',
        instance: instanceName,
        baseUrl,
        error: err.message,
        message: `Evolution API inacessível em ${baseUrl}: ${err.message}`,
      };
    }
  }

  /**
   * Verifica o estado de conexão do WhatsApp na Evolution API
   */
  async getConnectionStatus() {
    try {
      const res = await fetch(`${this.baseUrl}/instance/connectionState/${this.instanceName}`, {
        method: 'GET',
        headers: this._headers(),
        signal: AbortSignal.timeout(3500),
      });

      if (res.status === 404) {
        return {
          online: true,
          exists: false,
          state: 'not_created',
          instance: this.instanceName,
          message: 'Instância ainda não criada no Evolution API.',
        };
      }

      if (!res.ok) {
        return {
          online: true,
          exists: true,
          state: 'error',
          instance: this.instanceName,
          status: res.status,
          message: `Erro da Evolution API: HTTP ${res.status}`,
        };
      }

      const data = await res.json().catch(() => ({}));
      const state = data?.instance?.state || data?.state || 'unknown';

      return {
        online: true,
        exists: true,
        state, // 'open' | 'connecting' | 'close'
        connected: state === 'open',
        instance: this.instanceName,
        raw: data,
      };
    } catch (err) {
      return {
        online: false,
        exists: false,
        state: 'offline',
        connected: false,
        instance: this.instanceName,
        error: err.message,
        message: 'Evolution API não está acessível no momento. Certifique-se de iniciar o Docker.',
      };
    }
  }

  /**
   * Normaliza números de telefone (suporte automático a Angola +244)
   */
  normalizePhone(phone) {
    let digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    // Se tiver 9 dígitos começando por 9 (padrão móvel Angola), acrescenta prefixo 244
    if (digits.length === 9 && digits.startsWith('9')) {
      digits = `244${digits}`;
    }
    return digits;
  }

  /**
   * Cria uma nova instância na Evolution API com boas práticas de estabilidade
   */
  async createInstance() {
    try {
      const payload = {
        instanceName: this.instanceName,
        token: this.apiKey,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        rejectCall: false,
        groupsIgnore: true,
        alwaysOnline: false,
        readMessages: true,
        readStatus: false,
        syncFullHistory: false,
      };

      const res = await fetch(`${this.baseUrl}/instance/create`, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });

      const data = await res.json().catch(() => ({}));
      return { success: res.ok, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Obtém o QR Code em base64 para pareamento
   */
  async getQrCode() {
    try {
      const res = await fetch(`${this.baseUrl}/instance/connect/${this.instanceName}`, {
        method: 'GET',
        headers: this._headers(),
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        // Se a instância não existe, tentar criar primeiro
        if (res.status === 404) {
          await this.createInstance();
          const retry = await fetch(`${this.baseUrl}/instance/connect/${this.instanceName}`, {
            method: 'GET',
            headers: this._headers(),
            signal: AbortSignal.timeout(6000),
          });
          const retryData = await retry.json().catch(() => ({}));
          return {
            success: retry.ok,
            qrcode: retryData.base64 || retryData.code || null,
            pairingCode: retryData.pairingCode || null,
            data: retryData,
          };
        }
        return { success: false, message: `Falha ao obter QR Code: HTTP ${res.status}` };
      }

      const data = await res.json().catch(() => ({}));
      return {
        success: true,
        qrcode: data.base64 || data.code || null,
        pairingCode: data.pairingCode || null,
        data,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        message: 'Servidor Evolution API offline ou inacessível.',
      };
    }
  }

  /**
   * Envia mensagem de texto via WhatsApp
   * @param {string} phone Número no formato 244942775559
   * @param {string} text Mensagem de texto
   */
  async sendText(phone, text) {
    const cleanNumber = this.normalizePhone(phone);

    if (!cleanNumber || cleanNumber.length < 9) {
      throw new Error('Número de telefone inválido para envio de WhatsApp.');
    }

    try {
      const payload = {
        number: cleanNumber,
        text,
        delay: 1200, // Cadência natural anti-bloqueio WhatsApp
        linkPreview: false,
      };

      const res = await fetch(`${this.baseUrl}/message/sendText/${this.instanceName}`, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          error: data.message || `Erro no envio via Evolution API (HTTP ${res.status})`,
          simulated: false,
        };
      }

      return {
        success: true,
        data,
        simulated: false,
      };
    } catch (err) {
      this.logger.warn?.(`[EvolutionService] Evolution offline: ${err.message}`);
      return {
        success: false,
        offline: true,
        error: `Evolution API inacessível (${err.message}). Conecte o servidor Evolution.`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Envia ficheiro/imagem/documento via WhatsApp (Evolution API)
   */
  async sendMedia(phone, attachment, caption = '') {
    const cleanNumber = this.normalizePhone(phone);
    if (!cleanNumber || cleanNumber.length < 9) {
      return { success: false, error: 'Número de telefone inválido para envio de mídia no WhatsApp.' };
    }
    try {
      const mime = attachment?.type || 'application/octet-stream';
      const mediatype = mime.startsWith('image/')
        ? 'image'
        : mime.startsWith('video/')
        ? 'video'
        : mime.startsWith('audio/')
        ? 'audio'
        : 'document';
      const base64 = Buffer.isBuffer(attachment?.buffer)
        ? attachment.buffer.toString('base64')
        : String(attachment?.dataUrl || '').replace(/^data:[^,]*;base64,/i, '').trim();
      const mediaValue = base64 || String(attachment?.url || '').trim();
      if (!mediaValue) {
        return {
          success: false,
          error: `Conteúdo do anexo "${attachment?.name || 'anexo'}" indisponível.`,
        };
      }

      const payload = {
        number: cleanNumber,
        mediatype,
        mimetype: mime,
        caption: caption || '',
        media: mediaValue,
        fileName: attachment?.name || 'anexo',
      };

      const res = await fetch(`${this.baseUrl}/message/sendMedia/${this.instanceName}`, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const rawErr = data?.message ?? data?.error ?? data?.response?.message;
        const errText = Array.isArray(rawErr)
          ? rawErr.join(', ')
          : typeof rawErr === 'object' && rawErr !== null
          ? JSON.stringify(rawErr)
          : String(rawErr || `HTTP ${res.status}`);
        return { success: false, status: res.status, error: errText };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, offline: true, error: err.message };
    }
  }

  /**
   * Encerra a sessão da instância
   */
  async logout() {
    try {
      const res = await fetch(`${this.baseUrl}/instance/logout/${this.instanceName}`, {
        method: 'DELETE',
        headers: this._headers(),
        signal: AbortSignal.timeout(6000),
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
