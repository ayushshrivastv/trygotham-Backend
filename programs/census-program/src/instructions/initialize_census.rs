use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::CensusError;

#[derive(Accounts)]
#[instruction(census_id: String)]
pub struct InitializeCensus<'info> {
    #[account(
        init,
        payer = creator,
        space = Census::MAX_SIZE,
        seeds = [b"census", census_id.as_bytes()],
        bump
    )]
    pub census: Account<'info, Census>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeCensus>,
    census_id: String,
    name: String,
    description: String,
    enable_location: bool,
    min_age: Option<u8>,
) -> Result<()> {
    // Validate input lengths
    require!(census_id.len() <= 32, CensusError::CensusIdTooLong);
    require!(name.len() <= 64, CensusError::NameTooLong);
    require!(description.len() <= 256, CensusError::DescriptionTooLong);

    let census = &mut ctx.accounts.census;
    let clock = Clock::get()?;

    census.census_id = census_id;
    census.name = name;
    census.description = description;
    census.creator = ctx.accounts.creator.key();
    census.created_at = clock.unix_timestamp;
    census.active = true;
    census.enable_location = enable_location;
    census.min_age = min_age.unwrap_or(0);
    census.total_members = 0;
    census.merkle_root = [0u8; 32];
    census.ipfs_hash = String::new();
    census.age_distribution = [0u64; 7];
    census.continent_distribution = [0u64; 7];
    census.last_updated = clock.unix_timestamp;
    census.bump = ctx.bumps.census;

    msg!("Census initialized: {}", census.census_id);

    Ok(())
}
