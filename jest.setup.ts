// Global test setup
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/zk_census_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.IPFS_URL = 'http://localhost:5001';
process.env.SOLANA_RPC_URL = 'http://localhost:8899';
process.env.LOG_LEVEL = 'error';
