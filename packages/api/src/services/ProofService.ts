import { Connection, PublicKey } from '@solana/web3.js';
import {
  SubmitProofRequest,
  SubmitProofResponse,
  ZKProof,
  ProofPublicSignals,
  ProofVerificationError,
  DuplicateNullifierError,
  TransactionError,
} from '@zk-census/types';
import { verifyCensusProof } from '@zk-census/circuits';
import { config } from '../config';
import { logger } from '../config/logger';
import { db } from '@zk-census/database';
import { MerkleTreeService } from './MerkleTreeService';

export class ProofService {
  private connection: Connection;
  private merkleTreeService: MerkleTreeService;

  constructor() {
    this.connection = new Connection(config.solanaRpcUrl, 'confirmed');
    this.merkleTreeService = new MerkleTreeService();
  }

  async submitProof(request: SubmitProofRequest): Promise<SubmitProofResponse> {
    try {
      logger.info(`Submitting proof for census: ${request.censusId}`);

      // 1. Verify the zero-knowledge proof
      const isValid = await this.verifyProof(request.proof, request.publicSignals);
      if (!isValid) {
        throw new ProofVerificationError();
      }

      // 2. Check for duplicate nullifier
      const exists = await this.checkNullifier(request.publicSignals.nullifierHash);
      if (exists) {
        throw new DuplicateNullifierError();
      }

      // 3. Submit to Solana
      // TODO: Implement actual Solana transaction
      const txSignature = 'mock-tx-signature-' + Date.now();

      // 4. Store in database
      await db.registrations.create({
        censusId: request.censusId,
        nullifierHash: request.publicSignals.nullifierHash,
        ageRange: request.publicSignals.ageRange,
        continent: request.publicSignals.continent,
        timestamp: request.publicSignals.timestamp,
        transactionSignature: txSignature,
        status: 'verified',
      });

      // 5. Update Merkle tree
      await this.merkleTreeService.addNullifier(
        request.censusId,
        request.publicSignals.nullifierHash
      );

      // 6. Get updated stats
      const stats = await db.stats.getCensusStats(request.censusId);

      logger.info(
        `Proof submitted successfully for census: ${request.censusId}, tx: ${txSignature}`
      );

      return {
        success: true,
        transactionSignature: txSignature,
        stats,
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
      const registration = await db.registrations.findByNullifier(nullifierHash);
      return registration !== null;
    } catch (error) {
      logger.error('Error checking nullifier:', error);
      throw error;
    }
  }
}
