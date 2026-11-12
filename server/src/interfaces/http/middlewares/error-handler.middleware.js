import { DomainError } from '../../../domain/errors/domain.error.js';
import { ValidationError } from '../../../domain/errors/validation.error.js';

export function errorHandlerMiddleware(logger) {
  return (err, req, res, _next) => {
    const correlationId = req.correlationId;

    if (err instanceof ValidationError) {
      logger.warn(`[Validation Error] ${err.message}`, {
        correlationId,
        errors: err.errors,
      });

      return res.status(err.statusCode || 422).json({
        type: 'https://tools.ietf.org/html/rfc7807',
        title: 'Validation Error',
        status: err.statusCode || 422,
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
        type: 'https://tools.ietf.org/html/rfc7807',
        title: 'Domain Error',
        code: err.code,
        status: err.statusCode || 400,
        detail: err.message,
        correlationId,
      });
    }

    logger.error(`[Unhandled Error] ${err.message}`, {
      correlationId,
      stack: err.stack,
    });

    return res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7807',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Ocorreu um erro interno no microserviço. Por favor tente novamente mais tarde.',
      correlationId,
    });
  };
}
