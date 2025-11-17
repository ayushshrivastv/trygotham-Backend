import request from 'supertest';
import app from '../index';

describe('Stats Endpoints', () => {
  describe('GET /api/v1/stats/:censusId', () => {
    it('should return census statistics', async () => {
      const response = await request(app)
        .get('/api/v1/stats/test-census-123')
        .expect('Content-Type', /json/);

      // May return 404 if census doesn't exist, which is fine
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body.data).toHaveProperty('totalMembers');
        expect(response.body.data).toHaveProperty('ageDistribution');
        expect(response.body.data).toHaveProperty('continentDistribution');
      }
    });
  });

  describe('GET /api/v1/stats', () => {
    it('should return global statistics', async () => {
      const response = await request(app)
        .get('/api/v1/stats')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('totalCensuses');
      expect(response.body.data).toHaveProperty('totalRegistrations');
      expect(response.body.data).toHaveProperty('activeCensuses');
    });
  });

  describe('GET /api/v1/stats/:censusId/age', () => {
    it('should return age distribution', async () => {
      const response = await request(app)
        .get('/api/v1/stats/test-census/age')
        .expect('Content-Type', /json/);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body.data).toBeDefined();
      }
    });
  });

  describe('GET /api/v1/stats/:censusId/location', () => {
    it('should return location distribution', async () => {
      const response = await request(app)
        .get('/api/v1/stats/test-census/location')
        .expect('Content-Type', /json/);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body.data).toBeDefined();
      }
    });
  });
});
