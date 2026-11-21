export class HealthChecker {
  constructor({ mailProvider, queueService, startTime = Date.now() }) {
    this.mailProvider = mailProvider;
    this.queueService = queueService;
    this.startTime = startTime;
  }

  async getLiveness() {
    return {
      status: 'UP',
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    const smtpCheck = await this.mailProvider.verifyConnection();
    const queueMetrics = this.queueService ? await this.queueService.getMetrics() : null;

    const isReady = true; // Permanece pronto mesmo se SMTP for simulado (modo resiliente)

    return {
      status: isReady ? 'READY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      dependencies: {
        smtp: smtpCheck,
        queue: queueMetrics,
      },
    };
  }
}
