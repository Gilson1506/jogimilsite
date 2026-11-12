export class IQueuePort {
  async enqueue(jobName, payload, options = {}) {
    throw new Error('Method not implemented: enqueue');
  }

  registerWorker(jobName, handler) {
    throw new Error('Method not implemented: registerWorker');
  }

  async getMetrics() {
    throw new Error('Method not implemented: getMetrics');
  }
}
