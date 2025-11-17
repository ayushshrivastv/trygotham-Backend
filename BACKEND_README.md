# zk-Census Backend

Privacy-preserving census infrastructure for decentralized communities built on Solana.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     zk-Census Backend                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │   API       │  │   Solana     │  │   ZK Circuits   │    │
│  │  Service    │→ │   Program    │← │   (Circom)      │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
│        ↓                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │  Database   │  │     IPFS     │  │  Merkle Tree    │    │
│  │ (PostgreSQL)│  │   Storage    │  │    Service      │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
Calindria/
├── packages/
│   ├── types/          # Shared TypeScript types
│   ├── api/            # REST API server (Express)
│   ├── circuits/       # Zero-knowledge circuits (Circom)
│   ├── database/       # Database models and migrations
│   └── ipfs/           # IPFS integration
├── programs/
│   └── census-program/ # Solana program (Anchor)
├── package.json        # Root package configuration
└── pnpm-workspace.yaml # Workspace definition
```

## Tech Stack

- **Blockchain**: Solana (Anchor Framework)
- **Zero-Knowledge**: Circom + Groth16
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Knex.js
- **Storage**: IPFS
- **Package Manager**: pnpm (workspaces)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 14
- Rust + Solana CLI (for program development)
- Circom (for circuit compilation)
- IPFS daemon

### Installation

1. **Install dependencies:**
```bash
pnpm install
```

2. **Set up environment variables:**
```bash
# Copy example env file
cp packages/api/.env.example packages/api/.env

# Edit with your configuration
# - Database URL
# - Solana RPC endpoint
# - IPFS configuration
```

3. **Set up database:**
```bash
# Create database
createdb zk_census

# Run migrations
cd packages/database
pnpm migrate
```

4. **Build all packages:**
```bash
pnpm build
```

### Development

**Start API server:**
```bash
pnpm dev:api
```

**Build Solana program:**
```bash
pnpm anchor:build
```

**Compile ZK circuits:**
```bash
cd packages/circuits
pnpm compile
```

**Run tests:**
```bash
pnpm test
```

## Packages

### @zk-census/types

Shared TypeScript types and interfaces used across all packages.

**Key types:**
- `CensusProof` - Zero-knowledge proof structure
- `ProofPublicSignals` - Public signals for verification
- `CensusStats` - Aggregated statistics
- `AgeRange`, `Continent` - Privacy-preserving enums

### @zk-census/api

REST API server providing endpoints for census management and proof submission.

**Endpoints:**

```
POST   /api/v1/census              # Create new census
GET    /api/v1/census/:id          # Get census details
GET    /api/v1/census              # List all censuses
POST   /api/v1/census/:id/close    # Close census

POST   /api/v1/proof/submit        # Submit proof for registration
POST   /api/v1/proof/verify        # Verify proof (testing)
GET    /api/v1/proof/nullifier/:hash # Check nullifier

GET    /api/v1/stats/:censusId     # Get census statistics
GET    /api/v1/stats               # Get global statistics

GET    /api/health                 # Health check
```

**Configuration:**
- See `packages/api/.env.example` for all configuration options

### @zk-census/circuits

Zero-knowledge circuits for privacy-preserving proofs.

**Main circuit:** `census.circom`

**Proves:**
1. Valid passport (not expired)
2. Age within claimed range (0-17, 18-24, 25-34, 35-44, 45-54, 55-64, 65+)
3. Location matches claimed continent
4. Unique nullifier (prevents double registration)

**Compilation:**
```bash
cd packages/circuits
pnpm compile
pnpm setup  # Generate proving/verification keys
```

### @zk-census/database

Database models and migrations using PostgreSQL.

**Tables:**
- `censuses` - Census metadata
- `registrations` - Registration records (with nullifiers)

**Usage:**
```typescript
import { db, censuses, registrations, stats } from '@zk-census/database';

// Create census
const census = await censuses.create({
  name: 'My Census',
  description: 'Test census',
});

// Get statistics
const censusStats = await stats.getCensusStats(censusId);
```

### @zk-census/ipfs

IPFS integration for storing Merkle trees.

**Usage:**
```typescript
import { IPFSService } from '@zk-census/ipfs';

const ipfs = new IPFSService();

// Add data
const cid = await ipfs.addJSON({ data: 'example' });

// Retrieve data
const data = await ipfs.getJSON(cid);
```

### census-program (Solana)

Solana program for on-chain census management.

**Instructions:**
- `initialize_census` - Create new census
- `submit_proof` - Register with ZK proof
- `update_merkle_root` - Update nullifier tree root
- `close_census` - Close census registration
- `get_stats` - Query statistics

**Building:**
```bash
cd programs/census-program
anchor build
anchor test
```

**Deployment:**
```bash
anchor deploy --provider.cluster devnet
```

## API Usage Examples

### Create Census

```bash
curl -X POST http://localhost:3000/api/v1/census \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Community Census 2024",
    "description": "Annual community census",
    "enableLocation": true,
    "minAge": 1
  }'
```

### Submit Proof

```bash
curl -X POST http://localhost:3000/api/v1/proof/submit \
  -H "Content-Type: application/json" \
  -d '{
    "censusId": "census-123",
    "proof": {
      "pi_a": ["...", "..."],
      "pi_b": [["...", "..."], ["...", "..."]],
      "pi_c": ["...", "..."],
      "protocol": "groth16",
      "curve": "bn128"
    },
    "publicSignals": {
      "nullifierHash": "0x...",
      "ageRange": 2,
      "continent": 1,
      "censusId": "census-123",
      "timestamp": 1234567890
    },
    "signature": "...",
    "publicKey": "..."
  }'
```

### Get Statistics

```bash
curl http://localhost:3000/api/v1/stats/census-123
```

## Security Considerations

### Zero-Knowledge Proofs

- **Groth16** provides succinct proofs (~200 bytes)
- **Trusted setup** required - use MPC ceremony in production
- **Circuit constraints** ensure proof soundness

### Nullifier System

- **Prevents double registration** via cryptographic nullifiers
- **Privacy-preserving** - nullifier doesn't reveal identity
- **Merkle tree** for efficient on-chain verification

### Data Privacy

- **No PII stored** - only aggregated statistics
- **Age ranges** instead of exact ages
- **Continents** instead of exact locations
- **Passport data** deleted immediately after proof generation

### Rate Limiting

- **Global rate limit**: 100 requests per 15 minutes
- **Proof submission**: 10 proofs per hour per IP
- Configurable via environment variables

## Deployment

### Production Checklist

- [ ] Generate production ZK circuits with proper trusted setup
- [ ] Deploy Solana program to mainnet-beta
- [ ] Set up production database with backups
- [ ] Configure IPFS cluster for redundancy
- [ ] Set up monitoring and alerting
- [ ] Enable SSL/TLS for API
- [ ] Configure CORS for frontend domain
- [ ] Set up rate limiting per user (not just IP)
- [ ] Implement proper wallet management
- [ ] Set up log aggregation

### Environment Variables

See `packages/api/.env.example` for complete list.

**Critical settings:**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
CENSUS_PROGRAM_ID=<deployed-program-id>
```

## Testing

### Unit Tests

```bash
# Test all packages
pnpm test

# Test specific package
pnpm --filter @zk-census/api test
```

### Integration Tests

```bash
# Test Solana program
pnpm anchor:test

# Test circuits
cd packages/circuits
pnpm test
```

### Manual Testing

1. Start local Solana validator:
```bash
solana-test-validator
```

2. Start IPFS daemon:
```bash
ipfs daemon
```

3. Start API server:
```bash
pnpm dev:api
```

4. Use Postman/curl to test endpoints

## Performance Optimization

### ZK Proof Generation

- **Client-side**: 30-60 seconds on mobile devices
- **Server-side**: ~5 seconds on modern CPU
- **Optimization**: Use WebAssembly, cache proving keys

### Database

- **Indexes** on frequently queried fields
- **Connection pooling** (2-20 connections)
- **Query optimization** for statistics aggregation

### Solana

- **Transaction batching** for multiple proofs
- **Merkle tree** compression reduces on-chain storage
- **Solana fees**: ~$0.00025 per transaction

## Troubleshooting

### Common Issues

**"IPFS connection failed"**
- Ensure IPFS daemon is running: `ipfs daemon`
- Check IPFS_URL in .env

**"Database connection error"**
- Verify PostgreSQL is running
- Check DATABASE_URL is correct
- Run migrations: `pnpm --filter @zk-census/database migrate`

**"Circuit compilation failed"**
- Install circom: https://docs.circom.io/getting-started/installation/
- Check circuit syntax in .circom files

**"Anchor build failed"**
- Install Rust and Solana CLI
- Run `anchor build --verbose` for detailed errors

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Report bugs](https://github.com/yourusername/zk-census/issues)
- Documentation: [Full docs](https://docs.zk-census.io)
- Discord: [Join community](https://discord.gg/zk-census)

---

Built with ❤️ for the decentralized future
