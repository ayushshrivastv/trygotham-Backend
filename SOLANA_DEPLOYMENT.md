# Solana Program Deployment Guide

## Quick Deploy

Run the automated deployment script:

```bash
./scripts/deploy-program.sh
```

The script will:
1. ✅ Check for Solana and Anchor installation
2. ✅ Let you choose network (localnet/devnet/mainnet)
3. ✅ Check wallet and balance
4. ✅ Build the program
5. ✅ Deploy to Solana
6. ✅ Update all configuration files
7. ✅ Save deployment info

## Prerequisites

### 1. Install Solana CLI

```bash
# Install Solana
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Add to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation
solana --version
```

### 2. Install Rust

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify
rustc --version
cargo --version
```

### 3. Install Anchor

```bash
# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

# Verify
anchor --version
```

## Manual Deployment

If you prefer manual deployment:

### Step 1: Configure Solana

```bash
# For Devnet (recommended)
solana config set --url https://api.devnet.solana.com

# For Localnet (testing)
solana config set --url http://localhost:8899

# For Mainnet (production)
solana config set --url https://api.mainnet-beta.solana.com
```

### Step 2: Create/Configure Wallet

```bash
# Create new wallet
solana-keygen new --outfile ~/.config/solana/id.json

# Or use existing wallet
solana config set --keypair /path/to/your/wallet.json

# Check wallet
solana address
solana balance
```

### Step 3: Get SOL (if needed)

**For Devnet:**
```bash
# Airdrop SOL
solana airdrop 2

# Check balance
solana balance
```

**For Mainnet:**
- Purchase SOL from an exchange
- Transfer to your wallet address

### Step 4: Build the Program

```bash
cd programs/census-program

# Build
anchor build

# Get program ID
solana-keygen pubkey target/deploy/zk_census-keypair.json
```

### Step 5: Update Program ID

Update `programs/census-program/Anchor.toml`:

```toml
[programs.devnet]
zk_census = "YOUR_PROGRAM_ID_HERE"
```

### Step 6: Rebuild

```bash
# Rebuild with correct program ID
anchor build
```

### Step 7: Deploy

```bash
# Deploy to current configured network
anchor deploy

# Or specify network
anchor deploy --provider.cluster devnet
```

### Step 8: Verify Deployment

```bash
# Check program
solana program show YOUR_PROGRAM_ID

# View account data
solana account YOUR_PROGRAM_ID
```

### Step 9: Update Backend Configuration

Update `packages/api/.env`:

```bash
CENSUS_PROGRAM_ID=YOUR_PROGRAM_ID_HERE
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
```

## Network Options

### Localnet (Development)

**Pros:**
- ✅ Free
- ✅ Fast
- ✅ No rate limits
- ✅ Full control

**Cons:**
- ❌ Local only
- ❌ Data lost on restart

**Setup:**
```bash
# Start local validator
solana-test-validator

# In another terminal
solana config set --url http://localhost:8899
solana airdrop 2
```

### Devnet (Testing)

**Pros:**
- ✅ Free SOL via airdrop
- ✅ Public network
- ✅ Persistent data
- ✅ Similar to mainnet

**Cons:**
- ❌ Slower than localnet
- ❌ Rate limits on RPC

**Setup:**
```bash
solana config set --url https://api.devnet.solana.com
solana airdrop 2
```

### Mainnet-beta (Production)

**Pros:**
- ✅ Production environment
- ✅ Real users
- ✅ Persistent data

**Cons:**
- ❌ Costs real SOL
- ❌ Irreversible

**Setup:**
```bash
solana config set --url https://api.mainnet-beta.solana.com
# Fund wallet with real SOL
```

## Deployment Costs

### Devnet
- **Cost:** Free (use airdrops)
- **Program deployment:** ~2 SOL (airdropped)

### Mainnet
- **Program deployment:** ~2-3 SOL
- **Transaction fees:** ~0.00025 SOL per transaction
- **Account rent:** Variable based on data size

**Estimated total for mainnet:**
- Initial deployment: ~2.5 SOL (~$250 at $100/SOL)
- Monthly operations: Depends on usage

## Troubleshooting

### "Insufficient funds"

```bash
# Devnet - request airdrop
solana airdrop 2

# Mainnet - add SOL to wallet
solana balance
```

### "Program deployment failed"

```bash
# Check logs
anchor deploy --verbose

# Verify wallet has enough SOL
solana balance

# Check program size
ls -lh target/deploy/zk_census.so
```

### "Invalid program ID"

```bash
# Regenerate program ID
cd programs/census-program
anchor build
solana-keygen pubkey target/deploy/zk_census-keypair.json

# Update Anchor.toml and rebuild
anchor build
```

### "RPC connection failed"

```bash
# Test RPC connection
solana cluster-version

# Try different RPC
solana config set --url https://api.devnet.solana.com

# Or use custom RPC
solana config set --url https://your-rpc-url.com
```

## Post-Deployment

### 1. Test the Program

```bash
cd programs/census-program
anchor test
```

### 2. Update Frontend

Update your React Native app with the program ID:

```typescript
const CENSUS_PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID');
```

### 3. Initialize a Census

```bash
# Using the API
curl -X POST http://localhost:3000/api/v1/census \
  -H "Content-Type: application/json" \
  -d '{
    "name": "First Census",
    "description": "Test census on devnet",
    "enableLocation": true
  }'
```

### 4. Monitor the Program

```bash
# View program logs
solana logs YOUR_PROGRAM_ID

# Check program account
solana program show YOUR_PROGRAM_ID

# Monitor transactions
solana transaction-history
```

## Upgrade Program

To upgrade an already deployed program:

```bash
# Make your code changes
# Rebuild
anchor build

# Upgrade (requires upgrade authority)
anchor upgrade target/deploy/zk_census.so --program-id YOUR_PROGRAM_ID

# Verify
solana program show YOUR_PROGRAM_ID
```

## Security Best Practices

1. **Wallet Security**
   - Never commit wallet private keys
   - Use hardware wallet for mainnet
   - Keep backups of seed phrases

2. **Program Authority**
   - Set upgrade authority carefully
   - Consider multisig for mainnet
   - Document authority procedures

3. **Testing**
   - Test thoroughly on devnet first
   - Run full test suite
   - Perform security audit before mainnet

4. **Monitoring**
   - Set up alerts for program activity
   - Monitor transaction success rates
   - Track program account rent

## CI/CD Deployment

For automated deployment, add to GitHub Actions:

```yaml
name: Deploy to Devnet

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Solana
        run: |
          sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
          echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH

      - name: Install Anchor
        run: cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

      - name: Deploy
        env:
          WALLET_PRIVATE_KEY: ${{ secrets.SOLANA_WALLET }}
        run: |
          echo "$WALLET_PRIVATE_KEY" > wallet.json
          solana config set --keypair wallet.json
          solana config set --url https://api.devnet.solana.com
          cd programs/census-program
          anchor build
          anchor deploy
```

## Getting Help

- **Solana Docs:** https://docs.solana.com
- **Anchor Docs:** https://www.anchor-lang.com
- **Discord:** Solana Discord server
- **Stack Exchange:** Solana Stack Exchange

---

**Ready to deploy?** Run `./scripts/deploy-program.sh` to get started! 🚀
