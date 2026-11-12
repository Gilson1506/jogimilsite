import { ENV, isSmtpConfigured } from './infrastructure/config/env.config.js';
import { StructuredLogger } from './infrastructure/logging/structured-logger.js';
import { JsonlSubmissionRepository } from './infrastructure/persistence/jsonl-submission.repository.js';
import { NodemailerAdapter } from './infrastructure/mail/nodemailer.adapter.js';
import { InMemoryJobQueue } from './infrastructure/queue/in-memory-job.queue.js';
import { HealthChecker } from './infrastructure/monitoring/health-checker.js';

import { SubmitFormUseCase } from './application/use-cases/submit-form.use-case.js';
import { ListSubmissionsUseCase } from './application/use-cases/list-submissions.use-case.js';
import { GetHealthUseCase } from './application/use-cases/get-health.use-case.js';

import { FormsController } from './interfaces/http/controllers/forms.controller.js';
import { HealthController } from './interfaces/http/controllers/health.controller.js';
import { AdminController } from './interfaces/http/controllers/admin.controller.js';
import { AdminRepository } from './infrastructure/persistence/admin.repository.js';
import { EvolutionService } from './infrastructure/services/evolution.service.js';
import { EmailCenterService } from './infrastructure/mail/email-center.service.js';
import { createApp } from './interfaces/http/app.js';
import { startServer } from './interfaces/http/server.js';

const startTime = Date.now();

// 1. Instanciar infraestrutura base
const logger = new StructuredLogger(ENV.SERVICE_NAME);
const submissionRepository = new JsonlSubmissionRepository(ENV.SUBMISSIONS_FILE);
const mailProvider = new NodemailerAdapter({ logger });
const queueService = new InMemoryJobQueue({ logger, maxRetries: 3 });
const healthChecker = new HealthChecker({ mailProvider, queueService, startTime });

// 1.1 Serviços do Centro Omnicanal & Painel Admin
const adminRepository = new AdminRepository();
const evolutionService = new EvolutionService({ logger });
const emailCenterService = new EmailCenterService({ mailProvider, logger });

// 2. Registar worker assíncrono para notificações de email na fila
queueService.registerWorker('send-email-notification', async (payload) => {
  const { submission, correlationId } = payload;
  logger.info(`[Worker] A processar envio de email para submissão ${submission.id}...`, {
    submissionId: submission.id,
    correlationId,
  });

  try {
    const result = await mailProvider.send({ submission, correlationId });
    await submissionRepository.updateStatus(submission.id, 'DISPATCHED', { dispatchResult: result });
    logger.info(`[Worker] Email para submissão ${submission.id} despachado com sucesso.`, {
      submissionId: submission.id,
      correlationId,
    });
  } catch (err) {
    logger.error(`[Worker] Falha no processamento de email para ${submission.id}: ${err.message}`, {
      submissionId: submission.id,
      correlationId,
      error: err.message,
    });
    await submissionRepository.updateStatus(submission.id, 'FAILED', { error: err.message });
    throw err; // Lança para ativar mecanismo de retry com backoff
  }
});

// 3. Instanciar Casos de Uso (Application Layer)
const submitFormUseCase = new SubmitFormUseCase({
  submissionRepository,
  queueService,
  mailProvider,
  logger,
});

const listSubmissionsUseCase = new ListSubmissionsUseCase({
  submissionRepository,
  logger,
});

const getHealthUseCase = new GetHealthUseCase({
  mailProvider,
  queueService,
  startTime,
});

// 4. Instanciar Controladores (Interfaces Layer)
const formsController = new FormsController({
  submitFormUseCase,
  listSubmissionsUseCase,
});

const healthController = new HealthController({
  getHealthUseCase,
  healthChecker,
});

const adminController = new AdminController({
  adminRepository,
  evolutionService,
  emailCenterService,
  listSubmissionsUseCase,
  logger,
});

// 5. Montar aplicação Express
const app = createApp({
  formsController,
  healthController,
  adminController,
  logger,
});

// 6. Iniciar Servidor
startServer({
  app,
  port: ENV.PORT,
  host: ENV.HOST,
  logger,
  queueService,
});

// Banner de Inicialização
console.log('='.repeat(64));
console.log('  JOGIMIL - TECNOLOGIAS, LDA.');
console.log('  Notification & Forms Ingestion Microservice (v2.0)');
console.log('  Arquitetura: Clean Architecture / Hexagonal (Ports & Adapters)');
console.log('='.repeat(64));
console.log(`  Porta:           ${ENV.PORT}`);
console.log(`  Healthcheck:     http://localhost:${ENV.PORT}/health`);
console.log(`  Liveness:        http://localhost:${ENV.PORT}/health/live`);
console.log(`  Readiness:       http://localhost:${ENV.PORT}/health/ready`);
console.log(`  API v1 Submit:   http://localhost:${ENV.PORT}/api/v1/forms/submit`);
console.log(`  Destino:         ${ENV.DESTINATION_EMAIL}`);
console.log(`  Servidor SMTP:   ${ENV.SMTP.host}:${ENV.SMTP.port} (SSL/TLS: ${ENV.SMTP.secure ? 'SIM' : 'NÃO'})`);
console.log(`  Utilizador SMTP: ${ENV.SMTP.auth.user}`);
console.log(`  SMTP Ativo:      ${isSmtpConfigured ? 'SIM (Autenticado)' : 'NÃO (Aguardando SMTP_PASS / Simulação Resiliente)'}`);
console.log(`  Job Queue:       Ativa (In-Memory com Exponential Backoff & Retries)`);
console.log('='.repeat(64));
