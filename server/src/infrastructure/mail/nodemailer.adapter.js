import nodemailer from 'nodemailer';
import { IMailProvider } from '../../application/ports/mail-provider.port.js';
import { ENV, isSmtpConfigured } from '../config/env.config.js';
import { buildEmailTemplate } from './templates/jogimil-email.template.js';

export class NodemailerAdapter extends IMailProvider {
  constructor({ logger }) {
    super();
    this.logger = logger;
    this.transporter = null;
    this.isConfigured = isSmtpConfigured;

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        ...ENV.SMTP,
        connectionTimeout: 2500,
        greetingTimeout: 2500,
        socketTimeout: 3000,
      });
    }
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
          reject(new Error('Tempo limite excedido ao validar SMTP (2.5s)'));
        }, 2500);
      });

      await Promise.race([verifyPromise, timeoutPromise]);
      return {
        ok: true,
        mode: 'smtp',
        message: `Conectado ao servidor SMTP em ${ENV.SMTP.host}:${ENV.SMTP.port}`,
      };
    } catch (err) {
      return {
        ok: false,
        mode: 'smtp_error',
        message: err.message,
      };
    }
  }

  async send({ submission, correlationId }) {
    const { formTitle, clientEmail, clientName } = submission;
    const { html, text } = buildEmailTemplate({ submission, correlationId });

    const subject = `[JOGIMIL] ${formTitle} - ${clientName || clientEmail || 'Novo Contacto'}`;

    const mailOptions = {
      from: ENV.FROM_EMAIL,
      to: ENV.DESTINATION_EMAIL,
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
}
