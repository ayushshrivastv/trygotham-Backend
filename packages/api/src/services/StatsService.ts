import { CensusStats, CensusNotFoundError } from '@zk-census/types';
import { logger } from '../config/logger';
import { stats } from '@zk-census/database';

export class StatsService {
  async getCensusStats(censusId: string): Promise<CensusStats> {
    try {
      const censusStats = await stats.getCensusStats(censusId);

      if (!censusStats) {
        throw new CensusNotFoundError(censusId);
      }

      return censusStats;
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
      const globalStats = await stats.getGlobalStats();
      return globalStats;
    } catch (error) {
      logger.error('Error getting global stats:', error);
      throw error;
    }
  }

  async getAgeDistribution(censusId: string): Promise<{ [key: number]: number }> {
    try {
      const distribution = await stats.getAgeDistribution(censusId);
      return distribution;
    } catch (error) {
      logger.error(`Error getting age distribution for census ${censusId}:`, error);
      throw error;
    }
  }

  async getLocationDistribution(censusId: string): Promise<{ [key: number]: number }> {
    try {
      const distribution = await stats.getLocationDistribution(censusId);
      return distribution;
    } catch (error) {
      logger.error(`Error getting location distribution for census ${censusId}:`, error);
      throw error;
    }
  }
}
