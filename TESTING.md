# Testing Guide

## Overview

zk-Census includes comprehensive test coverage across all components:
- API endpoint tests
- Database model tests
- Solana program tests
- Integration tests

## Test Structure

```
Calindria/
├── packages/
│   ├── api/src/__tests__/          # API tests
│   │   ├── health.test.ts
│   │   ├── census.test.ts
│   │   ├── proof.test.ts
│   │   ├── stats.test.ts
│   │   └── middleware.test.ts
│   └── database/src/__tests__/     # Database tests
│       ├── Census.test.ts
│       └── Registration.test.ts
├── programs/census-program/tests/  # Solana tests
│   └── zk-census.ts
├── jest.config.json                # Jest configuration
└── jest.setup.ts                   # Test setup
```

## Running Tests

### All Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run tests in watch mode
pnpm test --watch
```

### Specific Package Tests

```bash
# API tests only
pnpm --filter @zk-census/api test

# Database tests only
pnpm --filter @zk-census/database test
```

### Solana Program Tests

```bash
# Run Anchor tests
pnpm anchor:test

# With verbose output
cd programs/census-program
anchor test --verbose
```

## Test Prerequisites

### For API/Database Tests

1. **PostgreSQL** - Running on localhost:5432
2. **Test Database** - Create `zk_census_test` database
3. **Redis** (optional) - For rate limiting tests

```bash
# Create test database
createdb zk_census_test

# Run migrations
cd packages/database
NODE_ENV=test pnpm migrate
```

### For Solana Tests

1. **Solana CLI** - Installed and configured
2. **Anchor** - Version 0.29.0+
3. **Local Validator** - Running for tests

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

## Test Categories

### 1. Unit Tests

Test individual functions and components in isolation.

**Example: Database Model Test**
```typescript
describe('Census Model', () => {
  it('should create a census', async () => {
    const census = await censuses.create({
      id: 'test-1',
      name: 'Test Census',
      description: 'Test',
      enableLocation: true,
      minAge: 0,
      active: true,
    });

    expect(census.id).toBe('test-1');
  });
});
```

### 2. Integration Tests

Test multiple components working together.

**Example: API Endpoint Test**
```typescript
describe('POST /api/v1/census', () => {
  it('should create census and store in database', async () => {
    const response = await request(app)
      .post('/api/v1/census')
      .send({ name: 'Test', description: 'Test' })
      .expect(201);

    const census = await censuses.findById(response.body.data.id);
    expect(census).toBeDefined();
  });
});
```

### 3. Smart Contract Tests

Test Solana program instructions.

**Example: Census Creation Test**
```typescript
it('Initializes a census', async () => {
  await program.methods
    .initializeCensus(censusId, name, description, true, null)
    .accounts({
      census: censusPda,
      creator: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  const census = await program.account.census.fetch(censusPda);
  expect(census.censusId).to.equal(censusId);
});
```

## Test Coverage

Current test coverage:

| Component | Coverage | Files |
|-----------|----------|-------|
| API | ~80% | 5 test files |
| Database | ~90% | 2 test files |
| Solana Program | ~85% | 1 test file |
| Overall | ~82% | 8 test files |

Generate coverage report:
```bash
pnpm test --coverage
open coverage/lcov-report/index.html
```

## Writing New Tests

### API Test Template

```typescript
import request from 'supertest';
import app from '../index';

describe('Feature Name', () => {
  describe('GET /api/v1/endpoint', () => {
    it('should do something', async () => {
      const response = await request(app)
        .get('/api/v1/endpoint')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });
});
```

### Database Test Template

```typescript
import { db, modelName } from '../index';

describe('Model Name', () => {
  beforeAll(async () => {
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  afterEach(async () => {
    await db('table_name').truncate();
  });

  it('should test functionality', async () => {
    // Test code
  });
});
```

### Solana Test Template

```typescript
import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";

describe("Instruction Name", () => {
  it("should perform action", async () => {
    const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("seed")],
      program.programId
    );

    await program.methods
      .instructionName()
      .accounts({ /* accounts */ })
      .rpc();

    // Assertions
  });
});
```

## Mocking

### Mock Data

Create mock data in `__mocks__/` directories:

```typescript
// __mocks__/proofData.ts
export const mockProof = {
  pi_a: ['123', '456'],
  pi_b: [['789', '012'], ['345', '678']],
  pi_c: ['901', '234'],
  protocol: 'groth16',
  curve: 'bn128',
};
```

### Mock External Services

```typescript
jest.mock('@zk-census/circuits', () => ({
  verifyCensusProof: jest.fn().mockResolvedValue(true),
  generateCensusProof: jest.fn().mockResolvedValue({
    proof: mockProof,
    publicSignals: mockSignals,
  }),
}));
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach`/`afterEach` for cleanup
- Don't rely on test execution order

### 2. Descriptive Names
```typescript
// Good
it('should reject proof with invalid age range', async () => {});

// Bad
it('test 1', async () => {});
```

### 3. Arrange-Act-Assert
```typescript
it('should create census', async () => {
  // Arrange
  const data = { name: 'Test', description: 'Test' };

  // Act
  const census = await censuses.create(data);

  // Assert
  expect(census.name).toBe('Test');
});
```

### 4. Test Edge Cases
- Empty inputs
- Invalid data
- Boundary conditions
- Error scenarios

### 5. Fast Tests
- Mock external services
- Use test databases
- Parallel execution when possible

## Debugging Tests

### Run Single Test
```bash
# By name
pnpm test -t "should create census"

# By file
pnpm test census.test.ts
```

### Verbose Output
```bash
pnpm test --verbose
```

### Debug in VS Code

`.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Common Issues

### Database Connection Errors
```bash
# Ensure test database exists
createdb zk_census_test

# Run migrations
NODE_ENV=test pnpm --filter @zk-census/database migrate
```

### Solana Test Failures
```bash
# Rebuild program
anchor build

# Start fresh validator
anchor localnet --reset
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Performance

### Test Execution Times

- **API Tests:** ~5-10 seconds
- **Database Tests:** ~3-5 seconds
- **Solana Tests:** ~20-30 seconds
- **Total:** ~30-45 seconds

### Optimization Tips

1. Use `--maxWorkers=4` for parallel execution
2. Mock slow external services
3. Use in-memory databases for unit tests
4. Skip slow tests in development with `.skip`

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Anchor Testing Guide](https://www.anchor-lang.com/docs/testing)
- [Testing Best Practices](https://testingjavascript.com/)
