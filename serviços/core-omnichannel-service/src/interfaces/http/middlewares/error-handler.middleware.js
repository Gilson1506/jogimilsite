import { DomainError } from '../../../domain/errors/domain.error.js';
import { ValidationError } from '../../../domain/errors/validation.error.js';

export function errorHandlerMiddleware(logger) {
  return (err, req, res, _next) => {
    const correlationId = req.correlationId;

    if (err?.type === 'entity.too.large' || err?.status === 413 || err?.statusCode === 413) {
      const msg = 'O ficheiro ou payload excede o tamanho máximo permitido (máx. 18 MB por arquivo).';
      logger.warn(`[Payload Too Large] ${err.message}`, { correlationId });
      return res.status(413).json({
        success: false,
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.11',
        title: 'Payload Too Large',
        status: 413,
        message: msg,
        detail: msg,
        correlationId,
      });
    }

    if (err?.type === 'entity.parse.failed') {
      const msg = 'Formato JSON inválido na requisição.';
      logger.warn(`[Bad JSON] ${err.message}`, { correlationId });
      return res.status(400).json({
        success: false,
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
        message: msg,
        detail: msg,
        correlationId,
      });
    }

    if (err instanceof ValidationError) {
      logger.warn(`[Validation Error] ${err.message}`, {
        correlationId,
        errors: err.errors,
      });

      return res.status(err.statusCode || 422).json({
        success: false,
        type: 'https://tools.ietf.org/html/rfc7807',
        title: 'Validation Error',
        status: err.statusCode || 422,
        message: err.message,
        detail: err.message,
        errors: err.errors,
        correlationId,
      });
    }

    if (err instanceof DomainError) {
      logger.warn(`[Domain Error] ${err.message}`, {
        correlationId,
        code: err.code,
      });

      return res.status(err.statusCode || 400).json({
        success: false,
        type: 'https://tools.ietf.org/html/rfc7807',
        title: 'Domain Error',
        code: err.code,
        status: err.statusCode || 400,
        message: err.message,
        detail: err.message,
        correlationId,
      });
    }

    logger.error(`[Unhandled Error] ${err.message}`, {
      correlationId,
      stack: err.stack,
    });

    const fallbackMsg = 'Ocorreu um erro interno no microserviço. Por favor tente novamente mais tarde.';
    return res.status(500).json({
      success: false,
      type: 'https://tools.ietf.org/html/rfc7807',
      title: 'Internal Server Error',
      status: 500,
      message: err.message || fallbackMsg,
      detail: fallbackMsg,
      correlationId,
    });
  };
}
