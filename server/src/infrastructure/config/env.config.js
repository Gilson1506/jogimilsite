import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');
const projectRootDir = path.resolve(rootDir, '../');

dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(projectRootDir, '.env') });

const smtpPort = Number(process.env.SMTP_PORT || 465);

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3001),
  HOST: process.env.HOST || '0.0.0.0',

  SERVICE_NAME: 'jogimil-forms-microservice',
  SERVICE_VERSION: '2.0.0',

  DESTINATION_EMAIL: process.env.DESTINATION_EMAIL || 'geral@jogimiltecnologias.it.ao',
  FROM_EMAIL: process.env.FROM_EMAIL || '"JOGIMIL Tecnologias" <geral@jogimiltecnologias.it.ao>',

  SMTP: {
    host: process.env.SMTP_HOST || 'mx109.angoweb.net',
    port: smtpPort,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER || 'geral@jogimiltecnologias.it.ao',
      pass: process.env.SMTP_PASS || '',
    },
  },

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

  EVOLUTION: {
    url: (process.env.EVOLUTION_API_URL || 'http://localhost:8080').replace(/\/$/, ''),
    apiKey: process.env.EVOLUTION_API_KEY || 'jogimil_secret_key_2026',
    instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'jogimil',
    defaultNotifyPhone: process.env.ADMIN_DEFAULT_NOTIFY_PHONE || '244942775559',
  },

  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  RATE_LIMIT: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000), // 1 minuto
    max: Number(process.env.RATE_LIMIT_MAX || 60), // 60 requisições por minuto
  },

  DATA_DIR: path.join(rootDir, 'data'),
  SUBMISSIONS_FILE: path.join(rootDir, 'data', 'submissions.jsonl'),
};

export const isSmtpConfigured = Boolean(
  ENV.SMTP.host && ENV.SMTP.auth.user && ENV.SMTP.auth.pass
);
