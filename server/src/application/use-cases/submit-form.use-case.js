import { SubmissionEntity, SUBMISSION_STATUS } from '../../domain/entities/submission.entity.js';
import { FormSubmittedEvent } from '../../domain/events/form-submitted.event.js';

export class SubmitFormUseCase {
  constructor({ submissionRepository, queueService, mailProvider, logger }) {
    this.submissionRepository = submissionRepository;
    this.queueService = queueService;
    this.mailProvider = mailProvider;
    this.logger = logger;
  }

  async execute(dto, context = {}) {
    const { correlationId } = context;
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Criar entidade de domínio
    const submission = new SubmissionEntity({
      id: submissionId,
      formType: dto.formType,
      formTitle: dto.formTitle,
      data: dto.data,
      source: dto.source,
      clientEmail: dto.clientEmail,
      clientName: dto.clientName,
      clientPhone: dto.clientPhone,
      correlationId,
      status: SUBMISSION_STATUS.RECEIVED,
    });

    // 2. Persistir no repositório de dados (garantia de registo antes de qualquer I/O de rede)
    await this.submissionRepository.save(submission);
    this.logger.info(`[SubmitFormUseCase] Submissão ${submissionId} persistida com sucesso.`, {
      submissionId,
      correlationId,
      formType: submission.formType.toString(),
    });

    // 3. Emitir evento e enfileirar job assíncrono para notificação por email
    const event = new FormSubmittedEvent({
      submissionId,
      formType: submission.formType.toString(),
      formTitle: submission.formTitle,
      payload: submission.toJSON(),
      correlationId,
    });

    if (this.queueService) {
      await this.queueService.enqueue('send-email-notification', {
        submission: submission.toJSON(),
        correlationId,
      });
      submission.markAsQueued();
      await this.submissionRepository.updateStatus(submissionId, submission.status);
    } else {
      // Fallback síncrono caso fila não esteja ativa
      try {
        const result = await this.mailProvider.send({
          submission: submission.toJSON(),
          correlationId,
        });
        submission.markAsDispatched(result);
        await this.submissionRepository.updateStatus(submissionId, submission.status, submission.metadata);
      } catch (err) {
        submission.markAsFailed(err);
        await this.submissionRepository.updateStatus(submissionId, submission.status, submission.metadata);
      }
    }

    return {
      success: true,
      id: submissionId,
      status: submission.status,
      message: 'Pedido registado com sucesso pela equipa da JOGIMIL.',
      correlationId,
      client: {
        name: submission.clientName,
        email: submission.clientEmail,
      },
    };
  }
}
