import { groth16 } from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';
import { CircuitInput, ZKProof, ProofPublicSignals } from '@zk-census/types';

/**
 * Generate a zero-knowledge proof for census registration
 */
export async function generateCensusProof(
  input: CircuitInput,
  wasmPath?: string,
  zkeyPath?: string
): Promise<{ proof: ZKProof; publicSignals: ProofPublicSignals }> {
  const defaultWasmPath = path.join(__dirname, '../build/census_js/census.wasm');
  const defaultZkeyPath = path.join(__dirname, '../build/census.zkey');

  const wasm = wasmPath || defaultWasmPath;
  const zkey = zkeyPath || defaultZkeyPath;

  // Ensure files exist
  if (!fs.existsSync(wasm)) {
    throw new Error(`WASM file not found: ${wasm}`);
  }
  if (!fs.existsSync(zkey)) {
    throw new Error(`zKey file not found: ${zkey}`);
  }

  // Generate the proof
  const { proof, publicSignals } = await groth16.fullProve(input, wasm, zkey);

  // Format proof for our system
  const zkProof: ZKProof = {
    pi_a: [proof.pi_a[0], proof.pi_a[1]],
    pi_b: [
      [proof.pi_b[0][0], proof.pi_b[0][1]],
      [proof.pi_b[1][0], proof.pi_b[1][1]],
    ],
    pi_c: [proof.pi_c[0], proof.pi_c[1]],
    protocol: 'groth16',
    curve: 'bn128',
  };

  // Parse public signals
  const parsedSignals: ProofPublicSignals = {
    nullifierHash: publicSignals[0],
    ageRange: parseInt(publicSignals[1]),
    continent: parseInt(publicSignals[2]),
    censusId: publicSignals[3],
    timestamp: parseInt(publicSignals[4]),
  };

  return { proof: zkProof, publicSignals: parsedSignals };
}

/**
 * Verify a zero-knowledge proof
 */
export async function verifyCensusProof(
  proof: ZKProof,
  publicSignals: ProofPublicSignals,
  vKeyPath?: string
): Promise<boolean> {
  const defaultVKeyPath = path.join(__dirname, '../build/verification_key.json');
  const vKey = vKeyPath || defaultVKeyPath;

  if (!fs.existsSync(vKey)) {
    throw new Error(`Verification key not found: ${vKey}`);
  }

  const verificationKey = JSON.parse(fs.readFileSync(vKey, 'utf-8'));

  // Convert our proof format to snarkjs format
  const snarkProof = {
    pi_a: proof.pi_a,
    pi_b: proof.pi_b,
    pi_c: proof.pi_c,
    protocol: proof.protocol,
    curve: proof.curve,
  };

  // Convert public signals to array format
  const signalsArray = [
    publicSignals.nullifierHash,
    publicSignals.ageRange.toString(),
    publicSignals.continent.toString(),
    publicSignals.censusId,
    publicSignals.timestamp.toString(),
  ];

  return await groth16.verify(verificationKey, signalsArray, snarkProof);
}

/**
 * Export verification key
 */
export async function exportVerificationKey(zkeyPath?: string): Promise<object> {
  const defaultZkeyPath = path.join(__dirname, '../build/census.zkey');
  const zkey = zkeyPath || defaultZkeyPath;

  if (!fs.existsSync(zkey)) {
    throw new Error(`zKey file not found: ${zkey}`);
  }

  return await groth16.exportVerificationKey(zkey);
}

/**
 * Calculate nullifier hash from secret
 */
export function calculateNullifier(
  secret: string,
  censusId: string,
  passportNumber: string
): string {
  const crypto = require('crypto');
  const data = `${secret}${censusId}${passportNumber}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export * from './utils';
