export class FormSubmittedEvent {
  constructor({ submissionId, formType, formTitle, payload, timestamp, correlationId }) {
    this.eventName = 'FormSubmittedEvent';
    this.submissionId = submissionId;
    this.formType = formType;
    this.formTitle = formTitle;
    this.payload = payload;
    this.timestamp = timestamp || new Date().toISOString();
    this.correlationId = correlationId;
    Object.freeze(this);
  }
}
