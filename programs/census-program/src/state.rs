use anchor_lang::prelude::*;

/// Census account storing metadata and statistics
#[account]
#[derive(Default)]
pub struct Census {
    /// Unique census ID (max 32 chars)
    pub census_id: String,
    /// Human-readable name
    pub name: String,
    /// Description
    pub description: String,
    /// Creator's public key
    pub creator: Pubkey,
    /// Creation timestamp
    pub created_at: i64,
    /// Whether census is active
    pub active: bool,
    /// Enable location tracking
    pub enable_location: bool,
    /// Minimum age requirement (0 = none)
    pub min_age: u8,
    /// Total registered members
    pub total_members: u64,
    /// Merkle tree root for nullifiers
    pub merkle_root: [u8; 32],
    /// IPFS hash for full Merkle tree
    pub ipfs_hash: String,
    /// Age distribution [0-17, 18-24, 25-34, 35-44, 45-54, 55-64, 65+]
    pub age_distribution: [u64; 7],
    /// Continent distribution [Africa, Asia, Europe, NAmerica, SAmerica, Oceania, Antarctica]
    pub continent_distribution: [u64; 7],
    /// Last updated timestamp
    pub last_updated: i64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl Census {
    /// Maximum size in bytes for account allocation
    pub const MAX_SIZE: usize = 8 + // discriminator
        (4 + 32) + // census_id (String with length prefix)
        (4 + 64) + // name (String with length prefix)
        (4 + 256) + // description (String with length prefix)
        32 + // creator (Pubkey)
        8 + // created_at (i64)
        1 + // active (bool)
        1 + // enable_location (bool)
        1 + // min_age (u8)
        8 + // total_members (u64)
        32 + // merkle_root ([u8; 32])
        (4 + 64) + // ipfs_hash (String with length prefix)
        (7 * 8) + // age_distribution ([u64; 7])
        (7 * 8) + // continent_distribution ([u64; 7])
        8 + // last_updated (i64)
        1 + // bump (u8)
        64; // padding for future fields
}

/// Nullifier entry to prevent double registration
#[account]
#[derive(Default)]
pub struct NullifierEntry {
    /// The nullifier hash
    pub nullifier: [u8; 32],
    /// Census ID this nullifier belongs to
    pub census_id: String,
    /// Registration timestamp
    pub timestamp: i64,
    /// Merkle tree index
    pub index: u64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl NullifierEntry {
    pub const MAX_SIZE: usize = 8 + // discriminator
        32 + // nullifier ([u8; 32])
        (4 + 32) + // census_id (String with length prefix)
        8 + // timestamp (i64)
        8 + // index (u64)
        1 + // bump (u8)
        16; // padding
}

/// Census statistics returned from queries
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct CensusStats {
    pub total_members: u64,
    pub age_distribution: [u64; 7],
    pub continent_distribution: [u64; 7],
    pub last_updated: i64,
}

/// Age ranges enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum AgeRange {
    Range0To17 = 0,
    Range18To24 = 1,
    Range25To34 = 2,
    Range35To44 = 3,
    Range45To54 = 4,
    Range55To64 = 5,
    Range65Plus = 6,
}

impl AgeRange {
    pub fn from_u8(value: u8) -> Option<Self> {
        match value {
            0 => Some(AgeRange::Range0To17),
            1 => Some(AgeRange::Range18To24),
            2 => Some(AgeRange::Range25To34),
            3 => Some(AgeRange::Range35To44),
            4 => Some(AgeRange::Range45To54),
            5 => Some(AgeRange::Range55To64),
            6 => Some(AgeRange::Range65Plus),
            _ => None,
        }
    }
}

/// Continent enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Continent {
    Africa = 0,
    Asia = 1,
    Europe = 2,
    NorthAmerica = 3,
    SouthAmerica = 4,
    Oceania = 5,
    Antarctica = 6,
}

impl Continent {
    pub fn from_u8(value: u8) -> Option<Self> {
        match value {
            0 => Some(Continent::Africa),
            1 => Some(Continent::Asia),
            2 => Some(Continent::Europe),
            3 => Some(Continent::NorthAmerica),
            4 => Some(Continent::SouthAmerica),
            5 => Some(Continent::Oceania),
            6 => Some(Continent::Antarctica),
            _ => None,
        }
    }
}
