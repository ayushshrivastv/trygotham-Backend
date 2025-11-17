use anchor_lang::prelude::*;

#[error_code]
pub enum CensusError {
    #[msg("Invalid proof data")]
    InvalidProof,

    #[msg("Proof verification failed")]
    ProofVerificationFailed,

    #[msg("Duplicate nullifier - already registered")]
    DuplicateNullifier,

    #[msg("Census is not active")]
    CensusInactive,

    #[msg("Invalid age range")]
    InvalidAgeRange,

    #[msg("Invalid continent code")]
    InvalidContinent,

    #[msg("Age requirement not met")]
    AgeRequirementNotMet,

    #[msg("Census ID too long (max 32 characters)")]
    CensusIdTooLong,

    #[msg("Name too long (max 64 characters)")]
    NameTooLong,

    #[msg("Description too long (max 256 characters)")]
    DescriptionTooLong,

    #[msg("IPFS hash too long (max 64 characters)")]
    IpfsHashTooLong,

    #[msg("Unauthorized - only creator can perform this action")]
    Unauthorized,

    #[msg("Timestamp too old or in future")]
    InvalidTimestamp,

    #[msg("Merkle root update failed")]
    MerkleRootUpdateFailed,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
