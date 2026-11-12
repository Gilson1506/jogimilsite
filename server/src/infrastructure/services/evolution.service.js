import { ENV } from '../config/env.config.js';

export class EvolutionService {
  constructor({ logger } = {}) {
    this.logger = logger || console;
    this.baseUrl = ENV.EVOLUTION.url;
    this.apiKey = ENV.EVOLUTION.apiKey;
    this.instanceName = ENV.EVOLUTION.instanceName;
  }

  _headers() {
    return {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
    };
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
   * Cria uma nova instância na Evolution API
   */
  async createInstance() {
    try {
      const payload = {
        instanceName: this.instanceName,
        token: this.apiKey,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      };

      const res = await fetch(`${this.baseUrl}/instance/create`, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
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
    const cleanNumber = String(phone).replace(/\D/g, '');

    if (!cleanNumber) {
      throw new Error('Número de telefone inválido para envio de WhatsApp.');
    }

    try {
      const payload = {
        number: cleanNumber,
        text,
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
      this.logger.warn?.(`[EvolutionService] Evolution offline. Gravando mensagem com simulação: ${err.message}`);
      return {
        success: true,
        simulated: true,
        note: 'Mensagem registada e simulada com sucesso (Evolution API container offline).',
        timestamp: new Date().toISOString(),
      };
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
