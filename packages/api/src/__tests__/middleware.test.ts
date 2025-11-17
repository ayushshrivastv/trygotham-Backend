import request from 'supertest';
import app from '../index';

describe('Rate Limiting', () => {
  it('should enforce rate limits on proof submission', async () => {
    const proofData = {
      censusId: 'test',
      proof: {
        pi_a: ['1', '2'],
        pi_b: [
          ['3', '4'],
          ['5', '6'],
        ],
        pi_c: ['7', '8'],
        protocol: 'groth16',
        curve: 'bn128',
      },
      publicSignals: {
        nullifierHash: '0x123',
        ageRange: 2,
        continent: 1,
        censusId: 'test',
        timestamp: Date.now(),
      },
      signature: 'sig',
      publicKey: 'key',
    };

    // Make multiple requests to trigger rate limit
    const requests = Array(15)
      .fill(null)
      .map(() => request(app).post('/api/v1/proof/submit').send(proofData));

    const responses = await Promise.all(requests);

    // At least one should be rate limited
    const rateLimited = responses.some((r) => r.status === 429);
    expect(rateLimited).toBe(true);
  });
});

describe('Error Handling', () => {
  it('should handle 404 routes', async () => {
    const response = await request(app)
      .get('/api/v1/nonexistent')
      .expect(404);
  });

  it('should handle malformed JSON', async () => {
    const response = await request(app)
      .post('/api/v1/census')
      .set('Content-Type', 'application/json')
      .send('invalid json{')
      .expect(400);
  });
});
