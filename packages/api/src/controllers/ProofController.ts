import { Request, Response, NextFunction } from 'express';
import { ProofService } from '../services/ProofService';
import { SubmitProofRequest } from '@zk-census/types';

export class ProofController {
  private proofService: ProofService;

  constructor() {
    this.proofService = new ProofService();
  }

  submitProof = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const proofRequest: SubmitProofRequest = req.body;
      const result = await this.proofService.submitProof(proofRequest);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  verifyProof = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { proof, publicSignals } = req.body;
      const isValid = await this.proofService.verifyProof(proof, publicSignals);

      res.json({
        success: true,
        data: {
          valid: isValid,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  checkNullifier = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nullifierHash } = req.params;
      const exists = await this.proofService.checkNullifier(nullifierHash);

      res.json({
        success: true,
        data: {
          exists,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
