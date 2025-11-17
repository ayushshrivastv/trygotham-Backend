import request from 'supertest';
import app from '../index';
import { db } from '@zk-census/database';

describe('Census Endpoints', () => {
  beforeAll(async () => {
    // Run migrations
    await db.migrate.latest();
  });

  afterAll(async () => {
    // Cleanup
    await db.destroy();
  });

  describe('POST /api/v1/census', () => {
    it('should create a new census', async () => {
      const censusData = {
        name: 'Test Census',
        description: 'A test census for unit testing',
        enableLocation: true,
        minAge: 1,
      };

      const response = await request(app)
        .post('/api/v1/census')
        .send(censusData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(censusData.name);
      expect(response.body.data.description).toBe(censusData.description);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/census')
        .send({
          name: 'Test',
          // missing description
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate name length', async () => {
      const response = await request(app)
        .post('/api/v1/census')
        .send({
          name: 'a'.repeat(100), // Too long
          description: 'Test',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/census/:id', () => {
    let censusId: string;

    beforeAll(async () => {
      // Create a census for testing
      const response = await request(app).post('/api/v1/census').send({
        name: 'Test Census for Get',
        description: 'Test description',
        enableLocation: true,
      });
      censusId = response.body.data.id;
    });

    it('should get census by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/census/${censusId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(censusId);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('description');
    });

    it('should return 404 for non-existent census', async () => {
      const response = await request(app)
        .get('/api/v1/census/non-existent-id')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('CENSUS_NOT_FOUND');
    });
  });

  describe('GET /api/v1/census', () => {
    it('should list all censuses', async () => {
      const response = await request(app)
        .get('/api/v1/census')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});
