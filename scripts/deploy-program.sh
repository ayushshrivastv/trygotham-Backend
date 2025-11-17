#!/bin/bash

# zk-Census Solana Program Deployment Script
# This script builds and deploys the census program to Solana

set -e

echo "🚀 zk-Census Solana Program Deployment"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Solana is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI not found${NC}"
    echo "Please install Solana CLI:"
    echo "sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor not found${NC}"
    echo "Please install Anchor:"
    echo "cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked"
    exit 1
fi

echo -e "${GREEN}✅ Solana CLI installed${NC}"
echo -e "${GREEN}✅ Anchor installed${NC}"
echo ""

# Get network choice
echo "Select deployment network:"
echo "1) Localnet (for testing)"
echo "2) Devnet (recommended for development)"
echo "3) Mainnet-beta (production)"
read -p "Enter choice [1-3]: " network_choice

case $network_choice in
    1)
        NETWORK="localnet"
        RPC_URL="http://localhost:8899"
        echo -e "${BLUE}📡 Using Localnet${NC}"
        ;;
    2)
        NETWORK="devnet"
        RPC_URL="https://api.devnet.solana.com"
        echo -e "${BLUE}📡 Using Devnet${NC}"
        ;;
    3)
        NETWORK="mainnet-beta"
        RPC_URL="https://api.mainnet-beta.solana.com"
        echo -e "${YELLOW}⚠️  Using Mainnet-beta (PRODUCTION)${NC}"
        read -p "Are you sure? This will cost real SOL. (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo "Deployment cancelled"
            exit 0
        fi
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Configure Solana
echo ""
echo -e "${BLUE}⚙️  Configuring Solana CLI...${NC}"
solana config set --url $RPC_URL

# Check wallet
echo ""
echo -e "${BLUE}💰 Checking wallet...${NC}"
WALLET_PATH="$HOME/.config/solana/id.json"

if [ ! -f "$WALLET_PATH" ]; then
    echo -e "${YELLOW}⚠️  No wallet found at $WALLET_PATH${NC}"
    read -p "Create new wallet? (yes/no): " create_wallet
    if [ "$create_wallet" == "yes" ]; then
        solana-keygen new --outfile $WALLET_PATH
    else
        echo "Deployment cancelled - wallet required"
        exit 1
    fi
fi

# Show wallet info
PUBKEY=$(solana-keygen pubkey $WALLET_PATH)
BALANCE=$(solana balance $PUBKEY)

echo -e "${GREEN}Wallet address: $PUBKEY${NC}"
echo -e "${GREEN}Balance: $BALANCE${NC}"

# Check if we have enough SOL
if [ "$NETWORK" == "localnet" ]; then
    echo -e "${BLUE}💸 Airdropping SOL for localnet...${NC}"
    solana airdrop 2 || echo "Airdrop failed - may already have SOL"
elif [ "$NETWORK" == "devnet" ]; then
    echo ""
    read -p "Need SOL for deployment. Request airdrop? (yes/no): " airdrop
    if [ "$airdrop" == "yes" ]; then
        echo -e "${BLUE}💸 Requesting airdrop...${NC}"
        solana airdrop 2 || echo "Airdrop may have failed - check your balance"
    fi
fi

# Navigate to program directory
cd programs/census-program

# Build the program
echo ""
echo -e "${BLUE}🔨 Building program...${NC}"
anchor build

# Get program ID
PROGRAM_ID=$(solana-keygen pubkey target/deploy/zk_census-keypair.json)
echo -e "${GREEN}Program ID: $PROGRAM_ID${NC}"

# Update Anchor.toml with actual program ID
echo ""
echo -e "${BLUE}📝 Updating Anchor.toml...${NC}"
sed -i.bak "s/zk_census = \".*\"/zk_census = \"$PROGRAM_ID\"/" Anchor.toml

# Rebuild with correct program ID
echo -e "${BLUE}🔨 Rebuilding with correct program ID...${NC}"
anchor build

# Deploy
echo ""
echo -e "${BLUE}🚀 Deploying program to $NETWORK...${NC}"
if [ "$NETWORK" == "localnet" ]; then
    # Start local validator if not running
    if ! pgrep -x "solana-test-validator" > /dev/null; then
        echo -e "${BLUE}Starting local validator...${NC}"
        solana-test-validator > /dev/null 2>&1 &
        sleep 5
    fi
fi

anchor deploy --provider.cluster $NETWORK

# Verify deployment
echo ""
echo -e "${BLUE}✅ Verifying deployment...${NC}"
solana program show $PROGRAM_ID

# Update environment files
echo ""
echo -e "${BLUE}📝 Updating configuration files...${NC}"

cd ../..

# Update API .env
if [ -f "packages/api/.env" ]; then
    if grep -q "CENSUS_PROGRAM_ID=" packages/api/.env; then
        sed -i.bak "s/CENSUS_PROGRAM_ID=.*/CENSUS_PROGRAM_ID=$PROGRAM_ID/" packages/api/.env
    else
        echo "CENSUS_PROGRAM_ID=$PROGRAM_ID" >> packages/api/.env
    fi
    echo -e "${GREEN}✅ Updated packages/api/.env${NC}"
fi

# Update .env.example
if [ -f "packages/api/.env.example" ]; then
    sed -i.bak "s/CENSUS_PROGRAM_ID=.*/CENSUS_PROGRAM_ID=$PROGRAM_ID/" packages/api/.env.example
    echo -e "${GREEN}✅ Updated packages/api/.env.example${NC}"
fi

# Update config file
cat > deployment-info.json <<EOF
{
  "network": "$NETWORK",
  "programId": "$PROGRAM_ID",
  "rpcUrl": "$RPC_URL",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployer": "$PUBKEY"
}
EOF

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment Successful!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Information:${NC}"
echo -e "  Network:    $NETWORK"
echo -e "  Program ID: ${GREEN}$PROGRAM_ID${NC}"
echo -e "  RPC URL:    $RPC_URL"
echo -e "  Deployer:   $PUBKEY"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Program is deployed and ready to use"
echo "2. Configuration files have been updated"
echo "3. Start the API server: pnpm dev:api"
echo "4. Test with: pnpm anchor:test"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "- Save the Program ID: $PROGRAM_ID"
echo "- Deployment info saved to: deployment-info.json"
echo "- Update your frontend with this Program ID"
echo ""

# Commit changes
read -p "Commit configuration updates to git? (yes/no): " commit_choice
if [ "$commit_choice" == "yes" ]; then
    git add .
    git commit -m "deploy: Deploy census program to $NETWORK

Program ID: $PROGRAM_ID
Network: $NETWORK
Deployed at: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo -e "${GREEN}✅ Changes committed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
