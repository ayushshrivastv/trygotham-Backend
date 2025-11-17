# Deployment Guide

## Prerequisites

Before deploying zk-Census to production, ensure you have:

- [ ] Solana wallet with SOL for deployment
- [ ] PostgreSQL database (managed service recommended)
- [ ] IPFS cluster or Pinata/Infura account
- [ ] Domain name and SSL certificate
- [ ] Server infrastructure (AWS, GCP, or similar)

## Step-by-Step Deployment

### 1. Zero-Knowledge Circuits

**Generate production circuits:**

```bash
cd packages/circuits

# Download Powers of Tau ceremony file
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau

# Compile circuit
circom circuits/census.circom --r1cs --wasm --sym -o build/

# Generate proving key (production ceremony recommended)
snarkjs groth16 setup build/census.r1cs powersOfTau28_hez_final_15.ptau build/census_0000.zkey

# Contribute to ceremony (repeat for multiple contributors)
snarkjs zkey contribute build/census_0000.zkey build/census_final.zkey \
  --name="First contribution" -e="random entropy"

# Export verification key
snarkjs zkey export verificationkey build/census_final.zkey build/verification_key.json

# Export Solana verifier
snarkjs zkey export solidityverifier build/census_final.zkey build/verifier.sol
```

**Security Note:** For production, conduct a multi-party computation (MPC) ceremony with trusted participants.

### 2. Solana Program

**Build and deploy:**

```bash
cd programs/census-program

# Configure Solana CLI
solana config set --url https://api.mainnet-beta.solana.com
solana config set --keypair ~/.config/solana/mainnet-wallet.json

# Build program
anchor build

# Deploy to mainnet
anchor deploy --provider.cluster mainnet

# Note the program ID
solana program show <PROGRAM_ID>
```

**Update Program ID:**
- Update `programs/census-program/Anchor.toml`
- Update `packages/api/.env` with `CENSUS_PROGRAM_ID`

### 3. Database Setup

**PostgreSQL (recommended: AWS RDS, GCP Cloud SQL, or Supabase):**

```bash
# Create database
createdb zk_census_production

# Set connection string
export DATABASE_URL="postgresql://user:pass@host:5432/zk_census_production"

# Run migrations
cd packages/database
NODE_ENV=production pnpm migrate
```

**Database configuration:**
- Enable SSL connections
- Set up automated backups (daily minimum)
- Configure connection pooling (10-20 connections)
- Set up read replicas for high traffic

### 4. IPFS Setup

**Option A: Self-hosted IPFS cluster**

```bash
# Install IPFS
wget https://dist.ipfs.io/go-ipfs/latest/go-ipfs_linux-amd64.tar.gz
tar -xvzf go-ipfs_linux-amd64.tar.gz
sudo mv go-ipfs/ipfs /usr/local/bin/

# Initialize and configure
ipfs init
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "GET", "POST"]'

# Run as service
ipfs daemon
```

**Option B: Pinata (managed service)**

```bash
# Sign up at https://pinata.cloud
# Get API keys
export IPFS_URL="https://api.pinata.cloud"
export PINATA_API_KEY="your-key"
export PINATA_SECRET_KEY="your-secret"
```

### 5. API Server Deployment

**Build production bundle:**

```bash
cd packages/api

# Install production dependencies
pnpm install --prod

# Build
pnpm build
```

**Docker deployment:**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

# Build
RUN pnpm build

# Expose port
EXPOSE 3000

# Start
CMD ["node", "packages/api/dist/index.js"]
```

**Build and run:**

```bash
docker build -t zk-census-api .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e SOLANA_RPC_URL=https://api.mainnet-beta.solana.com \
  -e CENSUS_PROGRAM_ID=... \
  zk-census-api
```

**Kubernetes deployment:**

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zk-census-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zk-census-api
  template:
    metadata:
      labels:
        app: zk-census-api
    spec:
      containers:
      - name: api
        image: your-registry/zk-census-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: zk-census-secrets
              key: database-url
        - name: SOLANA_RPC_URL
          value: "https://api.mainnet-beta.solana.com"
        - name: CENSUS_PROGRAM_ID
          value: "YOUR_PROGRAM_ID"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: zk-census-api
spec:
  selector:
    app: zk-census-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 6. Environment Configuration

**Production .env:**

```bash
# Server
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend.com

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
CENSUS_PROGRAM_ID=YourProgramId...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/zk_census

# Redis (for caching)
REDIS_URL=redis://redis-host:6379

# IPFS
IPFS_URL=http://ipfs-node:5001
IPFS_GATEWAY=https://ipfs.io

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=https://...@sentry.io/...
```

### 7. SSL/TLS Setup

**Using Let's Encrypt with Nginx:**

```nginx
# /etc/nginx/sites-available/zk-census
server {
    listen 80;
    server_name api.zk-census.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.zk-census.io;

    ssl_certificate /etc/letsencrypt/live/api.zk-census.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.zk-census.io/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Generate certificate:**

```bash
sudo certbot --nginx -d api.zk-census.io
```

### 8. Monitoring Setup

**Prometheus + Grafana:**

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'zk-census-api'
    static_configs:
      - targets: ['localhost:3000']
```

**Application metrics:**

```typescript
// Add to packages/api/src/metrics.ts
import promClient from 'prom-client';

const register = new promClient.Registry();

export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const proofSubmissions = new promClient.Counter({
  name: 'proof_submissions_total',
  help: 'Total number of proof submissions',
  labelNames: ['status'],
  registers: [register],
});
```

### 9. CI/CD Pipeline

**GitHub Actions example:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Run tests
        run: pnpm test

      - name: Build Docker image
        run: docker build -t ${{ secrets.REGISTRY }}/zk-census-api:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | docker login -u ${{ secrets.REGISTRY_USER }} --password-stdin ${{ secrets.REGISTRY }}
          docker push ${{ secrets.REGISTRY }}/zk-census-api:${{ github.sha }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/zk-census-api api=${{ secrets.REGISTRY }}/zk-census-api:${{ github.sha }}
```

## Post-Deployment

### Health Checks

```bash
# API health
curl https://api.zk-census.io/api/health

# Solana program
solana program show $CENSUS_PROGRAM_ID

# Database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM censuses;"

# IPFS
ipfs id
```

### Monitoring Checklist

- [ ] Set up uptime monitoring (Pingdom, UptimeRobot)
- [ ] Configure error tracking (Sentry, Rollbar)
- [ ] Set up log aggregation (ELK, Datadog)
- [ ] Create alerting rules (PagerDuty, OpsGenie)
- [ ] Monitor Solana transaction success rate
- [ ] Track proof verification performance
- [ ] Monitor database connection pool
- [ ] Set up cost alerts (cloud provider)

### Backup Strategy

**Database:**
```bash
# Daily automated backups
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup-$(date +%Y%m%d).sql s3://zk-census-backups/
```

**IPFS:**
- Pin critical data to multiple nodes
- Use Pinata/Filebase for redundancy

**Solana Program:**
- Keep buffer accounts for upgrades
- Maintain program source code in version control

## Scaling Considerations

### Horizontal Scaling

- Deploy multiple API instances behind load balancer
- Use Redis for session management and caching
- Implement database read replicas

### Performance Optimization

- Enable CDN for static assets
- Implement response caching
- Use database connection pooling
- Optimize Solana RPC calls (batching)

### Cost Optimization

- Use reserved instances for predictable workloads
- Implement auto-scaling based on traffic
- Optimize database queries
- Use spot instances for non-critical workloads

## Rollback Procedure

If deployment fails:

1. **API:** Revert to previous Docker image
```bash
kubectl rollout undo deployment/zk-census-api
```

2. **Database:** Restore from backup
```bash
psql $DATABASE_URL < backup-previous.sql
```

3. **Solana Program:** Deploy previous version
```bash
anchor upgrade --program-id $PROGRAM_ID --program-filepath ./previous-version.so
```

## Security Hardening

- [ ] Enable WAF (Web Application Firewall)
- [ ] Implement DDoS protection
- [ ] Use secrets management (AWS Secrets Manager, Vault)
- [ ] Enable audit logging
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] Rate limiting per user (not just IP)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection headers

---

For support during deployment, contact: [support@zk-census.io](mailto:support@zk-census.io)
