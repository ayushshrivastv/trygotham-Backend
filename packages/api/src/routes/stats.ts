import { Router } from 'express';
import { StatsController } from '../controllers/StatsController';

const router: Router = Router();
const controller = new StatsController();

// Get census statistics
router.get('/:censusId', controller.getCensusStats);

// Get global statistics
router.get('/', controller.getGlobalStats);

// Get age distribution
router.get('/:censusId/age', controller.getAgeDistribution);

// Get location distribution
router.get('/:censusId/location', controller.getLocationDistribution);

export default router;
