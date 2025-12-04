import { Router } from 'express';
import { CensusController } from '../controllers/CensusController';
import { validateRequest, schemas } from '../middleware/validator';

const router: Router = Router();
const controller = new CensusController();

// Create new census
router.post('/', validateRequest(schemas.createCensus), controller.createCensus);

// Get census by ID
router.get('/:censusId', controller.getCensus);

// Get all censuses
router.get('/', controller.getAllCensuses);

// Close census (admin only)
router.post('/:censusId/close', controller.closeCensus);

// Update Merkle root (admin only)
router.post('/:censusId/merkle-root', controller.updateMerkleRoot);

export default router;
