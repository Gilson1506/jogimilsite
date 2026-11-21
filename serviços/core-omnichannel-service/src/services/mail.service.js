import nodemailer from 'nodemailer';
import { ENV, isSmtpConfigured } from '../config/env.js';
import { generateEmailHtml, generatePlainText, formatLuandaTimestamp } from '../templates/email.template.js';

let transporter = null;

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport(ENV.SMTP);
  transporter.verify((err) => {
    if (err) {
      console.warn('[MailService] Aviso ao verificar conexão SMTP:', err.message);
    } else {
      console.log(`[MailService] Conexão SMTP autenticada com sucesso em ${ENV.SMTP.host}:${ENV.SMTP.port}`);
    }
  });
} else {
  console.log('[MailService] SMTP em modo local / desativado. Notificações serão gravadas no log e em disco.');
}

export async function sendFormEmail({ formTitle, formType, data, source }) {
  const timestamp = formatLuandaTimestamp();
  const subject = `[JOGIMIL] ${formTitle} - ${data.nome || data.email || 'Novo contacto'}`;
  const html = generateEmailHtml({ formTitle, formType, data, timestamp, source });
  const text = generatePlainText({ formTitle, formType, data, timestamp, source });

  const clientEmail = data.email && /^\S+@\S+\.\S+$/.test(data.email) ? data.email : undefined;

  const mailOptions = {
    from: ENV.FROM_EMAIL,
    to: ENV.DESTINATION_EMAIL,
    replyTo: clientEmail,
    subject,
    text,
    html,
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[MailService] E-mail enviado com sucesso (MessageId: ${info.messageId}) para ${ENV.DESTINATION_EMAIL}`);
      return { sent: true, messageId: info.messageId, mode: 'smtp' };
    } catch (error) {
      console.error('[MailService] Erro ao enviar por SMTP:', error.message);
      return { sent: false, error: error.message, mode: 'smtp_failed' };
    }
  }

  console.log(`[MailService - Simulação Local] Email gerado para ${ENV.DESTINATION_EMAIL}:\n`, text);
  return { sent: true, mode: 'local_simulation' };
}
