export class GetHealthUseCase {
  constructor({ mailProvider, queueService, startTime }) {
    this.mailProvider = mailProvider;
    this.queueService = queueService;
    this.startTime = startTime || Date.now();
  }

  async execute() {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const smtpCheck = await this.mailProvider.verifyConnection();
    const queueMetrics = this.queueService ? await this.queueService.getMetrics() : null;

    return {
      status: 'ok',
      service: 'jogimil-forms-microservice',
      version: '2.0.0-microservice',
      architecture: 'Clean Architecture / Hexagonal (Ports & Adapters)',
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      timezone: 'Africa/Luanda (WAT / UTC+1)',
      components: {
        smtp: {
          connected: smtpCheck.ok,
          mode: smtpCheck.mode,
          message: smtpCheck.message,
        },
        queue: queueMetrics,
      },
    };
  }
}
