import { Request, Response } from 'express';
import { GetHealthReport } from '../../use-cases/GetHealthReport';

export class HealthController {
  constructor(private getHealthReport: GetHealthReport) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const report = await this.getHealthReport.execute();
      res.status(report.status === 'OK' ? 200 : 500).json(report);
    } catch (error: any) {
      res.status(500).json({
        status: 'ERROR',
        error: error.message || 'Error interno del servidor'
      });
    }
  }
}
