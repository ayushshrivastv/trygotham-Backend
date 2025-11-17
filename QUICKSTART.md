# Quick Start Guide

This guide will get you up and running with zk-Census in minutes.

## Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Solana CLI (for smart contract deployment)
- Anchor (for smart contract deployment)

## 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/Calindria.git
cd Calindria

# Checkout the backend branch
git checkout claude/build-backend-013zUxCGUEZ2Yr5JQr3Ptsn9

# Install dependencies
pnpm install
```

## 2. Setup Database

```bash
# Create database
createdb zk_census

# Run migrations
cd packages/database
pnpm migrate
cd ../..
```

## 3. Configure Environment

```bash
# Copy environment template
cp packages/api/.env.example packages/api/.env

# Edit configuration
nano packages/api/.env
```

Minimum required settings:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zk_census
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
```

## 4. Deploy Smart Contract (Optional for Local Testing)

```bash
# Install Solana and Anchor first (see SOLANA_DEPLOYMENT.md)

# Run deployment script
./scripts/deploy-program.sh

# Select option 2 (Devnet) when prompted
```

**OR skip deployment and use mock mode:**
- The API will work without deployed contracts for testing
- Some features will use mock data

## 5. Start the Backend

### Option A: Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Option B: Manual

```bash
# Build all packages
pnpm build

# Start API server
pnpm dev:api
```

## 6. Test the Installation

### Check API Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "api": true,
    "database": true,
    "solana": true
  }
}
```

### Create a Census

```bash
node examples/create-census.js
```

### List Censuses

```bash
node examples/list-censuses.js
```

### Get Statistics

```bash
node examples/get-stats.js <census-id>
```

## 7. Run Tests (Optional)

```bash
# All tests
pnpm test

# API tests only
pnpm --filter @zk-census/api test

# Solana program tests (requires deployed contract)
pnpm anchor:test
```

## Common Commands

```bash
# Development
pnpm dev:api              # Start API in dev mode
pnpm build                # Build all packages
pnpm test                 # Run all tests
pnpm lint                 # Lint code

# Database
pnpm --filter @zk-census/database migrate        # Run migrations
pnpm --filter @zk-census/database migrate:rollback  # Rollback

# Solana
pnpm anchor:build         # Build smart contract
pnpm anchor:test          # Test smart contract
pnpm anchor:deploy        # Deploy to configured network

# Docker
docker-compose up -d      # Start all services
docker-compose down       # Stop all services
docker-compose logs -f    # View logs
docker-compose restart    # Restart services
```

## Project Structure

```
Calindria/
├── packages/
│   ├── api/              # REST API server
│   ├── types/            # Shared TypeScript types
│   ├── circuits/         # Zero-knowledge circuits
│   ├── database/         # Database models & migrations
│   └── ipfs/             # IPFS integration
├── programs/
│   └── census-program/   # Solana smart contract
├── examples/             # Example usage scripts
├── scripts/              # Deployment scripts
└── docker-compose.yml    # Docker configuration
```

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Census Management
- `POST /census` - Create census
- `GET /census/:id` - Get census details
- `GET /census` - List all censuses
- `POST /census/:id/close` - Close census

### Proof Submission
- `POST /proof/submit` - Submit registration proof
- `POST /proof/verify` - Verify proof
- `GET /proof/nullifier/:hash` - Check nullifier

### Statistics
- `GET /stats/:censusId` - Census statistics
- `GET /stats` - Global statistics
- `GET /stats/:censusId/age` - Age distribution
- `GET /stats/:censusId/location` - Location distribution

### Health
- `GET /health` - System health check

## Next Steps

### For Development

1. **Read the docs:**
   - `BACKEND_README.md` - Complete backend guide
   - `SOLANA_DEPLOYMENT.md` - Smart contract deployment
   - `TESTING.md` - Testing guide

2. **Explore examples:**
   - Check `examples/` directory
   - Run example scripts
   - Read `examples/README.md`

3. **Write tests:**
   - See `TESTING.md` for test structure
   - Add tests for new features
   - Maintain >80% coverage

### For Production

1. **Deploy smart contract:**
   - Follow `SOLANA_DEPLOYMENT.md`
   - Deploy to mainnet-beta
   - Save program ID

2. **Configure production environment:**
   - Set production DATABASE_URL
   - Configure IPFS (Pinata/Infura)
   - Set up monitoring
   - Enable SSL/TLS

3. **Deploy backend:**
   - See `DEPLOYMENT.md`
   - Use Docker/Kubernetes
   - Set up CI/CD
   - Configure autoscaling

### For Frontend Development

1. **Install React Native dependencies**
2. **Use API endpoints** documented above
3. **Import types** from `@zk-census/types`
4. **Generate ZK proofs** using circuits
5. **Submit proofs** via API

## Troubleshooting

### "Database connection failed"
```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
cat packages/api/.env | grep DATABASE_URL

# Test connection
psql postgresql://localhost:5432/zk_census
```

### "Port 3000 already in use"
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev:api
```

### "IPFS connection failed"
```bash
# Start IPFS daemon
ipfs daemon

# Or use managed IPFS (update .env)
IPFS_URL=https://ipfs.infura.io:5001
```

### "Solana RPC failed"
```bash
# Use different RPC
SOLANA_RPC_URL=https://api.devnet.solana.com

# Or use custom RPC provider
SOLANA_RPC_URL=https://your-rpc.com
```

## Getting Help

- **Documentation:** Check all `.md` files in root
- **Examples:** See `examples/` directory
- **Issues:** Open GitHub issue
- **Tests:** Run `pnpm test` to verify setup

## What's Next?

✅ Backend is ready
✅ Smart contract deployable
✅ API endpoints working
✅ Tests passing

**Next:** Build the React Native frontend! 🚀

---

**Tip:** Use `docker-compose up -d` for the easiest local development experience.
