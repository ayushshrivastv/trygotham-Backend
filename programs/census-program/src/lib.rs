use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub mod state;
pub mod instructions;
pub mod errors;
pub mod utils;

use instructions::*;
use state::*;

#[program]
pub mod zk_census {
    use super::*;

    /// Initialize a new census
    pub fn initialize_census(
        ctx: Context<InitializeCensus>,
        census_id: String,
        name: String,
        description: String,
        enable_location: bool,
        min_age: Option<u8>,
    ) -> Result<()> {
        instructions::initialize_census::handler(
            ctx,
            census_id,
            name,
            description,
            enable_location,
            min_age,
        )
    }

    /// Submit a zero-knowledge proof for census registration
    pub fn submit_proof(
        ctx: Context<SubmitProof>,
        nullifier_hash: [u8; 32],
        age_range: u8,
        continent: u8,
        proof_data: Vec<u8>,
        timestamp: i64,
    ) -> Result<()> {
        instructions::submit_proof::handler(
            ctx,
            nullifier_hash,
            age_range,
            continent,
            proof_data,
            timestamp,
        )
    }

    /// Update census merkle root (admin only)
    pub fn update_merkle_root(
        ctx: Context<UpdateMerkleRoot>,
        new_root: [u8; 32],
        ipfs_hash: String,
    ) -> Result<()> {
        instructions::update_merkle_root::handler(ctx, new_root, ipfs_hash)
    }

    /// Close census (admin only)
    pub fn close_census(ctx: Context<CloseCensus>) -> Result<()> {
        instructions::close_census::handler(ctx)
    }

    /// Get census statistics
    pub fn get_stats(ctx: Context<GetStats>) -> Result<CensusStats> {
        instructions::get_stats::handler(ctx)
    }
}
