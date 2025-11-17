import { CensusStats, CensusNotFoundError } from '@zk-census/types';
import { logger } from '../config/logger';
import { db } from '@zk-census/database';

export class StatsService {
  async getCensusStats(censusId: string): Promise<CensusStats> {
    try {
      const stats = await db.stats.getCensusStats(censusId);

      if (!stats) {
        throw new CensusNotFoundError(censusId);
      }

      return stats;
    } catch (error) {
      logger.error(`Error getting stats for census ${censusId}:`, error);
      throw error;
    }
  }

  async getGlobalStats(): Promise<{
    totalCensuses: number;
    totalRegistrations: number;
    activeCensuses: number;
  }> {
    try {
      const stats = await db.stats.getGlobalStats();
      return stats;
    } catch (error) {
      logger.error('Error getting global stats:', error);
      throw error;
    }
  }

  async getAgeDistribution(censusId: string): Promise<{ [key: number]: number }> {
    try {
      const distribution = await db.stats.getAgeDistribution(censusId);
      return distribution;
    } catch (error) {
      logger.error(`Error getting age distribution for census ${censusId}:`, error);
      throw error;
    }
  }

  async getLocationDistribution(censusId: string): Promise<{ [key: number]: number }> {
    try {
      const distribution = await db.stats.getLocationDistribution(censusId);
      return distribution;
    } catch (error) {
      logger.error(`Error getting location distribution for census ${censusId}:`, error);
      throw error;
    }
  }
}
