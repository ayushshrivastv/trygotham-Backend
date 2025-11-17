import { Request, Response, NextFunction } from 'express';
import { ZKCensusError } from '@zk-census/types';
import { logger } from '../config/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error(`Error: ${err.message}`, { stack: err.stack, url: req.url, method: req.method });

  if (err instanceof ZKCensusError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Default error
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
