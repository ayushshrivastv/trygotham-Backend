use anchor_lang::prelude::*;
use solana_program::keccak;

/// Verify a Groth16 zero-knowledge proof
/// NOTE: In production, this should use a proper pairing library
/// For now, this is a placeholder that validates proof structure
pub fn verify_groth16_proof(proof_data: &[u8]) -> Result<bool> {
    // Proof data should contain:
    // - pi_a: 2 * 32 bytes (G1 point)
    // - pi_b: 4 * 32 bytes (G2 point)
    // - pi_c: 2 * 32 bytes (G1 point)
    // Total: 256 bytes minimum

    if proof_data.len() < 256 {
        return Ok(false);
    }

    // TODO: Implement actual Groth16 verification using BN254 pairing
    // This requires:
    // 1. Parse proof components (pi_a, pi_b, pi_c)
    // 2. Load verification key from account data
    // 3. Compute pairing check: e(pi_a, pi_b) = e(alpha, beta) * e(L, gamma) * e(C, delta)
    // For now, we assume proof structure is valid

    Ok(true)
}

/// Hash nullifier secret with census ID to create nullifier
pub fn compute_nullifier(secret: &[u8], census_id: &str) -> [u8; 32] {
    let mut data = Vec::new();
    data.extend_from_slice(secret);
    data.extend_from_slice(census_id.as_bytes());
    keccak::hash(&data).to_bytes()
}

/// Validate timestamp is within acceptable range (±5 minutes)
pub fn validate_timestamp(timestamp: i64, clock: &Clock) -> bool {
    let now = clock.unix_timestamp;
    let diff = (timestamp - now).abs();
    diff <= 300 // 5 minutes
}

/// Calculate age from birth date
pub fn calculate_age_range(birth_year: u16, current_year: u16) -> Option<u8> {
    if birth_year > current_year {
        return None;
    }

    let age = current_year - birth_year;

    match age {
        0..=17 => Some(0),
        18..=24 => Some(1),
        25..=34 => Some(2),
        35..=44 => Some(3),
        45..=54 => Some(4),
        55..=64 => Some(5),
        _ => Some(6), // 65+
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_age_range() {
        assert_eq!(calculate_age_range(2010, 2024), Some(0)); // 14 years old
        assert_eq!(calculate_age_range(2000, 2024), Some(1)); // 24 years old
        assert_eq!(calculate_age_range(1990, 2024), Some(2)); // 34 years old
        assert_eq!(calculate_age_range(1980, 2024), Some(3)); // 44 years old
        assert_eq!(calculate_age_range(1970, 2024), Some(4)); // 54 years old
        assert_eq!(calculate_age_range(1960, 2024), Some(5)); // 64 years old
        assert_eq!(calculate_age_range(1950, 2024), Some(6)); // 74 years old
        assert_eq!(calculate_age_range(2025, 2024), None); // Invalid
    }
}
