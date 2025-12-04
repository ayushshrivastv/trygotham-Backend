import { PublicKey } from '@solana/web3.js';
import { config } from '../config';
import { CreateCensusConfig, CensusMetadata, CensusNotFoundError } from '@zk-census/types';
import { logger } from '../config/logger';
import { censuses } from '@zk-census/database';

export class CensusService {
  constructor() {
    // Note: Solana program integration will be added later
    // For now, we're using database-only implementation
  }

  async createCensus(censusConfig: CreateCensusConfig): Promise<CensusMetadata> {
    try {
      const censusId = this.generateCensusId();

      logger.info(`Creating census: ${censusId}`);

      // TODO: Call Solana program to initialize census
      // const tx = await this.program.methods
      //   .initializeCensus(
      //     censusId,
      //     censusConfig.name,
      //     censusConfig.description,
      //     censusConfig.enableLocation,
      //     censusConfig.minAge
      //   )
      //   .rpc();

      // Store in database
      const census = await censuses.create({
        id: censusId,
        name: censusConfig.name,
        description: censusConfig.description,
        enableLocation: censusConfig.enableLocation,
        minAge: censusConfig.minAge || 0,
        active: true,
      });

      logger.info(`Census created successfully: ${censusId}`);

      return {
        id: census.id,
        name: census.name,
        description: census.description,
        creator: new PublicKey(config.censusProgramId), // Placeholder
        createdAt: census.createdAt.getTime(),
        active: census.active,
        merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };
    } catch (error) {
      logger.error('Error creating census:', error);
      throw error;
    }
  }

  async getCensus(censusId: string): Promise<CensusMetadata> {
    try {
      const census = await censuses.findById(censusId);

      if (!census) {
        throw new CensusNotFoundError(censusId);
      }

      return {
        id: census.id,
        name: census.name,
        description: census.description,
        creator: new PublicKey(config.censusProgramId), // Placeholder
        createdAt: census.createdAt.getTime(),
        active: census.active,
        merkleRoot: census.merkleRoot || '0x0',
        ipfsHash: census.ipfsHash,
      };
    } catch (error) {
      logger.error(`Error getting census ${censusId}:`, error);
      throw error;
    }
  }

  async getAllCensuses(): Promise<CensusMetadata[]> {
    try {
      const allCensuses = await censuses.findAll();

      return allCensuses.map((census) => ({
        id: census.id,
        name: census.name,
        description: census.description,
        creator: new PublicKey(config.censusProgramId),
        createdAt: census.createdAt.getTime(),
        active: census.active,
        merkleRoot: census.merkleRoot || '0x0',
        ipfsHash: census.ipfsHash,
      }));
    } catch (error) {
      logger.error('Error getting all censuses:', error);
      throw error;
    }
  }

  async closeCensus(censusId: string): Promise<{ success: boolean }> {
    try {
      logger.info(`Closing census: ${censusId}`);

      // TODO: Call Solana program
      // await this.program.methods.closeCensus().rpc();

      await censuses.update(censusId, { active: false });

      logger.info(`Census closed: ${censusId}`);

      return { success: true };
    } catch (error) {
      logger.error(`Error closing census ${censusId}:`, error);
      throw error;
    }
  }

  async updateMerkleRoot(
    censusId: string,
    merkleRoot: string,
    ipfsHash: string
  ): Promise<{ success: boolean }> {
    try {
      logger.info(`Updating Merkle root for census: ${censusId}`);

      // TODO: Call Solana program
      // await this.program.methods.updateMerkleRoot(merkleRoot, ipfsHash).rpc();

      await censuses.update(censusId, { merkleRoot, ipfsHash });

      logger.info(`Merkle root updated for census: ${censusId}`);

      return { success: true };
    } catch (error) {
      logger.error(`Error updating Merkle root for census ${censusId}:`, error);
      throw error;
    }
  }

  private generateCensusId(): string {
    return `census-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
