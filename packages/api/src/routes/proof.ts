import { Router } from 'express';
import { ProofController } from '../controllers/ProofController';
import { proofRateLimiter } from '../middleware/rateLimiter';
import { validateRequest, schemas } from '../middleware/validator';

const router: Router = Router();
const controller = new ProofController();

// Submit proof for census registration
router.post(
  '/submit',
  proofRateLimiter,
  validateRequest(schemas.submitProof),
  controller.submitProof
);

// Verify proof (for testing)
router.post('/verify', controller.verifyProof);

// Check if nullifier exists
router.get('/nullifier/:nullifierHash', controller.checkNullifier);

export default router;
