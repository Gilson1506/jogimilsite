import nodemailer from 'nodemailer';
import { IMailProvider } from '../../application/ports/mail-provider.port.js';
import { ENV, isSmtpConfigured } from '../config/env.config.js';
import { buildEmailTemplate } from './templates/jogimil-email.template.js';

export class NodemailerAdapter extends IMailProvider {
  constructor({ logger, initialConfig } = {}) {
    super();
    this.logger = logger;
    this.transporter = null;
    this.smtpConfig = { ...ENV.SMTP };
    this.fromEmail = ENV.FROM_EMAIL;
    this.destinationEmail = ENV.DESTINATION_EMAIL;
    this.isConfigured = isSmtpConfigured;

    if (initialConfig) {
      this.configure(initialConfig);
    } else if (this.isConfigured) {
      this._buildTransporter();
    }
  }

  _buildTransporter() {
    this.isConfigured = Boolean(
      this.smtpConfig?.host && this.smtpConfig?.auth?.user && this.smtpConfig?.auth?.pass
    );

    if (this.isConfigured) {
      const port = Number(this.smtpConfig.port || 465);
      this.transporter = nodemailer.createTransport({
        host: this.smtpConfig.host,
        port,
        secure: typeof this.smtpConfig.secure === 'boolean' ? this.smtpConfig.secure : port === 465,
        auth: {
          user: this.smtpConfig.auth.user,
          pass: this.smtpConfig.auth.pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 60000,
      });
    } else {
      this.transporter = null;
    }
  }

  configure(emailSettings = {}) {
    const smtpPort = Number(emailSettings.smtpPort || this.smtpConfig.port || 465);
    const nextPass =
      emailSettings.smtpPass && !String(emailSettings.smtpPass).includes('••••')
        ? emailSettings.smtpPass
        : this.smtpConfig.auth.pass;

    this.smtpConfig = {
      host: emailSettings.smtpHost || this.smtpConfig.host,
      port: smtpPort,
      secure:
        typeof emailSettings.smtpSecure === 'boolean'
          ? emailSettings.smtpSecure
          : smtpPort === 465,
      auth: {
        user: emailSettings.smtpUser || this.smtpConfig.auth.user,
        pass: nextPass,
      },
    };

    if (emailSettings.defaultFrom) {
      this.fromEmail = emailSettings.defaultFrom;
    }
    if (emailSettings.destinationEmail) {
      this.destinationEmail = emailSettings.destinationEmail;
    }

    this._buildTransporter();
  }

  async verifyConnection() {
    if (!this.isConfigured || !this.transporter) {
      return {
        ok: false,
        mode: 'local_simulation',
        message: 'SMTP desconfigurado (modo simulação local ativo)',
      };
    }

    try {
      const verifyPromise = this.transporter.verify();
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new Error('Tempo limite excedido ao validar SMTP (4s)'));
        }, 4000);
      });

      await Promise.race([verifyPromise, timeoutPromise]);
      return {
        ok: true,
        mode: 'smtp',
        message: `Conectado ao servidor SMTP em ${this.smtpConfig.host}:${this.smtpConfig.port}`,
      };
    } catch (err) {
      return {
        ok: false,
        mode: 'smtp_error',
        message: err.message,
      };
    }
  }

  async send({ submission, correlationId, toOverride }) {
    const { formTitle, clientEmail, clientName } = submission;
    const { html, text } = buildEmailTemplate({ submission, correlationId });

    const subject = `[JOGIMIL] ${formTitle} - ${clientName || clientEmail || 'Novo Contacto'}`;

    const mailOptions = {
      from: this.fromEmail,
      to: toOverride || this.destinationEmail,
      replyTo: clientEmail || undefined,
      subject,
      text,
      html,
      headers: {
        'X-Correlation-ID': correlationId || '',
        'X-Submission-ID': submission.id,
      },
    };

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        this.logger.info(`[MailAdapter] Email despachado via SMTP (MsgID: ${info.messageId})`, {
          messageId: info.messageId,
          submissionId: submission.id,
          correlationId,
        });
        return { success: true, messageId: info.messageId, mode: 'smtp' };
      } catch (err) {
        this.logger.error(`[MailAdapter] Falha no envio SMTP: ${err.message}`, {
          error: err.message,
          submissionId: submission.id,
          correlationId,
        });
        throw err;
      }
    }

    // Modo local / simulação resiliente
    this.logger.info(`[MailAdapter - Simulação Local] Email gerado para ${ENV.DESTINATION_EMAIL}:`, {
      submissionId: submission.id,
      correlationId,
      subject,
    });
    return { success: true, mode: 'local_simulation' };
  }

  _isTransientSmtpError(err) {
    const code = String(err?.code || '').toUpperCase();
    const transientCodes = new Set(['ETIMEDOUT', 'ECONNRESET', 'ESOCKET', 'ECONNECTION', 'EPIPE']);
    if (transientCodes.has(code)) return true;
    return /timeout|connection closed|socket/i.test(String(err?.message || ''));
  }

  _htmlToPlainText(html) {
    return String(html || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  async sendDirect({ to, cc, subject, text, html, attachments = [] }) {
    const cleanTo = String(to || '').trim();
    if (!cleanTo) {
      return { success: false, mode: 'validation_error', error: 'Destinatário de email não informado.' };
    }

    const recipients = cleanTo
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const hasValidRecipients =
      recipients.length > 0 &&
      recipients.every((addr) => /[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+/.test(addr));
    if (!hasValidRecipients) {
      return { success: false, mode: 'validation_error', error: 'Endereço de email do destinatário inválido.' };
    }

    const cleanCc = typeof cc === 'string' && cc.trim() ? cc.trim() : undefined;

    const mailAttachments = [];
    for (const a of attachments || []) {
      const safeName = String(a?.name || 'anexo').replace(/[\r\n]/g, '_').trim() || 'anexo';
      let contentBuffer = null;
      if (Buffer.isBuffer(a?.buffer)) {
        contentBuffer = a.buffer;
      } else if (a?.dataUrl) {
        const cleanB64 = String(a.dataUrl).replace(/^data:[^,]*;base64,/i, '').trim();
        if (cleanB64) {
          contentBuffer = Buffer.from(cleanB64, 'base64');
        }
      }

      if (!contentBuffer || contentBuffer.length === 0) {
        return {
          success: false,
          mode: 'attachment_error',
          error: `O anexo "${safeName}" está vazio ou não pôde ser carregado.`,
        };
      }

      mailAttachments.push({
        filename: safeName,
        content: contentBuffer,
        contentType: a?.type || 'application/octet-stream',
        contentDisposition: 'attachment',
      });
    }

    const cleanHtml = typeof html === 'string' && html.trim() ? html.trim() : undefined;
    const rawText = typeof text === 'string' ? text.trim() : '';
    const cleanText = rawText || (cleanHtml ? this._htmlToPlainText(cleanHtml) : '');

    const mailOptions = {
      from: this.fromEmail,
      to: cleanTo,
      cc: cleanCc,
      subject: String(subject || '').trim() || 'Atendimento JOGIMIL Tecnologias',
      text: cleanText,
      html: cleanHtml,
      attachments: mailAttachments,
    };

    if (!this.transporter) {
      return { success: false, mode: 'smtp_unconfigured', error: 'SMTP não configurado no servidor.' };
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId, mode: 'smtp' };
      } catch (err) {
        if (attempt === 0 && this._isTransientSmtpError(err)) {
          this.logger?.warn?.(`[MailAdapter] Falha transitória SMTP (${err.message}). A tentar novamente...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          this._buildTransporter();
          continue;
        }
        this.logger?.error?.(`[MailAdapter] Falha definitiva no sendDirect: ${err.message}`, {
          code: err.code || '',
          to: cleanTo,
        });
        return {
          success: false,
          mode: 'smtp_error',
          error: err.message,
          code: err.code || '',
        };
      }
    }
  }
}
