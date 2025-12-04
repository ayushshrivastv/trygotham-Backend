# Backend Setup Guide

This guide will help you set up the zk-Census backend (Calindria) on your local machine.

## Prerequisites

Before starting, make sure you have the following installed:

1. **Node.js** (>= 18.0.0) - ✅ Already installed (v24.8.0)
2. **pnpm** (>= 8.0.0) - ✅ Already installed (v10.23.0)
3. **PostgreSQL** (>= 14) - ⚠️ Needs to be installed
4. **IPFS** (optional, for local development) - ⚠️ Optional
5. **Redis** (optional, for rate limiting) - ⚠️ Optional

## Step 1: Install PostgreSQL

### macOS (using Homebrew):
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Or use Docker:
```bash
docker run --name postgres-zkcensus -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=zk_census -p 5432:5432 -d postgres:14
```

## Step 2: Create Database

```bash
# If using local PostgreSQL
createdb zk_census

# Or connect and create manually
psql -U postgres
CREATE DATABASE zk_census;
\q
```

## Step 3: Configure Environment Variables

1. Navigate to the API package:
```bash
cd packages/api
```

2. Create a `.env` file (copy from example if it exists):
```bash
cp .env.example .env
```

3. Edit `.env` with your configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
CENSUS_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zk_census

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# IPFS Configuration
IPFS_URL=http://localhost:5001
IPFS_GATEWAY=https://ipfs.io

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# ZK Circuits
CIRCUITS_PATH=../circuits/build

# Proof Verification
PROOF_VERIFICATION_TIMEOUT=60000
```

## Step 4: Install Dependencies

From the root directory (`Calindria/`):
```bash
pnpm install
```

## Step 5: Build All Packages

```bash
pnpm build
```

## Step 6: Run Database Migrations

```bash
cd packages/database
pnpm migrate
```

Or from root:
```bash
pnpm --filter @zk-census/database migrate
```

## Step 7: Start the API Server

From the root directory:
```bash
pnpm dev:api
```

Or from the API package:
```bash
cd packages/api
pnpm dev
```

The server should start on `http://localhost:3000`

## Step 8: Verify Setup

1. **Health Check:**
```bash
curl http://localhost:3000/api/health
```

2. **Root Endpoint:**
```bash
curl http://localhost:3000/
```

3. **Create a Test Census:**
```bash
curl -X POST http://localhost:3000/api/v1/census \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Census",
    "description": "A test census",
    "enableLocation": true,
    "minAge": 0
  }'
```

## Optional: Set Up IPFS (for Merkle Tree Storage)

### Using Docker:
```bash
docker run -d --name ipfs-node -p 4001:4001 -p 5001:5001 -p 8080:8080 ipfs/kubo:latest
```

### Or install locally:
```bash
# macOS
brew install ipfs
ipfs init
ipfs daemon
```

## Optional: Set Up Redis (for Rate Limiting)

### Using Docker:
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### Or install locally:
```bash
# macOS
brew install redis
brew services start redis
```

## Troubleshooting

### Database Connection Issues
- Make sure PostgreSQL is running: `pg_isready` or `psql -U postgres`
- Check your `DATABASE_URL` in `.env`
- Verify database exists: `psql -U postgres -l | grep zk_census`

### Port Already in Use
- Change `PORT` in `.env` to a different port (e.g., 3001)
- Or kill the process using port 3000: `lsof -ti:3000 | xargs kill`

### TypeScript Errors
- Make sure all packages are built: `pnpm build`
- Clear node_modules and reinstall: `rm -rf node_modules packages/*/node_modules && pnpm install`

### Migration Errors
- Make sure database exists and is accessible
- Check `DATABASE_URL` in `.env`
- Try rolling back and re-running: `pnpm --filter @zk-census/database migrate:rollback && pnpm --filter @zk-census/database migrate`

## Next Steps

Once the backend is running:
1. ✅ Backend API is ready
2. ⏭️ Set up the iOS frontend (Trygotham)
3. ⏭️ Connect frontend to backend API
4. ⏭️ Test the full flow

## API Endpoints

Once running, the API provides:

- `GET /` - API information
- `GET /api/health` - Health check
- `POST /api/v1/census` - Create census
- `GET /api/v1/census` - List all censuses
- `GET /api/v1/census/:id` - Get census details
- `POST /api/v1/census/:id/close` - Close census
- `POST /api/v1/proof/submit` - Submit proof
- `POST /api/v1/proof/verify` - Verify proof
- `GET /api/v1/proof/nullifier/:hash` - Check nullifier
- `GET /api/v1/stats/:censusId` - Get census statistics
- `GET /api/v1/stats` - Get global statistics

For detailed API documentation, see `BACKEND_README.md`.

