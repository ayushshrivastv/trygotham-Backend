import { db } from '../index';
import { RegistrationStatus } from '@zk-census/types';

export interface RegistrationRecord {
  id: string;
  censusId: string;
  nullifierHash: string;
  ageRange: number;
  continent: number;
  timestamp: number;
  transactionSignature: string;
  status: RegistrationStatus;
  createdAt: Date;
}

export const registrations = {
  async create(data: Omit<RegistrationRecord, 'id' | 'createdAt'>): Promise<RegistrationRecord> {
    const [registration] = await db('registrations').insert(data).returning('*');
    return registration;
  },

  async findById(id: string): Promise<RegistrationRecord | null> {
    return db('registrations').where({ id }).first();
  },

  async findByNullifier(nullifierHash: string): Promise<RegistrationRecord | null> {
    return db('registrations').where({ nullifierHash }).first();
  },

  async findByCensus(censusId: string): Promise<RegistrationRecord[]> {
    return db('registrations').where({ censusId }).select('*').orderBy('created_at', 'desc');
  },

  async countByCensus(censusId: string): Promise<number> {
    const result = await db('registrations').where({ censusId }).count('* as count').first();
    return parseInt(result?.count as string) || 0;
  },

  async findRecent(limit: number = 10): Promise<RegistrationRecord[]> {
    return db('registrations').select('*').orderBy('created_at', 'desc').limit(limit);
  },
};
