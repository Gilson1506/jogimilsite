import { SubmitFormDTO } from '../../../application/dtos/submit-form.dto.js';

export class FormsController {
  constructor({ submitFormUseCase, listSubmissionsUseCase }) {
    this.submitFormUseCase = submitFormUseCase;
    this.listSubmissionsUseCase = listSubmissionsUseCase;
  }

  submit = async (req, res, next) => {
    try {
      const dto = new SubmitFormDTO(req.body);
      const context = {
        correlationId: req.correlationId,
        ip: req.ip,
      };

      const result = await this.submitFormUseCase.execute(dto, context);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  listRecent = async (req, res, next) => {
    try {
      const limit = req.query.limit;
      const result = await this.listSubmissionsUseCase.execute({ limit });
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
