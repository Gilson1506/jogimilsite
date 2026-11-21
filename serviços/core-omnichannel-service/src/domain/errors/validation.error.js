import { DomainError } from './domain.error.js';

export class ValidationError extends DomainError {
  constructor(message, errors = {}) {
    super(message, 'VALIDATION_ERROR', 422);
    this.errors = errors;
  }
}
