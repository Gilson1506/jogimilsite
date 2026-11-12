import assert from 'node:assert';
import { createApp } from '../src/interfaces/http/app.js';
import { StructuredLogger } from '../src/infrastructure/logging/structured-logger.js';
import { JsonlSubmissionRepository } from '../src/infrastructure/persistence/jsonl-submission.repository.js';
import { NodemailerAdapter } from '../src/infrastructure/mail/nodemailer.adapter.js';
import { InMemoryJobQueue } from '../src/infrastructure/queue/in-memory-job.queue.js';
import { HealthChecker } from '../src/infrastructure/monitoring/health-checker.js';
import { SubmitFormUseCase } from '../src/application/use-cases/submit-form.use-case.js';
import { ListSubmissionsUseCase } from '../src/application/use-cases/list-submissions.use-case.js';
import { GetHealthUseCase } from '../src/application/use-cases/get-health.use-case.js';
import { FormsController } from '../src/interfaces/http/controllers/forms.controller.js';
import { HealthController } from '../src/interfaces/http/controllers/health.controller.js';

const TEST_PORT = 3998;

const logger = new StructuredLogger('test-logger');
const submissionRepository = new JsonlSubmissionRepository('./data/test-submissions.jsonl');
const mailProvider = new NodemailerAdapter({ logger });
const queueService = new InMemoryJobQueue({ logger });
const healthChecker = new HealthChecker({ mailProvider, queueService });

queueService.registerWorker('send-email-notification', async () => {
  return { success: true };
});

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
});

const formsController = new FormsController({
  submitFormUseCase,
  listSubmissionsUseCase,
});

const healthController = new HealthController({
  getHealthUseCase,
  healthChecker,
});

const app = createApp({
  formsController,
  healthController,
  logger,
});

const server = app.listen(TEST_PORT, async () => {
  console.log(`[Test Suite] Servidor de teste a correr na porta ${TEST_PORT}`);

  try {
    // 1. Health checks
    const resHealth = await fetch(`http://localhost:${TEST_PORT}/health`);
    assert.strictEqual(resHealth.status, 200);
    const healthJson = await resHealth.json();
    assert.strictEqual(healthJson.status, 'ok');
    assert.strictEqual(healthJson.architecture, 'Clean Architecture / Hexagonal (Ports & Adapters)');
    console.log('✓ Health check validado.');

    // 2. Liveness & Readiness Probes
    const resLive = await fetch(`http://localhost:${TEST_PORT}/health/live`);
    assert.strictEqual(resLive.status, 200);
    const resReady = await fetch(`http://localhost:${TEST_PORT}/health/ready`);
    assert.strictEqual(resReady.status, 200);
    console.log('✓ Liveness e Readiness probes validados.');

    // 3. Submissão v1 com Correlation ID
    const customCorrelationId = 'test-trace-12345';
    const resSubmitV1 = await fetch(`http://localhost:${TEST_PORT}/api/v1/forms/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': customCorrelationId,
      },
      body: JSON.stringify({
        formType: 'orcamento',
        formTitle: 'Pedido de Orçamento Teste',
        data: {
          nome: 'Eng. Manuel Bento',
          email: 'manuel.bento@jogimil.ao',
          tipo: 'Desenvolvimento Web',
        },
        source: 'http://localhost/test',
      }),
    });
    assert.strictEqual(resSubmitV1.status, 200);
    const jsonSubmitV1 = await resSubmitV1.json();
    assert.strictEqual(jsonSubmitV1.success, true);
    assert.strictEqual(jsonSubmitV1.correlationId, customCorrelationId);
    assert.ok(jsonSubmitV1.id.startsWith('sub_'));
    console.log('✓ Submissão v1 com Correlation ID validada.');

    // 4. Teste de Validação de Domínio (422)
    const resInvalid = await fetch(`http://localhost:${TEST_PORT}/api/v1/forms/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(resInvalid.status, 422);
    console.log('✓ Tratamento de erro 422 de validação validado.');

    // 5. Teste de Retrocompatibilidade Legada (/api/forms/submit)
    const resLegacy = await fetch(`http://localhost:${TEST_PORT}/api/forms/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formType: 'newsletter',
        formTitle: 'Subscrição Newsletter',
        data: { email: 'cliente@empresa.ao' },
      }),
    });
    assert.strictEqual(resLegacy.status, 200);
    console.log('✓ Retrocompatibilidade de endpoint legado (/api/forms/submit) validada.');

    // 6. Teste de Consulta de Submissões Recentes
    const resRecent = await fetch(`http://localhost:${TEST_PORT}/api/v1/forms/recent?limit=5`);
    assert.strictEqual(resRecent.status, 200);
    const jsonRecent = await resRecent.json();
    assert.strictEqual(jsonRecent.success, true);
    assert.ok(jsonRecent.items.length >= 2);
    console.log('✓ Listagem de submissões recentes validada.');

    console.log('\n============================================================');
    console.log(' TODOS OS TESTES DA ARQUITETURA DE MICROSERVIÇO PASSARAM!');
    console.log('============================================================\n');

    server.close(() => process.exit(0));
  } catch (err) {
    console.error('❌ Falha nos testes:', err);
    server.close(() => process.exit(1));
  }
});
