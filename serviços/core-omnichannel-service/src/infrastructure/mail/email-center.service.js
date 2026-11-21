import tls from 'node:tls';
import net from 'node:net';
import { ENV } from '../config/env.config.js';

export class EmailCenterService {
  constructor({ mailProvider, logger } = {}) {
    this.mailProvider = mailProvider;
    this.logger = logger || console;
    this.smtpConfig = { ...ENV.SMTP };
    this.imapConfig = { ...ENV.IMAP };
    this.fromEmail = ENV.FROM_EMAIL;
    this.destinationEmail = ENV.DESTINATION_EMAIL;
  }

  /**
   * Atualiza configurações SMTP/IMAP em tempo de execução
   */
  configure(emailSettings = {}) {
    const smtpPort = Number(emailSettings.smtpPort || this.smtpConfig.port || 465);
    const imapPort = Number(emailSettings.imapPort || this.imapConfig.port || 993);

    const nextSmtpPass =
      emailSettings.smtpPass && !String(emailSettings.smtpPass).includes('••••')
        ? emailSettings.smtpPass
        : this.smtpConfig.auth?.pass || '';

    const nextImapPass =
      emailSettings.imapPass && !String(emailSettings.imapPass).includes('••••')
        ? emailSettings.imapPass
        : nextSmtpPass || this.imapConfig.auth?.pass || '';

    this.smtpConfig = {
      host: emailSettings.smtpHost || this.smtpConfig.host,
      port: smtpPort,
      secure:
        typeof emailSettings.smtpSecure === 'boolean'
          ? emailSettings.smtpSecure
          : smtpPort === 465,
      auth: {
        user: emailSettings.smtpUser || this.smtpConfig.auth?.user || '',
        pass: nextSmtpPass,
      },
    };

    this.imapConfig = {
      host: emailSettings.imapHost || this.imapConfig.host,
      port: imapPort,
      secure:
        typeof emailSettings.imapTls === 'boolean'
          ? emailSettings.imapTls
          : typeof emailSettings.imapSecure === 'boolean'
          ? emailSettings.imapSecure
          : imapPort === 993,
      auth: {
        user: emailSettings.imapUser || this.imapConfig.auth?.user || this.smtpConfig.auth.user,
        pass: nextImapPass,
      },
    };

    if (emailSettings.defaultFrom) {
      this.fromEmail = emailSettings.defaultFrom;
    }
    if (emailSettings.destinationEmail) {
      this.destinationEmail = emailSettings.destinationEmail;
    }

    if (this.mailProvider?.configure) {
      this.mailProvider.configure({
        smtpHost: this.smtpConfig.host,
        smtpPort: this.smtpConfig.port,
        smtpSecure: this.smtpConfig.secure,
        smtpUser: this.smtpConfig.auth.user,
        smtpPass: this.smtpConfig.auth.pass,
        defaultFrom: this.fromEmail,
        destinationEmail: this.destinationEmail,
      });
    }
  }

  /**
   * Testa a conectividade IMAP (handshake SSL/TLS + CAPABILITY + LOGIN se houver credenciais)
   */
  async testImapConnection(override = null) {
    const cfg = override
      ? {
          host: override.imapHost || this.imapConfig.host,
          port: Number(override.imapPort || this.imapConfig.port || 993),
          secure:
            typeof override.imapTls === 'boolean'
              ? override.imapTls
              : typeof override.imapSecure === 'boolean'
              ? override.imapSecure
              : Number(override.imapPort || this.imapConfig.port || 993) === 993,
          auth: {
            user: override.imapUser || this.imapConfig.auth?.user || '',
            pass:
              override.imapPass && !String(override.imapPass).includes('••••')
                ? override.imapPass
                : this.imapConfig.auth?.pass || '',
          },
        }
      : this.imapConfig;

    return new Promise((resolve) => {
      const startTime = Date.now();
      let settled = false;
      let buffer = '';
      let stage = 'greeting'; // greeting -> capability -> login -> logout

      const finish = (result) => {
        if (settled) return;
        settled = true;
        try {
          socket.destroy();
        } catch {
          // ignore
        }
        resolve(result);
      };

      const onConnect = () => {
        // Aguarda banner * OK do servidor IMAP
      };

      const socket = cfg.secure
        ? tls.connect(
            {
              host: cfg.host,
              port: cfg.port,
              rejectUnauthorized: false,
              timeout: 4500,
            },
            onConnect
          )
        : net.connect(
            {
              host: cfg.host,
              port: cfg.port,
              timeout: 4500,
            },
            onConnect
          );

      socket.setEncoding('utf8');

      socket.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\r\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (stage === 'greeting' && line.startsWith('* ')) {
            stage = 'capability';
            socket.write('a1 CAPABILITY\r\n');
          } else if (stage === 'capability' && line.startsWith('a1 OK')) {
            if (cfg.auth?.user && cfg.auth?.pass) {
              stage = 'login';
              const u = String(cfg.auth.user).replace(/"/g, '\\"');
              const p = String(cfg.auth.pass).replace(/"/g, '\\"');
              socket.write(`a2 LOGIN "${u}" "${p}"\r\n`);
            } else {
              const latency = Date.now() - startTime;
              socket.write('a3 LOGOUT\r\n');
              finish({
                connected: true,
                authenticated: false,
                host: cfg.host,
                port: cfg.port,
                user: cfg.auth?.user || '',
                latencyMs: latency,
                protocol: cfg.secure ? 'IMAP SSL/TLS (RFC 3501 / 9051)' : 'IMAP TCP (RFC 3501)',
                status: 'operational_no_auth',
                message: `Servidor IMAP acessível (${latency}ms). Credenciais não fornecidas para LOGIN.`,
              });
            }
          } else if (stage === 'login' && (line.startsWith('a2 OK') || line.startsWith('a2 NO') || line.startsWith('a2 BAD'))) {
            const latency = Date.now() - startTime;
            const authOk = line.startsWith('a2 OK');
            socket.write('a3 LOGOUT\r\n');
            finish({
              connected: true,
              authenticated: authOk,
              host: cfg.host,
              port: cfg.port,
              user: cfg.auth?.user || '',
              latencyMs: latency,
              protocol: cfg.secure ? 'IMAP SSL/TLS (RFC 3501 / 9051)' : 'IMAP TCP (RFC 3501)',
              status: authOk ? 'operational' : 'auth_failed',
              message: authOk
                ? `IMAP conectado e autenticado com sucesso (${latency}ms).`
                : `Servidor IMAP acessível (${latency}ms), mas falhou LOGIN: ${line}`,
            });
          }
        }
      });

      socket.on('error', (err) => {
        finish({
          connected: false,
          authenticated: false,
          host: cfg.host,
          port: cfg.port,
          user: cfg.auth?.user || '',
          protocol: cfg.secure ? 'IMAP SSL/TLS' : 'IMAP TCP',
          status: 'error',
          error: err.message,
          message: `Falha ao conectar ao servidor IMAP: ${err.message}`,
        });
      });

      socket.on('timeout', () => {
        finish({
          connected: false,
          authenticated: false,
          host: cfg.host,
          port: cfg.port,
          user: cfg.auth?.user || '',
          protocol: cfg.secure ? 'IMAP SSL/TLS' : 'IMAP TCP',
          status: 'timeout',
          message: 'Timeout ao conectar ao servidor IMAP.',
        });
      });
    });
  }

  /**
   * Obtém o status consolidado de SMTP e IMAP (com verificação real)
   */
  async getStatus() {
    const [imapStatus, smtpVerify] = await Promise.all([
      this.testImapConnection(),
      this.mailProvider?.verifyConnection
        ? this.mailProvider.verifyConnection()
        : Promise.resolve({ ok: false, mode: 'unavailable', message: 'MailProvider indisponível' }),
    ]);

    const isSmtpConfigured = Boolean(
      this.smtpConfig.host && this.smtpConfig.auth?.user && this.smtpConfig.auth?.pass
    );

    return {
      emailAddress: this.smtpConfig.auth?.user,
      smtp: {
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
        secure: this.smtpConfig.secure,
        user: this.smtpConfig.auth?.user,
        configured: isSmtpConfigured,
        verified: Boolean(smtpVerify?.ok),
        verifyMessage: smtpVerify?.message,
        destination: this.destinationEmail,
        from: this.fromEmail,
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
    const target = toEmail || this.smtpConfig.auth?.user || this.destinationEmail;

    const fakeSubmission = {
      id: `test_${Date.now()}`,
      formType: 'teste-admin',
      formTitle: 'Teste do Centro Omnicanal JOGIMIL',
      clientName: 'Administrador JOGIMIL',
      clientEmail: target,
      source: 'Painel Admin JOGIMIL',
      receivedAt: new Date().toLocaleString('pt-AO'),
      data: {
        tipo: 'Verificação de Servidor de Correio SMTP/IMAP',
        servidorSmtp: `${this.smtpConfig.host}:${this.smtpConfig.port}`,
        servidorImap: `${this.imapConfig.host}:${this.imapConfig.port}`,
        mensagem: 'Este é um teste automático de envio do microserviço da JOGIMIL - Tecnologias, Lda.',
      },
    };

    if (this.mailProvider?.send) {
      const res = await this.mailProvider.send({
        submission: fakeSubmission,
        correlationId: `test-${Date.now()}`,
        toOverride: target,
      });
      return { success: true, result: res, destination: target };
    }

    return { success: false, message: 'MailProvider não disponível.' };
  }

  /**
   * Sincroniza os emails mais recentes da caixa de entrada IMAP (RFC 3501)
   * usando TLS nativo do Node.js (sem dependências externas).
   */
  async fetchRecentInboxEmails(limit = 10) {
    const cfg = this.imapConfig;
    if (!cfg?.host || !cfg?.auth?.user || !cfg?.auth?.pass) {
      return [];
    }

    return new Promise((resolve) => {
      let settled = false;
      let raw = '';
      let stage = 'greeting';
      let existsCount = 0;

      const finish = (items = []) => {
        if (settled) return;
        settled = true;
        try {
          socket.destroy();
        } catch {
          // ignore
        }
        resolve(items);
      };

      const socket = cfg.secure
        ? tls.connect({ host: cfg.host, port: cfg.port, rejectUnauthorized: false, timeout: 8000 })
        : net.connect({ host: cfg.host, port: cfg.port, timeout: 8000 });

      socket.setEncoding('utf8');

      const decodeQuotedPrintable = (str) => {
        const unfolded = str.replace(/=\r?\n/g, '');
        const bytes = [];
        for (let i = 0; i < unfolded.length; i++) {
          if (unfolded[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(unfolded.slice(i + 1, i + 3))) {
            bytes.push(parseInt(unfolded.slice(i + 1, i + 3), 16));
            i += 2;
          } else {
            const buf = Buffer.from(unfolded[i], 'utf8');
            for (const b of buf) bytes.push(b);
          }
        }
        return Buffer.from(bytes).toString('utf8');
      };

      const decodeRfc2047 = (str) =>
        String(str || '').replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (_m, _charset, enc, txt) => {
          try {
            if (enc.toUpperCase() === 'B') {
              return Buffer.from(txt, 'base64').toString('utf8');
            }
            return decodeQuotedPrintable(txt.replace(/_/g, ' '));
          } catch {
            return txt;
          }
        });

      const stripHtmlToText = (htmlStr) =>
        String(htmlStr || '')
          .replace(/<head[\s\S]*?<\/head>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<!--[\s\S]*?-->/g, ' ')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, '\n')
          .replace(/<[^>]+>/g, ' ');

      const cleanMimeBody = (rawBody, topEncoding = '') => {
        if (!rawBody) return '';
        let text = rawBody;

        // 1. Se for multipart MIME, extrair apenas a parte text/plain (ou fallback text/html)
        const hasMultipart = /Content-Type:\s*text\/(?:plain|html)/i.test(text);
        if (hasMultipart) {
          const extractPartByType = (mimeType) => {
            const rx = new RegExp(`Content-Type:\\s*${mimeType}[\\s\\S]*?(?=\\r?\\n--[A-Za-z0-9'()+_,-./:=?]{4,}|$)`, 'i');
            const m = text.match(rx);
            if (!m) return '';
            const part = m[0];
            const isQp = /Content-Transfer-Encoding:\s*quoted-printable/i.test(part);
            const isB64 = /Content-Transfer-Encoding:\s*base64/i.test(part);
            const splitIdx = part.search(/\r?\n\r?\n/);
            let content = splitIdx >= 0 ? part.slice(splitIdx).trim() : '';
            if (isB64) {
              try {
                content = Buffer.from(content.replace(/\s+/g, ''), 'base64').toString('utf8');
              } catch {
                // ignore
              }
            } else if (isQp) {
              content = decodeQuotedPrintable(content);
            }
            return content;
          };

          const plainContent = extractPartByType('text\\/plain');
          const htmlContent = !plainContent ? extractPartByType('text\\/html') : '';
          if (plainContent) {
            text = plainContent;
          } else if (htmlContent) {
            text = stripHtmlToText(htmlContent);
          }
        } else {
          // Corpo único (não multipart): descodificar base64 / quoted-printable e remover <style>/<head> antes das tags
          if (/base64/i.test(topEncoding)) {
            try {
              text = Buffer.from(text.replace(/\s+/g, ''), 'base64').toString('utf8');
            } catch {
              // ignore
            }
          } else if (/quoted-printable/i.test(topEncoding) || /=[0-9A-F]{2}/i.test(text)) {
            text = decodeQuotedPrintable(text);
          }
          if (/<(?:!doctype|html|head|style|body|table|div|p|span|a|img)\b/i.test(text)) {
            text = stripHtmlToText(text);
          }
        }

        // 2. Remover citações de resposta anterior (Gmail/Outlook PT e EN)
        const replyCutPatterns = [
          /\r?\n.*escreveu\s*\([^)]+\)\s*:[\s\S]*$/i,
          /\r?\nEm\s+.+escreveu\s*:[\s\S]*$/i,
          /\r?\nOn\s+.+wrote\s*:[\s\S]*$/i,
          /\r?\n-{2,}\s*Original Message\s*-{2,}[\s\S]*$/i,
        ];
        for (const rx of replyCutPatterns) {
          text = text.replace(rx, '');
        }

        // 3. Remover linhas citadas (> ...) e boundaries soltos
        text = text
          .split(/\r?\n/)
          .filter((line) => !/^\s*>/.test(line) && !/^\s*--[A-Za-z0-9_-]{8,}/.test(line))
          .join('\n')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&amp;/gi, '&')
          .replace(/[ \t]{2,}/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim()
          .slice(0, 1200);

        return text;
      };

      const extractHtmlBody = (rawBody, topContentType = '', topEncoding = '') => {
        if (!rawBody) return '';
        let htmlCandidate = '';

        // 1. Multipart (incluindo multipart/mixed -> multipart/alternative aninhado)
        if (/Content-Type:\s*text\/html/i.test(rawBody)) {
          const rx = /Content-Type:\s*text\/html[\s\S]*?(?=\r?\n--[A-Za-z0-9'()+_,-./:=?]{4,}|$)/i;
          const m = rawBody.match(rx);
          if (m) {
            const part = m[0];
            const isQp = /Content-Transfer-Encoding:\s*quoted-printable/i.test(part);
            const isB64 = /Content-Transfer-Encoding:\s*base64/i.test(part);
            const splitIdx = part.search(/\r?\n\r?\n/);
            let content = splitIdx >= 0 ? part.slice(splitIdx).trim() : '';
            if (isB64) {
              try {
                content = Buffer.from(content.replace(/\s+/g, ''), 'base64').toString('utf8');
              } catch {
                // ignore
              }
            } else if (isQp) {
              content = decodeQuotedPrintable(content);
            }
            htmlCandidate = content;
          }
        } else if (
          /text\/html/i.test(topContentType) ||
          /<(?:!doctype\s+html|html|table|div|body|style)\b/i.test(rawBody)
        ) {
          // 2. Email HTML direto (ex.: SendGrid, Google, Mailchimp sem multipart)
          let content = rawBody;
          if (/base64/i.test(topEncoding)) {
            try {
              content = Buffer.from(content.replace(/\s+/g, ''), 'base64').toString('utf8');
            } catch {
              // ignore
            }
          } else if (/quoted-printable/i.test(topEncoding) || /=[0-9A-F]{2}/i.test(content)) {
            content = decodeQuotedPrintable(content);
          }
          htmlCandidate = content;
        }

        if (!htmlCandidate) return '';
        // Sanitização básica: remover scripts e handlers inline perigosos
        return htmlCandidate
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
          .trim()
          .slice(0, 120000);
      };

      const parseFetched = (text) => {
        const items = [];
        const blocks = text.split(/\*\s+\d+\s+FETCH\s+\(/i).slice(1);
        for (const block of blocks) {
          const uidMatch = block.match(/UID\s+(\d+)/i);
          const fromMatch = block.match(/^From:\s*(.+)$/im);
          const subjectMatch = block.match(/^Subject:\s*(.+)$/im);
          const dateMatch = block.match(/^Date:\s*(.+)$/im);
          const msgIdMatch = block.match(/^Message-ID:\s*(.+)$/im);
          const ctMatch = block.match(/^Content-Type:\s*(.+)$/im);
          const cteMatch = block.match(/^Content-Transfer-Encoding:\s*(.+)$/im);

          const rawFrom = decodeRfc2047((fromMatch?.[1] || '').trim());
          const emailMatch = rawFrom.match(/<([^>]+)>/) || rawFrom.match(/([^\s<>]+@[^\s<>]+)/);
          const fromEmail = (emailMatch?.[1] || '').trim().toLowerCase();
          const fromName = rawFrom.replace(/<[^>]+>/g, '').replace(/"/g, '').trim() || fromEmail || 'Remetente';
          const cleanSubject = decodeRfc2047((subjectMatch?.[1] || 'Sem assunto').trim());
          const topContentType = (ctMatch?.[1] || '').trim();
          const topEncoding = (cteMatch?.[1] || '').trim();

          // Extrair corpo limpo (texto) + HTML de template quando existir
          let body = '';
          let htmlBody = '';
          const textPart = block.match(/BODY\[TEXT\]<0>\s*\{\d+\}\r?\n([\s\S]*?)(?:\r?\n\)|\r?\na4\s+OK)/i);
          if (textPart?.[1]) {
            body = cleanMimeBody(textPart[1], topEncoding);
            htmlBody = extractHtmlBody(textPart[1], topContentType, topEncoding);
          }

          if (fromEmail) {
            items.push({
              uid: uidMatch?.[1] || `${Date.now()}_${items.length}`,
              messageId: (msgIdMatch?.[1] || `imap_uid_${uidMatch?.[1] || items.length}`).trim(),
              fromName,
              fromEmail,
              subject: cleanSubject,
              date: dateMatch?.[1] ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
              body: body || `(Email recebido: ${cleanSubject})`,
              htmlBody,
            });
          }
        }
        return items;
      };

      socket.on('data', (chunk) => {
        raw += chunk;

        if (stage === 'greeting' && raw.includes('* OK')) {
          stage = 'login';
          raw = '';
          const u = String(cfg.auth.user).replace(/"/g, '\\"');
          const p = String(cfg.auth.pass).replace(/"/g, '\\"');
          socket.write(`a1 LOGIN "${u}" "${p}"\r\n`);
        } else if (stage === 'login' && /a1 (OK|NO|BAD)/i.test(raw)) {
          if (!/a1 OK/i.test(raw)) return finish([]);
          stage = 'select';
          raw = '';
          socket.write('a2 EXAMINE INBOX\r\n');
        } else if (stage === 'select' && /a2 (OK|NO|BAD)/i.test(raw)) {
          if (!/a2 OK/i.test(raw)) return finish([]);
          const m = raw.match(/\*\s+(\d+)\s+EXISTS/i);
          existsCount = m ? Number(m[1]) : 0;
          if (existsCount <= 0) {
            socket.write('a5 LOGOUT\r\n');
            return finish([]);
          }
          const start = Math.max(1, existsCount - limit + 1);
          stage = 'fetch';
          raw = '';
          socket.write(`a4 FETCH ${start}:${existsCount} (UID BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID CONTENT-TYPE CONTENT-TRANSFER-ENCODING)] BODY.PEEK[TEXT]<0.131072>)\r\n`);
        } else if (stage === 'fetch' && /a4 (OK|NO|BAD)/i.test(raw)) {
          const emails = /a4 OK/i.test(raw) ? parseFetched(raw) : [];
          socket.write('a5 LOGOUT\r\n');
          finish(emails);
        }
      });

      socket.on('error', () => finish([]));
      socket.on('timeout', () => finish([]));
    });
  }

  /**
   * Listener persistente IMAP IDLE (RFC 2177) para receção em tempo real (push instantâneo)
   * Reconecta automaticamente se a ligação cair ou a cada 14 minutos (limite RFC).
   */
  startInboxIdleWatcher(onNewMail) {
    if (this._idleStopped === false && this._idleSocket) return;
    this._idleStopped = false;
    let reconnectTimer = null;
    let renewTimer = null;

    const connect = () => {
      if (this._idleStopped) return;
      const cfg = this.imapConfig;
      if (!cfg?.host || !cfg?.auth?.user || !cfg?.auth?.pass) {
        reconnectTimer = setTimeout(connect, 30000);
        reconnectTimer.unref?.();
        return;
      }

      let stage = 'greeting';
      let buffer = '';
      let lastExists = null;

      const cleanup = () => {
        if (renewTimer) {
          clearTimeout(renewTimer);
          renewTimer = null;
        }
        try {
          socket.destroy();
        } catch {
          // ignore
        }
        this._idleSocket = null;
      };

      const scheduleReconnect = (delayMs = 5000) => {
        cleanup();
        if (this._idleStopped) return;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, delayMs);
        reconnectTimer.unref?.();
      };

      const socket = cfg.secure
        ? tls.connect({ host: cfg.host, port: cfg.port, rejectUnauthorized: false })
        : net.connect({ host: cfg.host, port: cfg.port });

      this._idleSocket = socket;
      socket.setEncoding('utf8');
      socket.setKeepAlive(true, 30000);

      socket.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\r\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (stage === 'greeting' && line.startsWith('* OK')) {
            stage = 'login';
            const u = String(cfg.auth.user).replace(/"/g, '\\"');
            const p = String(cfg.auth.pass).replace(/"/g, '\\"');
            socket.write(`i1 LOGIN "${u}" "${p}"\r\n`);
          } else if (stage === 'login' && /^i1 (OK|NO|BAD)/i.test(line)) {
            if (!/^i1 OK/i.test(line)) {
              scheduleReconnect(30000);
              return;
            }
            stage = 'select';
            socket.write('i2 EXAMINE INBOX\r\n');
          } else if (stage === 'select') {
            const existsMatch = line.match(/^\*\s+(\d+)\s+EXISTS/i);
            if (existsMatch) {
              lastExists = Number(existsMatch[1]);
            }
            if (/^i2 OK/i.test(line)) {
              stage = 'idle';
              socket.write('i3 IDLE\r\n');
              // Renovar IDLE a cada 12 minutos para manter sessão viva
              renewTimer = setTimeout(() => {
                try {
                  socket.write('DONE\r\n');
                } catch {
                  scheduleReconnect(2000);
                }
              }, 12 * 60 * 1000);
              renewTimer.unref?.();
            } else if (/^i2 (NO|BAD)/i.test(line)) {
              scheduleReconnect(15000);
              return;
            }
          } else if (stage === 'idle') {
            // Novo email chegou instantaneamente! (* N EXISTS ou * N RECENT)
            const existsMatch = line.match(/^\*\s+(\d+)\s+EXISTS/i);
            const recentMatch = line.match(/^\*\s+(\d+)\s+RECENT/i);
            if (existsMatch) {
              const count = Number(existsMatch[1]);
              if (lastExists === null || count > lastExists) {
                lastExists = count;
                Promise.resolve(onNewMail?.()).catch(() => {});
              } else {
                lastExists = count;
              }
            } else if (recentMatch && Number(recentMatch[1]) > 0) {
              Promise.resolve(onNewMail?.()).catch(() => {});
            } else if (/^i3 OK/i.test(line)) {
              // IDLE renovado após DONE -> reentrar em IDLE
              socket.write('i3 IDLE\r\n');
              if (renewTimer) clearTimeout(renewTimer);
              renewTimer = setTimeout(() => {
                try {
                  socket.write('DONE\r\n');
                } catch {
                  scheduleReconnect(2000);
                }
              }, 12 * 60 * 1000);
              renewTimer.unref?.();
            } else if (/^i3 (NO|BAD)/i.test(line)) {
              scheduleReconnect(20000);
              return;
            }
          }
        }
      });

      socket.on('error', () => scheduleReconnect(8000));
      socket.on('close', () => scheduleReconnect(5000));
    };

    connect();
  }
}
