import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { logger } from './config/logger';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';

// Routes
import censusRoutes from './routes/census';
import proofRoutes from './routes/proof';
import statsRoutes from './routes/stats';
import healthRoutes from './routes/health';

// Load environment variables
dotenv.config();

// Create Express app
const app: express.Application = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(rateLimiter);

// API Routes
app.use('/api/v1/census', censusRoutes);
app.use('/api/v1/proof', proofRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'zk-Census API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      census: '/api/v1/census',
      proof: '/api/v1/proof',
      stats: '/api/v1/stats',
      health: '/api/health',
    },
  });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  logger.info(`🚀 zk-Census API server running on port ${PORT}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 Solana RPC: ${config.solanaRpcUrl}`);
  logger.info(`🌐 CORS origin: ${config.corsOrigin}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
