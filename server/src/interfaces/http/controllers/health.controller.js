export class HealthController {
  constructor({ getHealthUseCase, healthChecker }) {
    this.getHealthUseCase = getHealthUseCase;
    this.healthChecker = healthChecker;
  }

  getHealth = async (req, res, next) => {
    try {
      const data = await this.getHealthUseCase.execute();
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  getLive = async (req, res, next) => {
    try {
      const data = await this.healthChecker.getLiveness();
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  getReady = async (req, res, next) => {
    try {
      const data = await this.healthChecker.getReadiness();
      const statusCode = data.status === 'READY' ? 200 : 503;
      return res.status(statusCode).json(data);
    } catch (err) {
      next(err);
    }
  };
}
