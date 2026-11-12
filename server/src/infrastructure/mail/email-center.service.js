import tls from 'node:tls';
import { ENV } from '../config/env.config.js';

export class EmailCenterService {
  constructor({ mailProvider, logger } = {}) {
    this.mailProvider = mailProvider;
    this.logger = logger || console;
    this.smtpConfig = ENV.SMTP;
    this.imapConfig = ENV.IMAP;
  }

  /**
   * Testa a conectividade IMAP com handshake SSL/TLS real na porta 993
   */
  async testImapConnection() {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const socket = tls.connect(
        {
          host: this.imapConfig.host,
          port: this.imapConfig.port,
          rejectUnauthorized: false,
          timeout: 4000,
        },
        () => {
          const latency = Date.now() - startTime;
          socket.end();
          resolve({
            connected: true,
            host: this.imapConfig.host,
            port: this.imapConfig.port,
            user: this.imapConfig.auth.user,
            latencyMs: latency,
            protocol: 'IMAP SSL/TLS (RFC 3501 / 9051)',
            status: 'operational',
            message: `Servidor IMAP conectado com sucesso (${latency}ms).`,
          });
        }
      );

      socket.on('error', (err) => {
        resolve({
          connected: false,
          host: this.imapConfig.host,
          port: this.imapConfig.port,
          user: this.imapConfig.auth.user,
          protocol: 'IMAP SSL/TLS',
          status: 'error',
          error: err.message,
          message: `Falha ao conectar ao servidor IMAP: ${err.message}`,
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          connected: false,
          host: this.imapConfig.host,
          port: this.imapConfig.port,
          user: this.imapConfig.auth.user,
          protocol: 'IMAP SSL/TLS',
          status: 'timeout',
          message: 'Timeout ao conectar ao servidor IMAP.',
        });
      });
    });
  }

  /**
   * Obtém o status consolidado de SMTP e IMAP
   */
  async getStatus() {
    const imapStatus = await this.testImapConnection();
    const isSmtpConfigured = Boolean(this.smtpConfig.host && this.smtpConfig.auth.user && this.smtpConfig.auth.pass);

    return {
      emailAddress: this.smtpConfig.auth.user,
      smtp: {
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
        secure: this.smtpConfig.secure,
        user: this.smtpConfig.auth.user,
        configured: isSmtpConfigured,
        destination: ENV.DESTINATION_EMAIL,
        from: ENV.FROM_EMAIL,
      },
      imap: imapStatus,
      pop3: {
        host: ENV.POP3.host,
        port: ENV.POP3.port,
        secure: ENV.POP3.secure,
      },
    };
  }

  /**
   * Dispara um email de teste profissional via SMTP
   */
  async sendTestEmail(toEmail) {
    const target = toEmail || this.smtpConfig.auth.user;

    const fakeSubmission = {
      id: `test_${Date.now()}`,
      formType: 'teste-admin',
      formTitle: 'Teste do Centro Omnicanal JOGIMIL',
      clientName: 'Administrador JOGIMIL',
      clientEmail: target,
      source: 'Painel Admin JOGIMIL',
      receivedAt: new Date().toLocaleString('pt-AO'),
      data: {
        tipo: 'Verificação de Servidor de Correio Angoweb',
        servidorSmtp: `${this.smtpConfig.host}:${this.smtpConfig.port}`,
        servidorImap: `${this.imapConfig.host}:${this.imapConfig.port}`,
        mensagem: 'Este é um teste automático de envio do microserviço da JOGIMIL - Tecnologias, Lda.',
      },
    };

    if (this.mailProvider?.send) {
      const res = await this.mailProvider.send({
        submission: fakeSubmission,
        correlationId: `test-${Date.now()}`,
      });
      return { success: true, result: res, destination: target };
    }

    return { success: false, message: 'MailProvider não disponível.' };
  }
}
