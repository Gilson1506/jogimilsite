import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const projectRootDir = path.resolve(rootDir, '../');

// Carregar .env
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(projectRootDir, '.env') });

const smtpPort = Number(process.env.SMTP_PORT || 465);

export const ENV = {
  PORT: Number(process.env.PORT || 3001),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Destinatário principal dos formulários
  DESTINATION_EMAIL: process.env.DESTINATION_EMAIL || 'geral@jogimiltecnologias.it.ao',
  FROM_EMAIL: process.env.FROM_EMAIL || '"JOGIMIL Tecnologias" <geral@jogimiltecnologias.it.ao>',
  
  // Configuração SMTP (Servidor de saída: mx109.angoweb.net, Porta 465 SSL/TLS)
  SMTP: {
    host: process.env.SMTP_HOST || 'mx109.angoweb.net',
    port: smtpPort,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER || 'geral@jogimiltecnologias.it.ao',
      pass: process.env.SMTP_PASS || '',
    },
  },

  // Configuração IMAP / POP3 (Servidor de entrada: mx109.angoweb.net)
  IMAP: {
    host: process.env.IMAP_HOST || 'mx109.angoweb.net',
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'geral@jogimiltecnologias.it.ao',
      pass: process.env.SMTP_PASS || '',
    },
  },

  POP3: {
    host: process.env.POP3_HOST || 'mx109.angoweb.net',
    port: Number(process.env.POP3_PORT || 995),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'geral@jogimiltecnologias.it.ao',
      pass: process.env.SMTP_PASS || '',
    },
  },
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Caminhos de dados
  DATA_DIR: path.join(rootDir, 'data'),
  SUBMISSIONS_FILE: path.join(rootDir, 'data', 'submissions.jsonl'),
};

export const isSmtpConfigured = Boolean(
  ENV.SMTP.host && ENV.SMTP.auth.user && ENV.SMTP.auth.pass
);
