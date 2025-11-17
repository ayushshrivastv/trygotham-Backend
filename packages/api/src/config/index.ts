import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Solana
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  solanaNetwork: (process.env.SOLANA_NETWORK as 'devnet' | 'mainnet-beta' | 'testnet') || 'devnet',
  censusProgramId: process.env.CENSUS_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/zk_census',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // IPFS
  ipfsUrl: process.env.IPFS_URL || 'http://localhost:5001',
  ipfsGateway: process.env.IPFS_GATEWAY || 'https://ipfs.io',

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // ZK Circuits
  circuitsPath: process.env.CIRCUITS_PATH || '../circuits/build',

  // Proof verification timeout
  proofVerificationTimeout: parseInt(process.env.PROOF_VERIFICATION_TIMEOUT || '60000', 10), // 60 seconds
};
