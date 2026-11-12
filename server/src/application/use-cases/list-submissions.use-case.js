export class ListSubmissionsUseCase {
  constructor({ submissionRepository, logger }) {
    this.submissionRepository = submissionRepository;
    this.logger = logger;
  }

  async execute({ limit = 20 } = {}) {
    const clampedLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
    const submissions = await this.submissionRepository.findRecent(clampedLimit);

    return {
      success: true,
      count: submissions.length,
      limit: clampedLimit,
      items: submissions,
    };
  }
}
