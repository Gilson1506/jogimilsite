import { EmailVO } from '../value-objects/email.vo.js';
import { PhoneVO } from '../value-objects/phone.vo.js';
import { FormTypeVO } from '../value-objects/form-type.vo.js';
import { ValidationError } from '../errors/validation.error.js';

export const SUBMISSION_STATUS = {
  RECEIVED: 'RECEIVED',
  QUEUED: 'QUEUED',
  DISPATCHED: 'DISPATCHED',
  FAILED: 'FAILED',
};

export class SubmissionEntity {
  constructor({
    id,
    formType,
    formTitle,
    data,
    source,
    clientEmail,
    clientName,
    clientPhone,
    status = SUBMISSION_STATUS.RECEIVED,
    receivedAt,
    dispatchedAt = null,
    correlationId = null,
    metadata = {},
  }) {
    if (!id) {
      throw new ValidationError('ID da submissão é obrigatório.');
    }
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Dados da submissão são obrigatórios.');
    }

    this.id = id;
    this.formType = new FormTypeVO(formType);
    this.formTitle = formTitle || 'Novo Contacto';
    this.data = data;
    this.source = source || 'Website JOGIMIL';
    
    // Tratamento de email do cliente (opcional mas validado se fornecido)
    const rawEmail = clientEmail || data.email;
    this.clientEmail = rawEmail ? new EmailVO(rawEmail).toString() : null;

    // Tratamento de telefone
    const rawPhone = clientPhone || data.telefone || data.phone;
    this.clientPhone = rawPhone ? new PhoneVO(rawPhone).toString() : null;

    this.clientName = clientName || data.nome || data.name || null;
    this.status = status;
    this.receivedAt = receivedAt || new Date().toISOString();
    this.dispatchedAt = dispatchedAt;
    this.correlationId = correlationId;
    this.metadata = metadata;
  }

  markAsQueued() {
    this.status = SUBMISSION_STATUS.QUEUED;
  }

  markAsDispatched(result = {}) {
    this.status = SUBMISSION_STATUS.DISPATCHED;
    this.dispatchedAt = new Date().toISOString();
    this.metadata = { ...this.metadata, dispatchResult: result };
  }

  markAsFailed(error) {
    this.status = SUBMISSION_STATUS.FAILED;
    this.metadata = { ...this.metadata, lastError: error?.message || String(error) };
  }

  toJSON() {
    return {
      id: this.id,
      formType: this.formType.toString(),
      formTitle: this.formTitle,
      clientName: this.clientName,
      clientEmail: this.clientEmail,
      clientPhone: this.clientPhone,
      data: this.data,
      source: this.source,
      status: this.status,
      receivedAt: this.receivedAt,
      dispatchedAt: this.dispatchedAt,
      correlationId: this.correlationId,
      metadata: this.metadata,
    };
  }
}
