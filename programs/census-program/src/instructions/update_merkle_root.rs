use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::CensusError;

#[derive(Accounts)]
pub struct UpdateMerkleRoot<'info> {
    #[account(
        mut,
        seeds = [b"census", census.census_id.as_bytes()],
        bump = census.bump,
        constraint = census.creator == creator.key() @ CensusError::Unauthorized
    )]
    pub census: Account<'info, Census>,

    pub creator: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateMerkleRoot>,
    new_root: [u8; 32],
    ipfs_hash: String,
) -> Result<()> {
    require!(ipfs_hash.len() <= 64, CensusError::IpfsHashTooLong);

    let census = &mut ctx.accounts.census;
    let clock = Clock::get()?;

    census.merkle_root = new_root;
    census.ipfs_hash = ipfs_hash.clone();
    census.last_updated = clock.unix_timestamp;

    msg!(
        "Merkle root updated for census: {}, IPFS: {}",
        census.census_id,
        ipfs_hash
    );

    Ok(())
}
