import { IQueuePort } from '../../application/ports/queue.port.js';

export class InMemoryJobQueue extends IQueuePort {
  constructor({ logger, maxRetries = 3 } = {}) {
    super();
    this.logger = logger;
    this.maxRetries = maxRetries;
    this.workers = new Map();
    this.queue = [];
    this.processing = false;
    this.metrics = {
      enqueued: 0,
      processed: 0,
      failed: 0,
      retried: 0,
    };
  }

  registerWorker(jobName, handler) {
    this.workers.set(jobName, handler);
    if (this.logger) {
      this.logger.debug(`[JobQueue] Worker registado para job: "${jobName}"`);
    }
  }

  async enqueue(jobName, payload, options = {}) {
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: jobName,
      payload,
      attempts: 0,
      maxRetries: options.maxRetries || this.maxRetries,
      createdAt: Date.now(),
    };

    this.queue.push(job);
    this.metrics.enqueued++;

    if (this.logger) {
      this.logger.debug(`[JobQueue] Job enfileirado: ${job.id} (${jobName})`);
    }

    // Disparar processamento sem bloquear quem enfileirou
    setImmediate(() => this._processNext());
    return job.id;
  }

  async _processNext() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const job = this.queue.shift();

    const worker = this.workers.get(job.name);
    if (!worker) {
      if (this.logger) {
        this.logger.error(`[JobQueue] Nenhum worker registrado para o job "${job.name}"`);
      }
      this.metrics.failed++;
      this.processing = false;
      return setImmediate(() => this._processNext());
    }

    job.attempts++;

    try {
      await worker(job.payload);
      this.metrics.processed++;
      if (this.logger) {
        this.logger.debug(`[JobQueue] Job ${job.id} concluído com sucesso.`);
      }
    } catch (err) {
      if (job.attempts < job.maxRetries) {
        this.metrics.retried++;
        const backoffMs = Math.pow(2, job.attempts) * 1000;
        if (this.logger) {
          this.logger.warn(`[JobQueue] Falha no job ${job.id} (tentativa ${job.attempts}/${job.maxRetries}). Nova tentativa em ${backoffMs}ms...`);
        }
        setTimeout(() => {
          this.queue.push(job);
          this._processNext();
        }, backoffMs);
      } else {
        this.metrics.failed++;
        if (this.logger) {
          this.logger.error(`[JobQueue] Job ${job.id} falhou definitivamente após ${job.attempts} tentativas: ${err.message}`);
        }
      }
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this._processNext());
      }
    }
  }

  async getMetrics() {
    return {
      pending: this.queue.length,
      ...this.metrics,
    };
  }

  async drain() {
    while (this.queue.length > 0 || this.processing) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}
