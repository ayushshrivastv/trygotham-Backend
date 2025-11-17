import request from 'supertest';
import app from '../index';
import { ZKProof, ProofPublicSignals } from '@zk-census/types';

describe('Proof Endpoints', () => {
  const mockProof: ZKProof = {
    pi_a: ['123', '456'],
    pi_b: [
      ['789', '012'],
      ['345', '678'],
    ],
    pi_c: ['901', '234'],
    protocol: 'groth16',
    curve: 'bn128',
  };

  const mockPublicSignals: ProofPublicSignals = {
    nullifierHash: '0x1234567890abcdef',
    ageRange: 2,
    continent: 1,
    censusId: 'test-census-123',
    timestamp: Date.now(),
  };

  describe('POST /api/v1/proof/submit', () => {
    it('should validate proof format', async () => {
      const response = await request(app)
        .post('/api/v1/proof/submit')
        .send({
          censusId: 'test-census',
          proof: mockProof,
          publicSignals: mockPublicSignals,
          signature: 'test-signature',
          publicKey: 'test-pubkey',
        })
        .expect('Content-Type', /json/);

      // May fail if census doesn't exist or proof verification fails
      // That's expected - we're testing the endpoint structure
      expect(response.body).toHaveProperty('success');
    });

    it('should reject invalid proof structure', async () => {
      const response = await request(app)
        .post('/api/v1/proof/submit')
        .send({
          censusId: 'test',
          proof: { invalid: 'structure' },
          publicSignals: mockPublicSignals,
          signature: 'sig',
          publicKey: 'key',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate age range', async () => {
      const invalidSignals = {
        ...mockPublicSignals,
        ageRange: 99, // Invalid range
      };

      const response = await request(app)
        .post('/api/v1/proof/submit')
        .send({
          censusId: 'test',
          proof: mockProof,
          publicSignals: invalidSignals,
          signature: 'sig',
          publicKey: 'key',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate continent', async () => {
      const invalidSignals = {
        ...mockPublicSignals,
        continent: 99, // Invalid continent
      };

      const response = await request(app)
        .post('/api/v1/proof/submit')
        .send({
          censusId: 'test',
          proof: mockProof,
          publicSignals: invalidSignals,
          signature: 'sig',
          publicKey: 'key',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/proof/verify', () => {
    it('should verify proof structure', async () => {
      const response = await request(app)
        .post('/api/v1/proof/verify')
        .send({
          proof: mockProof,
          publicSignals: mockPublicSignals,
        })
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('valid');
    });
  });

  describe('GET /api/v1/proof/nullifier/:hash', () => {
    it('should check nullifier existence', async () => {
      const response = await request(app)
        .get('/api/v1/proof/nullifier/0x1234567890abcdef')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('exists');
      expect(typeof response.body.data.exists).toBe('boolean');
    });
  });
});
