import { db } from '../index';
import { CensusStats, AgeRange, Continent } from '@zk-census/types';

export const stats = {
  async getCensusStats(censusId: string): Promise<CensusStats> {
    const registrations = await db('registrations')
      .where({ censusId, status: 'verified' })
      .select('age_range', 'continent');

    const ageDistribution: { [key in AgeRange]: number } = {
      [AgeRange.RANGE_0_17]: 0,
      [AgeRange.RANGE_18_24]: 0,
      [AgeRange.RANGE_25_34]: 0,
      [AgeRange.RANGE_35_44]: 0,
      [AgeRange.RANGE_45_54]: 0,
      [AgeRange.RANGE_55_64]: 0,
      [AgeRange.RANGE_65_PLUS]: 0,
    };

    const continentDistribution: { [key in Continent]: number } = {
      [Continent.AFRICA]: 0,
      [Continent.ASIA]: 0,
      [Continent.EUROPE]: 0,
      [Continent.NORTH_AMERICA]: 0,
      [Continent.SOUTH_AMERICA]: 0,
      [Continent.OCEANIA]: 0,
      [Continent.ANTARCTICA]: 0,
    };

    registrations.forEach((reg) => {
      ageDistribution[reg.age_range as AgeRange]++;
      continentDistribution[reg.continent as Continent]++;
    });

    return {
      totalMembers: registrations.length,
      ageDistribution,
      continentDistribution,
      lastUpdated: Date.now(),
    };
  },

  async getGlobalStats(): Promise<{
    totalCensuses: number;
    totalRegistrations: number;
    activeCensuses: number;
  }> {
    const [censusCount, registrationCount, activeCount] = await Promise.all([
      db('censuses').count('* as count').first(),
      db('registrations').where({ status: 'verified' }).count('* as count').first(),
      db('censuses').where({ active: true }).count('* as count').first(),
    ]);

    return {
      totalCensuses: parseInt(censusCount?.count as string) || 0,
      totalRegistrations: parseInt(registrationCount?.count as string) || 0,
      activeCensuses: parseInt(activeCount?.count as string) || 0,
    };
  },

  async getAgeDistribution(censusId: string): Promise<{ [key: number]: number }> {
    const registrations = await db('registrations')
      .where({ censusId, status: 'verified' })
      .select('age_range')
      .groupBy('age_range')
      .count('* as count');

    const distribution: { [key: number]: number } = {};

    registrations.forEach((row: any) => {
      distribution[row.age_range as number] = parseInt(row.count as string);
    });

    return distribution;
  },

  async getLocationDistribution(censusId: string): Promise<{ [key: number]: number }> {
    const registrations = await db('registrations')
      .where({ censusId, status: 'verified' })
      .select('continent')
      .groupBy('continent')
      .count('* as count');

    const distribution: { [key: number]: number } = {};

    registrations.forEach((row: any) => {
      distribution[row.continent as number] = parseInt(row.count as string);
    });

    return distribution;
  },
};
