import { ValidationError } from '../../domain/errors/validation.error.js';

export class SubmitFormDTO {
  constructor(body = {}) {
    if (!body || typeof body !== 'object') {
      throw new ValidationError('Corpo da requisição deve ser um objeto JSON.');
    }

    const { formType, formTitle, data, source, clientEmail, clientName, clientPhone } = body;

    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      throw new ValidationError('O campo "data" é obrigatório e deve conter os dados do formulário.');
    }

    this.formType = formType || 'geral';
    this.formTitle = formTitle || 'Formulário do Website';
    this.data = data;
    this.source = source || '';
    this.clientEmail = clientEmail || data.email || null;
    this.clientName = clientName || data.nome || data.name || null;
    this.clientPhone = clientPhone || data.telefone || data.phone || null;

    Object.freeze(this);
  }
}
