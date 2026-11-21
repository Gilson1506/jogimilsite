import { ValidationError } from '../errors/validation.error.js';

export class EmailVO {
  static EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Email é obrigatório e deve ser uma string.');
    }

    const trimmed = value.trim().toLowerCase();
    if (!EmailVO.EMAIL_REGEX.test(trimmed)) {
      throw new ValidationError(`Email inválido: "${value}"`);
    }

    this.value = trimmed;
    Object.freeze(this);
  }

  toString() {
    return this.value;
  }

  equals(other) {
    return other instanceof EmailVO && this.value === other.value;
  }
}
