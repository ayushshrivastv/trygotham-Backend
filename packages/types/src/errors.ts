/**
 * Base error class for zk-Census
 */
export class ZKCensusError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ZKCensusError';
  }
}

/**
 * Proof verification failed
 */
export class ProofVerificationError extends ZKCensusError {
  constructor(message: string = 'Proof verification failed') {
    super(message, 'PROOF_VERIFICATION_FAILED', 400);
    this.name = 'ProofVerificationError';
  }
}

/**
 * Duplicate nullifier detected
 */
export class DuplicateNullifierError extends ZKCensusError {
  constructor(message: string = 'This identity has already been registered') {
    super(message, 'DUPLICATE_NULLIFIER', 409);
    this.name = 'DuplicateNullifierError';
  }
}

/**
 * Census not found
 */
export class CensusNotFoundError extends ZKCensusError {
  constructor(censusId: string) {
    super(`Census not found: ${censusId}`, 'CENSUS_NOT_FOUND', 404);
    this.name = 'CensusNotFoundError';
  }
}

/**
 * Invalid proof format
 */
export class InvalidProofError extends ZKCensusError {
  constructor(message: string = 'Invalid proof format') {
    super(message, 'INVALID_PROOF', 400);
    this.name = 'InvalidProofError';
  }
}

/**
 * Transaction failed on Solana
 */
export class TransactionError extends ZKCensusError {
  constructor(message: string) {
    super(message, 'TRANSACTION_FAILED', 500);
    this.name = 'TransactionError';
  }
}

/**
 * IPFS operation failed
 */
export class IPFSError extends ZKCensusError {
  constructor(message: string) {
    super(message, 'IPFS_ERROR', 500);
    this.name = 'IPFSError';
  }
}

/**
 * Merkle tree operation failed
 */
export class MerkleTreeError extends ZKCensusError {
  constructor(message: string) {
    super(message, 'MERKLE_TREE_ERROR', 500);
    this.name = 'MerkleTreeError';
  }
}

/**
 * Database operation failed
 */
export class DatabaseError extends ZKCensusError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
  }
}

/**
 * Rate limit exceeded
 */
export class RateLimitError extends ZKCensusError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}
