import {
  SubmitProofRequest,
  SubmitProofResponse,
  ZKProof,
  ProofPublicSignals,
  ProofVerificationError,
  DuplicateNullifierError,
  RegistrationStatus,
} from '@zk-census/types';
import { verifyCensusProof } from '@zk-census/circuits';
import { logger } from '../config/logger';
import { registrations, stats } from '@zk-census/database';
import { MerkleTreeService } from './MerkleTreeService';

export class ProofService {
  private merkleTreeService: MerkleTreeService;

  constructor() {
    this.merkleTreeService = new MerkleTreeService();
  }

  async submitProof(request: SubmitProofRequest): Promise<SubmitProofResponse> {
    try {
      logger.info(`Submitting proof for census: ${request.censusId}`);

      const { proof, publicSignals } = request.proof;

      // 1. Verify the zero-knowledge proof
      const isValid = await this.verifyProof(proof, publicSignals);
      if (!isValid) {
        throw new ProofVerificationError();
      }

      // 2. Check for duplicate nullifier
      const exists = await this.checkNullifier(publicSignals.nullifierHash);
      if (exists) {
        throw new DuplicateNullifierError();
      }

      // 3. Submit to Solana
      // TODO: Implement actual Solana transaction
      const txSignature = 'mock-tx-signature-' + Date.now();

      // 4. Store in database
      await registrations.create({
        censusId: request.censusId,
        nullifierHash: publicSignals.nullifierHash,
        ageRange: publicSignals.ageRange,
        continent: publicSignals.continent,
        timestamp: publicSignals.timestamp,
        transactionSignature: txSignature,
        status: RegistrationStatus.VERIFIED,
      });

      // 5. Update Merkle tree
      await this.merkleTreeService.addNullifier(
        request.censusId,
        publicSignals.nullifierHash
      );

      // 6. Get updated stats
      const censusStats = await stats.getCensusStats(request.censusId);

      logger.info(
        `Proof submitted successfully for census: ${request.censusId}, tx: ${txSignature}`
      );

      return {
        success: true,
        transactionSignature: txSignature,
        stats: censusStats,
      };
    } catch (error) {
      logger.error('Error submitting proof:', error);
      throw error;
    }
  }

  async verifyProof(proof: ZKProof, publicSignals: ProofPublicSignals): Promise<boolean> {
    try {
      logger.debug('Verifying zero-knowledge proof');

      const isValid = await verifyCensusProof(proof, publicSignals);

      logger.debug(`Proof verification result: ${isValid}`);

      return isValid;
    } catch (error) {
      logger.error('Error verifying proof:', error);
      return false;
    }
  }

  async checkNullifier(nullifierHash: string): Promise<boolean> {
    try {
      const registration = await registrations.findByNullifier(nullifierHash);
      return registration !== null;
    } catch (error) {
      logger.error('Error checking nullifier:', error);
      throw error;
    }
  }
}
