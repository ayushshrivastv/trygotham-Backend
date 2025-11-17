import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for proof submission
export const proofRateLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: 10, // Max 10 proofs per hour per IP
  message: {
    error: {
      code: 'PROOF_RATE_LIMIT_EXCEEDED',
      message: 'Too many proof submissions, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
