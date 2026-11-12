import { ILogger } from '../../application/ports/logger.port.js';
import { ENV } from '../config/env.config.js';

export class StructuredLogger extends ILogger {
  constructor(serviceName = ENV.SERVICE_NAME) {
    super();
    this.serviceName = serviceName;
  }

  _log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const correlationId = meta.correlationId || '-';

    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      correlationId,
      message,
      ...meta,
    };

    const color = {
      INFO: '\x1b[36m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
      DEBUG: '\x1b[90m',
    }[level] || '\x1b[0m';
    const reset = '\x1b[0m';

    if (ENV.NODE_ENV === 'development') {
      const cidTag = correlationId !== '-' ? `[cid:${correlationId.substring(0, 8)}]` : '';
      console.log(`${color}[${level}]${reset} ${timestamp} ${cidTag} ${message}`);
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  info(message, meta = {}) {
    this._log('INFO', message, meta);
  }

  warn(message, meta = {}) {
    this._log('WARN', message, meta);
  }

  error(message, meta = {}) {
    this._log('ERROR', message, meta);
  }

  debug(message, meta = {}) {
    if (ENV.NODE_ENV === 'development') {
      this._log('DEBUG', message, meta);
    }
  }
}
