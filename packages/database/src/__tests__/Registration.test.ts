import { db, censuses, registrations } from '../index';
import { RegistrationStatus } from '@zk-census/types';

describe('Registration Model', () => {
  beforeAll(async () => {
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(async () => {
    await db('registrations').truncate();
    await db('censuses').truncate();

    // Create test census
    await censuses.create({
      id: 'test-census',
      name: 'Test Census',
      description: 'Test',
      enableLocation: true,
      minAge: 0,
      active: true,
    });
  });

  describe('create', () => {
    it('should create a registration', async () => {
      const data = {
        censusId: 'test-census',
        nullifierHash: '0xabc123',
        ageRange: 2,
        continent: 1,
        timestamp: Date.now(),
        transactionSignature: 'tx-sig-123',
        status: 'verified' as RegistrationStatus,
      };

      const registration = await registrations.create(data);

      expect(registration).toBeDefined();
      expect(registration.nullifierHash).toBe(data.nullifierHash);
      expect(registration.ageRange).toBe(data.ageRange);
    });
  });

  describe('findByNullifier', () => {
    it('should find registration by nullifier', async () => {
      const nullifier = '0xdef456';

      await registrations.create({
        censusId: 'test-census',
        nullifierHash: nullifier,
        ageRange: 3,
        continent: 2,
        timestamp: Date.now(),
        transactionSignature: 'tx-sig',
        status: 'verified',
      });

      const found = await registrations.findByNullifier(nullifier);

      expect(found).toBeDefined();
      expect(found?.nullifierHash).toBe(nullifier);
    });

    it('should return null for non-existent nullifier', async () => {
      const found = await registrations.findByNullifier('0xnonexistent');
      expect(found).toBeNull();
    });
  });

  describe('findByCensus', () => {
    it('should find registrations by census ID', async () => {
      await registrations.create({
        censusId: 'test-census',
        nullifierHash: '0x111',
        ageRange: 1,
        continent: 0,
        timestamp: Date.now(),
        transactionSignature: 'tx-1',
        status: 'verified',
      });

      await registrations.create({
        censusId: 'test-census',
        nullifierHash: '0x222',
        ageRange: 2,
        continent: 1,
        timestamp: Date.now(),
        transactionSignature: 'tx-2',
        status: 'verified',
      });

      const found = await registrations.findByCensus('test-census');

      expect(found).toHaveLength(2);
    });
  });

  describe('countByCensus', () => {
    it('should count registrations for a census', async () => {
      await registrations.create({
        censusId: 'test-census',
        nullifierHash: '0x333',
        ageRange: 1,
        continent: 0,
        timestamp: Date.now(),
        transactionSignature: 'tx-3',
        status: 'verified',
      });

      const count = await registrations.countByCensus('test-census');

      expect(count).toBe(1);
    });
  });
});
