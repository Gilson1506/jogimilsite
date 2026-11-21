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
import { AdminController } from '../src/interfaces/http/controllers/admin.controller.js';
import { AdminRepository } from '../src/infrastructure/persistence/admin.repository.js';
import { AnalyticsRepository } from '../src/infrastructure/persistence/analytics.repository.js';
import { EvolutionService } from '../src/infrastructure/services/evolution.service.js';
import { EmailCenterService } from '../src/infrastructure/mail/email-center.service.js';

const TEST_PORT = 3998;

const logger = new StructuredLogger('test-logger');
const submissionRepository = new JsonlSubmissionRepository('./data/test-submissions.jsonl');
const mailProvider = new NodemailerAdapter({ logger });
const queueService = new InMemoryJobQueue({ logger });
const healthChecker = new HealthChecker({ mailProvider, queueService });

queueService.registerWorker('send-email-notification', async () => {
  return { success: true };
});

const adminRepository = new AdminRepository();

const submitFormUseCase = new SubmitFormUseCase({
  submissionRepository,
  adminRepository,
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

const analyticsRepository = new AnalyticsRepository('./data/test-visits.jsonl');
const evolutionService = new EvolutionService({ logger });
const emailCenterService = new EmailCenterService({ mailProvider, logger });

const adminController = new AdminController({
  adminRepository,
  analyticsRepository,
  evolutionService,
  emailCenterService,
  listSubmissionsUseCase,
  logger,
});

const healthController = new HealthController({
  getHealthUseCase,
  healthChecker,
});

const app = createApp({
  formsController,
  healthController,
  adminController,
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

    // 7. Teste de Monitoramento de Visitas (Portal -> Analytics -> Admin)
    const resVisit = await fetch(`http://localhost:${TEST_PORT}/api/v1/analytics/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: 'servicos',
        path: '#/servicos',
        visitorId: 'vis_test_1',
        sessionId: 'sess_test_1',
        screen: '1920x1080',
      }),
    });
    assert.strictEqual(resVisit.status, 201);

    const resAnalytics = await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/analytics/visits?period=7d`);
    assert.strictEqual(resAnalytics.status, 200);
    const jsonAnalytics = await resAnalytics.json();
    assert.strictEqual(jsonAnalytics.success, true);
    assert.ok(jsonAnalytics.summary.totalVisits >= 1);
    assert.ok(Array.isArray(jsonAnalytics.timeline));
    console.log('✓ Monitoramento de visitas e analytics do Admin validado.');

    // 8. Teste de Sincronização Automática de Formulários do Portal -> Admin (Submissions, Contacts, Support, CRM)
    const [resSubs, resAdminContacts, resAdminSupport, resAdminDeals] = await Promise.all([
      fetch(`http://localhost:${TEST_PORT}/api/v1/admin/submissions?limit=10`),
      fetch(`http://localhost:${TEST_PORT}/api/v1/admin/contacts`),
      fetch(`http://localhost:${TEST_PORT}/api/v1/admin/support`),
      fetch(`http://localhost:${TEST_PORT}/api/v1/admin/crm/deals`),
    ]);
    assert.strictEqual(resSubs.status, 200);
    assert.strictEqual(resAdminContacts.status, 200);
    assert.strictEqual(resAdminSupport.status, 200);
    assert.strictEqual(resAdminDeals.status, 200);
    const jsonSubs = await resSubs.json();
    const jsonAdminContacts = await resAdminContacts.json();
    assert.ok(jsonSubs.submissions.length >= 2);
    assert.ok(jsonAdminContacts.contacts.some((c) => c.email === 'manuel.bento@jogimil.ao'));
    console.log('✓ Sincronização automática de formulários do portal para o Admin validada.');

    // 9. Biblioteca Interna + Templates HTML + Anexos (Suporte, Envio Direto e Agendamento)
    let capturedMail = null;
    let shouldFailSmtp = false;
    mailProvider.transporter = {
      sendMail: async (mailOptions) => {
        if (shouldFailSmtp) {
          const err = new Error('Simulated SMTP rejection');
          err.code = 'EAUTH';
          throw err;
        }
        capturedMail = mailOptions;
        return { messageId: `mock_${Date.now()}` };
      },
    };

    // 9.1 Upload na biblioteca interna
    const samplePdfContent = '%PDF-1.4\nTest Biblioteca Interna JOGIMIL\n';
    const sampleDataUrl = `data:application/pdf;charset=utf-8;base64,${Buffer.from(samplePdfContent, 'utf8').toString('base64')}`;
    const resUpload = await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Proposta Teste Biblioteca',
        fileName: 'proposta-teste.pdf',
        category: 'propostas',
        mimeType: 'application/pdf',
        size: Buffer.byteLength(samplePdfContent),
        dataBase64: sampleDataUrl,
      }),
    });
    assert.strictEqual(resUpload.status, 201);
    const jsonUpload = await resUpload.json();
    assert.strictEqual(jsonUpload.success, true);
    const uploadedFile = jsonUpload.file;
    assert.ok(uploadedFile?.id);
    assert.strictEqual(uploadedFile.fileType, 'pdf');

    // Criar ticket dedicado para o teste de suporte
    const testTicket = await adminRepository.createSupportTicket({
      clientName: 'Cliente Teste Biblioteca',
      clientContact: 'teste-biblioteca@jogimil.ao',
      clientEmail: 'teste-biblioteca@jogimil.ao',
      channel: 'email',
      subject: 'Pedido com Template e Biblioteca',
      messages: [],
    });

    // 9.2 Envio em suporte combinando template HTML + digitalFileId (sem dataUrl)
    const templateHtml = '<html><body><h1>JOGIMIL</h1><p>Template HTML Oficial</p></body></html>';
    const resSupportSend = await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/support/${testTicket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'email',
        sender: 'agent',
        to: 'teste-biblioteca@jogimil.ao',
        subject: 'Proposta com Template JOGIMIL',
        content: 'Segue em anexo a proposta.',
        html: templateHtml,
        attachments: [
          {
            name: uploadedFile.fileName,
            type: uploadedFile.mimeType,
            size: uploadedFile.size,
            digitalFileId: uploadedFile.id,
          },
        ],
      }),
    });
    assert.strictEqual(resSupportSend.status, 201);
    const jsonSupportSend = await resSupportSend.json();
    assert.strictEqual(jsonSupportSend.success, true);
    assert.strictEqual(jsonSupportSend.delivery?.success, true);
    assert.ok(capturedMail);
    assert.ok(capturedMail.html.includes('Template HTML Oficial'));
    assert.strictEqual(capturedMail.text, 'Segue em anexo a proposta.');
    assert.strictEqual(capturedMail.attachments.length, 1);
    assert.ok(Buffer.isBuffer(capturedMail.attachments[0].content));
    assert.strictEqual(capturedMail.attachments[0].content.toString('utf8'), samplePdfContent);
    assert.strictEqual(capturedMail.attachments[0].filename, 'proposta-teste.pdf');
    assert.strictEqual(capturedMail.attachments[0].contentType, 'application/pdf');

    const resTicketsAfterOk = await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/support`);
    const jsonTicketsAfterOk = await resTicketsAfterOk.json();
    const ticketAfterOk = jsonTicketsAfterOk.tickets.find((t) => t.id === testTicket.id);
    assert.strictEqual(ticketAfterOk.messages.length, 1);
    assert.strictEqual(ticketAfterOk.messages[0].subject, 'Proposta com Template JOGIMIL');
    assert.strictEqual(ticketAfterOk.messages[0].attachments.length, 1);
    assert.strictEqual(ticketAfterOk.messages[0].attachments[0].digitalFileId, uploadedFile.id);
    assert.strictEqual(ticketAfterOk.messages[0].attachments[0].dataUrl, undefined);

    let filesListJson = await (await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/files`)).json();
    assert.strictEqual(filesListJson.files.find((f) => f.id === uploadedFile.id).sendCount, 1);
    console.log('✓ Envio no Atendimento com Template HTML + Biblioteca (digitalFileId) validado.');

    // 9.3 Falha controlada de SMTP: retorna 502, NÃO salva mensagem falsa e NÃO incrementa sendCount
    shouldFailSmtp = true;
    const resSupportFail = await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/support/${testTicket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'email',
        sender: 'agent',
        to: 'teste-biblioteca@jogimil.ao',
        subject: 'Tentativa Falhada',
        content: 'Mensagem que não deve ir para o histórico.',
        html: templateHtml,
        attachments: [{ name: uploadedFile.fileName, type: uploadedFile.mimeType, size: uploadedFile.size, digitalFileId: uploadedFile.id }],
      }),
    });
    assert.strictEqual(resSupportFail.status, 502);
    const jsonSupportFail = await resSupportFail.json();
    assert.strictEqual(jsonSupportFail.success, false);
    assert.ok(jsonSupportFail.message.includes('Simulated SMTP rejection'));

    const jsonTicketsAfterFail = await (await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/support`)).json();
    const ticketAfterFail = jsonTicketsAfterFail.tickets.find((t) => t.id === testTicket.id);
    assert.strictEqual(ticketAfterFail.messages.length, 1);

    filesListJson = await (await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/files`)).json();
    assert.strictEqual(filesListJson.files.find((f) => f.id === uploadedFile.id).sendCount, 1);
    console.log('✓ Falha controlada SMTP sem falso positivo no histórico validada.');

    // 9.4 Anexo inexistente da biblioteca retorna 422 com mensagem clara
    shouldFailSmtp = false;
    const resMissingFile = await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/support/${testTicket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'email',
        sender: 'agent',
        to: 'teste-biblioteca@jogimil.ao',
        subject: 'Anexo Inexistente',
        content: 'Teste anexo inexistente.',
        attachments: [{ name: 'fantasma.pdf', type: 'application/pdf', size: 100, digitalFileId: 'file_inexistente_999' }],
      }),
    });
    assert.strictEqual(resMissingFile.status, 422);
    const jsonMissingFile = await resMissingFile.json();
    assert.strictEqual(jsonMissingFile.success, false);
    console.log('✓ Rejeição 422 para anexo inexistente na biblioteca validada.');

    // 9.5 Envio direto com template HTML + retry de agendamento com status failed
    capturedMail = null;
    const resDirectSend = await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/files/${uploadedFile.id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'email',
        to: 'cliente-direto@jogimil.ao',
        subject: 'Envio Direto com Template',
        message: 'Corpo envio direto',
        html: '<html><body><p>Template Direto Biblioteca</p></body></html>',
      }),
    });
    assert.strictEqual(resDirectSend.status, 200);
    const jsonDirectSend = await resDirectSend.json();
    assert.strictEqual(jsonDirectSend.success, true);
    assert.ok(capturedMail.html.includes('Template Direto Biblioteca'));
    assert.strictEqual(capturedMail.attachments.length, 1);

    filesListJson = await (await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/files`)).json();
    assert.strictEqual(filesListJson.files.find((f) => f.id === uploadedFile.id).sendCount, 2);

    const resSchedule = await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/support/${testTicket.id}/schedule-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'teste-biblioteca@jogimil.ao',
        subject: 'Agendamento Teste',
        content: 'Conteúdo agendado',
        html: '<html><body><p>Template Agendado</p></body></html>',
        attachments: [{ name: uploadedFile.fileName, type: uploadedFile.mimeType, size: uploadedFile.size, digitalFileId: uploadedFile.id }],
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        syncToCalendar: false,
      }),
    });
    assert.strictEqual(resSchedule.status, 201);
    const jsonSchedule = await resSchedule.json();
    const scheduleId = jsonSchedule.scheduled.id;

    // Simular falha no primeiro disparo agendado -> status 'failed'
    shouldFailSmtp = true;
    const resSchedFail = await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/support/scheduled-emails/${scheduleId}/send-now`, {
      method: 'POST',
    });
    assert.strictEqual(resSchedFail.status, 502);
    const jsonSchedFail = await resSchedFail.json();
    assert.strictEqual(jsonSchedFail.success, false);
    assert.strictEqual(jsonSchedFail.scheduled.status, 'failed');

    // Reenviar agendamento com status 'failed' -> agora deve enviar ('sent')
    shouldFailSmtp = false;
    capturedMail = null;
    const resSchedRetry = await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/support/scheduled-emails/${scheduleId}/send-now`, {
      method: 'POST',
    });
    assert.strictEqual(resSchedRetry.status, 200);
    const jsonSchedRetry = await resSchedRetry.json();
    assert.strictEqual(jsonSchedRetry.success, true);
    assert.strictEqual(jsonSchedRetry.scheduled.status, 'sent');
    assert.ok(capturedMail.html.includes('Template Agendado'));
    assert.strictEqual(capturedMail.attachments.length, 1);

    filesListJson = await (await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/files`)).json();
    assert.strictEqual(filesListJson.files.find((f) => f.id === uploadedFile.id).sendCount, 3);
    console.log('✓ Envio direto com template e retry de agendamento failed validados.');

    // Limpeza dos dados de teste criados
    await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/support/scheduled-emails/${scheduleId}`, { method: 'DELETE' });
    await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/files/${uploadedFile.id}`, { method: 'DELETE' });
    await fetch(`http://localhost:${TEST_PORT}/api/v1/admin/support/${testTicket.id}`, { method: 'DELETE' });

    console.log('\n============================================================');
    console.log(' TODOS OS TESTES DA ARQUITETURA DE MICROSERVIÇO PASSARAM!');
    console.log('============================================================\n');

    server.close(() => process.exit(0));
  } catch (err) {
    console.error('❌ Falha nos testes:', err);
    server.close(() => process.exit(1));
  }
});
