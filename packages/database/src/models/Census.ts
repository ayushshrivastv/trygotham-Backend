import { db } from '../index';

export interface CensusRecord {
  id: string;
  name: string;
  description: string;
  enableLocation: boolean;
  minAge: number;
  active: boolean;
  merkleRoot?: string;
  ipfsHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const censuses = {
  async create(data: Partial<CensusRecord>): Promise<CensusRecord> {
    const [census] = await db('censuses').insert(data).returning('*');
    return census;
  },

  async findById(id: string): Promise<CensusRecord | null> {
    return db('censuses').where({ id }).first();
  },

  async findAll(): Promise<CensusRecord[]> {
    return db('censuses').select('*').orderBy('created_at', 'desc');
  },

  async findActive(): Promise<CensusRecord[]> {
    return db('censuses').where({ active: true }).select('*').orderBy('created_at', 'desc');
  },

  async update(id: string, data: Partial<CensusRecord>): Promise<CensusRecord> {
    const [census] = await db('censuses')
      .where({ id })
      .update({ ...data, updatedAt: new Date() })
      .returning('*');
    return census;
  },

  async delete(id: string): Promise<void> {
    await db('censuses').where({ id }).delete();
  },
};
