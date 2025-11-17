import { db, censuses } from '../index';

describe('Census Model', () => {
  beforeAll(async () => {
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  afterEach(async () => {
    await db('censuses').truncate();
  });

  describe('create', () => {
    it('should create a census', async () => {
      const data = {
        id: 'test-census-1',
        name: 'Test Census',
        description: 'Test description',
        enableLocation: true,
        minAge: 0,
        active: true,
      };

      const census = await censuses.create(data);

      expect(census).toBeDefined();
      expect(census.id).toBe(data.id);
      expect(census.name).toBe(data.name);
      expect(census.description).toBe(data.description);
    });
  });

  describe('findById', () => {
    it('should find census by ID', async () => {
      const data = {
        id: 'test-census-2',
        name: 'Test Census 2',
        description: 'Test',
        enableLocation: false,
        minAge: 1,
        active: true,
      };

      await censuses.create(data);
      const found = await censuses.findById('test-census-2');

      expect(found).toBeDefined();
      expect(found?.id).toBe(data.id);
      expect(found?.name).toBe(data.name);
    });

    it('should return null for non-existent ID', async () => {
      const found = await censuses.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all censuses', async () => {
      await censuses.create({
        id: 'census-1',
        name: 'Census 1',
        description: 'Test',
        enableLocation: true,
        minAge: 0,
        active: true,
      });

      await censuses.create({
        id: 'census-2',
        name: 'Census 2',
        description: 'Test',
        enableLocation: true,
        minAge: 0,
        active: true,
      });

      const all = await censuses.findAll();

      expect(all).toHaveLength(2);
    });
  });

  describe('findActive', () => {
    it('should return only active censuses', async () => {
      await censuses.create({
        id: 'active-census',
        name: 'Active',
        description: 'Test',
        enableLocation: true,
        minAge: 0,
        active: true,
      });

      await censuses.create({
        id: 'inactive-census',
        name: 'Inactive',
        description: 'Test',
        enableLocation: true,
        minAge: 0,
        active: false,
      });

      const active = await censuses.findActive();

      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('active-census');
    });
  });

  describe('update', () => {
    it('should update census', async () => {
      await censuses.create({
        id: 'update-test',
        name: 'Original Name',
        description: 'Test',
        enableLocation: true,
        minAge: 0,
        active: true,
      });

      const updated = await censuses.update('update-test', {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
    });
  });
});
