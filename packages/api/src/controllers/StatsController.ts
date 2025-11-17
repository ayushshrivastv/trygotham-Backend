import { Request, Response, NextFunction } from 'express';
import { StatsService } from '../services/StatsService';

export class StatsController {
  private statsService: StatsService;

  constructor() {
    this.statsService = new StatsService();
  }

  getCensusStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { censusId } = req.params;
      const stats = await this.statsService.getCensusStats(censusId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getGlobalStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.statsService.getGlobalStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getAgeDistribution = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { censusId } = req.params;
      const distribution = await this.statsService.getAgeDistribution(censusId);

      res.json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      next(error);
    }
  };

  getLocationDistribution = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { censusId } = req.params;
      const distribution = await this.statsService.getLocationDistribution(censusId);

      res.json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      next(error);
    }
  };
}
