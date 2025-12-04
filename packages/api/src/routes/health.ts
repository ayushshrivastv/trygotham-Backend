import { Router, Request, Response } from 'express';
import { Connection } from '@solana/web3.js';
import { config } from '../config';
// import { db } from '@zk-census/database';

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: true,
      database: false,
      solana: false,
    },
  };

  try {
    // Check database
    // await db.raw('SELECT 1');
    health.services.database = true;
  } catch (error) {
    health.status = 'degraded';
  }

  try {
    // Check Solana RPC
    const connection = new Connection(config.solanaRpcUrl);
    await connection.getSlot();
    health.services.solana = true;
  } catch (error) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
