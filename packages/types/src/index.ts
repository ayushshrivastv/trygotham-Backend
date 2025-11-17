import { PublicKey } from '@solana/web3.js';

/**
 * Age ranges for privacy-preserving demographics
 */
export enum AgeRange {
  RANGE_0_17 = 0,
  RANGE_18_24 = 1,
  RANGE_25_34 = 2,
  RANGE_35_44 = 3,
  RANGE_45_54 = 4,
  RANGE_55_64 = 5,
  RANGE_65_PLUS = 6,
}

/**
 * Continent codes for location privacy
 */
export enum Continent {
  AFRICA = 0,
  ASIA = 1,
  EUROPE = 2,
  NORTH_AMERICA = 3,
  SOUTH_AMERICA = 4,
  OCEANIA = 5,
  ANTARCTICA = 6,
}

/**
 * Census registration status
 */
export enum RegistrationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

/**
 * Zero-knowledge proof data structure
 */
export interface ZKProof {
  /** Groth16 proof components */
  pi_a: [string, string];
  pi_b: [[string, string], [string, string]];
  pi_c: [string, string];
  /** Protocol identifier */
  protocol: 'groth16';
  /** Curve type */
  curve: 'bn128';
}

/**
 * Public signals for the ZK proof
 */
export interface ProofPublicSignals {
  /** Nullifier hash to prevent double registration */
  nullifierHash: string;
  /** Age range (0-6) */
  ageRange: AgeRange;
  /** Continent code (0-6) */
  continent: Continent;
  /** Census ID (identifies which census this is for) */
  censusId: string;
  /** Timestamp of proof generation */
  timestamp: number;
}

/**
 * Complete census registration proof
 */
export interface CensusProof {
  /** The zero-knowledge proof */
  proof: ZKProof;
  /** Public signals */
  publicSignals: ProofPublicSignals;
}

/**
 * Passport MRZ (Machine Readable Zone) data
 * This is extracted on-device and NEVER stored
 */
export interface PassportMRZ {
  /** Document type (P for passport) */
  documentType: string;
  /** Issuing country code */
  issuingCountry: string;
  /** Passport holder's surname */
  surname: string;
  /** Passport holder's given names */
  givenNames: string;
  /** Passport number */
  passportNumber: string;
  /** Nationality */
  nationality: string;
  /** Date of birth (YYMMDD) */
  dateOfBirth: string;
  /** Sex (M/F/X) */
  sex: string;
  /** Expiry date (YYMMDD) */
  expiryDate: string;
  /** Optional personal number */
  personalNumber?: string;
}

/**
 * Nullifier entry stored on-chain
 */
export interface NullifierEntry {
  /** The nullifier hash */
  nullifier: string;
  /** When it was registered */
  timestamp: number;
  /** Merkle tree index */
  index: number;
}

/**
 * Census statistics (aggregated, privacy-preserving)
 */
export interface CensusStats {
  /** Total number of registered members */
  totalMembers: number;
  /** Distribution by age range */
  ageDistribution: {
    [key in AgeRange]: number;
  };
  /** Distribution by continent */
  continentDistribution: {
    [key in Continent]: number;
  };
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Census metadata
 */
export interface CensusMetadata {
  /** Unique census ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description */
  description: string;
  /** Creator's public key */
  creator: PublicKey;
  /** Creation timestamp */
  createdAt: number;
  /** Whether census is active */
  active: boolean;
  /** Merkle tree root for nullifiers */
  merkleRoot: string;
  /** IPFS hash for full Merkle tree */
  ipfsHash?: string;
}

/**
 * API request to submit a census proof
 */
export interface SubmitProofRequest {
  /** The census ID */
  censusId: string;
  /** The proof data */
  proof: CensusProof;
  /** Signature from user's wallet */
  signature: string;
  /** User's public key */
  publicKey: string;
}

/**
 * API response for proof submission
 */
export interface SubmitProofResponse {
  /** Whether submission was successful */
  success: boolean;
  /** Transaction signature on Solana */
  transactionSignature?: string;
  /** Error message if failed */
  error?: string;
  /** Updated statistics */
  stats?: CensusStats;
}

/**
 * Database model for census registration (off-chain)
 */
export interface CensusRegistrationRecord {
  id: string;
  censusId: string;
  nullifierHash: string;
  ageRange: AgeRange;
  continent: Continent;
  timestamp: number;
  transactionSignature: string;
  status: RegistrationStatus;
}

/**
 * Merkle tree node
 */
export interface MerkleNode {
  /** Hash value */
  hash: string;
  /** Left child hash */
  left?: string;
  /** Right child hash */
  right?: string;
  /** Leaf index (if leaf node) */
  index?: number;
}

/**
 * Merkle proof for nullifier inclusion
 */
export interface MerkleProof {
  /** Leaf value */
  leaf: string;
  /** Sibling hashes (bottom to top) */
  siblings: string[];
  /** Path indices (0 = left, 1 = right) */
  pathIndices: number[];
  /** Root hash */
  root: string;
}

/**
 * Circuit input for ZK proof generation
 * NOTE: This is used client-side only, never transmitted
 */
export interface CircuitInput {
  /** Passport data (hashed) */
  passportHash: string;
  /** Date of birth as unix timestamp */
  dateOfBirth: number;
  /** Current timestamp */
  currentTimestamp: number;
  /** Nationality code */
  nationalityCode: number;
  /** Secret nullifier (user's private input) */
  nullifierSecret: string;
  /** Census ID */
  censusId: string;
}

/**
 * Configuration for census creation
 */
export interface CreateCensusConfig {
  /** Census name */
  name: string;
  /** Description */
  description: string;
  /** Whether to enable location tracking */
  enableLocation: boolean;
  /** Minimum age requirement (optional) */
  minAge?: number;
  /** Allowed continents (optional, empty = all allowed) */
  allowedContinents?: Continent[];
}

export * from './errors';
