import { ValidationError } from '../errors/validation.error.js';

export const VALID_FORM_TYPES = [
  'geral',
  'contacto',
  'orcamento',
  'demonstracao',
  'suporte',
  'parceiro',
  'newsletter',
  'livechat',
  'livechat_msg',
  'custom',
  'proxy-test',
  'teste-unitario',
];

export class FormTypeVO {
  constructor(value) {
    const normalized = (value || 'geral').toLowerCase().trim();
    if (!VALID_FORM_TYPES.includes(normalized) && !normalized.startsWith('test')) {
      // Aceita tipos adicionais mas normaliza
      this.value = normalized;
    } else {
      this.value = normalized;
    }
    Object.freeze(this);
  }

  toString() {
    return this.value;
  }
}
