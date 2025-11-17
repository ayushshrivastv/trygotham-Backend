import { Request, Response, NextFunction } from 'express';
import { CensusService } from '../services/CensusService';
import { CreateCensusConfig } from '@zk-census/types';

export class CensusController {
  private censusService: CensusService;

  constructor() {
    this.censusService = new CensusService();
  }

  createCensus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config: CreateCensusConfig = req.body;
      const result = await this.censusService.createCensus(config);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getCensus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { censusId } = req.params;
      const census = await this.censusService.getCensus(censusId);

      res.json({
        success: true,
        data: census,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllCensuses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const censuses = await this.censusService.getAllCensuses();

      res.json({
        success: true,
        data: censuses,
      });
    } catch (error) {
      next(error);
    }
  };

  closeCensus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { censusId } = req.params;
      const result = await this.censusService.closeCensus(censusId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateMerkleRoot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { censusId } = req.params;
      const { merkleRoot, ipfsHash } = req.body;

      const result = await this.censusService.updateMerkleRoot(censusId, merkleRoot, ipfsHash);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
