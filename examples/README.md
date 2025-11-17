# zk-Census Examples

This directory contains example scripts demonstrating how to use the zk-Census API.

## Prerequisites

Make sure the API server is running:

```bash
# From project root
pnpm dev:api
```

## Examples

### 1. Create a Census

Creates a new census with specified parameters.

```bash
node examples/create-census.js
```

**Output:**
- Census ID (save this for other operations)
- Census details
- Creation timestamp

### 2. List All Censuses

Lists all censuses in the system.

```bash
node examples/list-censuses.js
```

**Output:**
- Total number of censuses
- Details for each census
- Active/inactive status

### 3. Submit a Proof

Submits a zero-knowledge proof for census registration.

**Note:** This example uses mock proof data. In a real application, the proof would be generated using the ZK circuits.

```bash
node examples/submit-proof.js <census-id>
```

Example:
```bash
node examples/submit-proof.js census-1234567890
```

**Output:**
- Transaction signature
- Updated census statistics
- Age and location distribution

### 4. Get Census Statistics

Retrieves and displays statistics for a specific census.

```bash
node examples/get-stats.js <census-id>
```

Example:
```bash
node examples/get-stats.js census-1234567890
```

**Output:**
- Total members count
- Age distribution breakdown
- Location distribution by continent
- Percentages for each category

## Full Workflow Example

```bash
# 1. Create a census
node examples/create-census.js
# Output: census-1234567890

# 2. List all censuses (verify creation)
node examples/list-censuses.js

# 3. Submit proof registrations
node examples/submit-proof.js census-1234567890

# 4. Check statistics
node examples/get-stats.js census-1234567890
```

## Environment Variables

Set a custom API URL:

```bash
export API_URL=http://your-api-url:3000
node examples/create-census.js
```

## Real-World Usage

In a production application:

1. **Frontend (React Native)** would:
   - Scan passport using camera
   - Extract MRZ data on-device
   - Generate ZK proof using circuits
   - Submit proof via API

2. **Backend** would:
   - Verify the proof
   - Check nullifier uniqueness
   - Store on Solana blockchain
   - Update statistics

3. **Dashboard** would:
   - Fetch statistics via API
   - Display privacy-preserving demographics
   - Show trends over time

## Privacy Notes

- ❌ **Never** send raw passport data to the API
- ✅ **Only** send zero-knowledge proofs
- ✅ Proof reveals: age range, continent, uniqueness
- ❌ Proof hides: exact age, country, identity

## API Documentation

For complete API documentation, see:
- `BACKEND_README.md` - Full backend documentation
- `packages/api/README.md` - API-specific details
- OpenAPI/Swagger docs (if available)

## Testing

These examples can be used for:
- Manual API testing
- Integration testing
- Load testing (with modifications)
- Demonstration purposes

## Troubleshooting

**"Connection refused"**
- Ensure API server is running: `pnpm dev:api`
- Check API_URL is correct

**"Census not found"**
- Verify census ID is correct
- Create a census first using `create-census.js`

**"Proof verification failed"**
- This is expected with mock data
- Real proofs require ZK circuit generation

## Contributing

Feel free to add more examples for:
- Closing a census
- Updating Merkle roots
- Checking nullifier existence
- Batch operations
- Error handling
