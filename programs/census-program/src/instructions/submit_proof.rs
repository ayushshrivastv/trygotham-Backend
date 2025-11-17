use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::CensusError;
use crate::utils::{verify_groth16_proof, validate_timestamp};

#[derive(Accounts)]
#[instruction(nullifier_hash: [u8; 32])]
pub struct SubmitProof<'info> {
    #[account(
        mut,
        seeds = [b"census", census.census_id.as_bytes()],
        bump = census.bump,
        constraint = census.active @ CensusError::CensusInactive
    )]
    pub census: Account<'info, Census>,

    #[account(
        init,
        payer = user,
        space = NullifierEntry::MAX_SIZE,
        seeds = [b"nullifier", census.key().as_ref(), &nullifier_hash],
        bump
    )]
    pub nullifier_entry: Account<'info, NullifierEntry>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<SubmitProof>,
    nullifier_hash: [u8; 32],
    age_range: u8,
    continent: u8,
    proof_data: Vec<u8>,
    timestamp: i64,
) -> Result<()> {
    let census = &mut ctx.accounts.census;
    let nullifier_entry = &mut ctx.accounts.nullifier_entry;
    let clock = Clock::get()?;

    // Validate timestamp
    require!(
        validate_timestamp(timestamp, &clock),
        CensusError::InvalidTimestamp
    );

    // Validate age range
    require!(age_range <= 6, CensusError::InvalidAgeRange);

    // Check minimum age requirement
    if census.min_age > 0 {
        require!(age_range >= 1, CensusError::AgeRequirementNotMet); // At least 18+
    }

    // Validate continent
    require!(continent <= 6, CensusError::InvalidContinent);

    // Verify the zero-knowledge proof
    require!(
        verify_groth16_proof(&proof_data)?,
        CensusError::ProofVerificationFailed
    );

    // Initialize nullifier entry
    nullifier_entry.nullifier = nullifier_hash;
    nullifier_entry.census_id = census.census_id.clone();
    nullifier_entry.timestamp = clock.unix_timestamp;
    nullifier_entry.index = census.total_members;
    nullifier_entry.bump = ctx.bumps.nullifier_entry;

    // Update census statistics
    census.total_members = census
        .total_members
        .checked_add(1)
        .ok_or(CensusError::ArithmeticOverflow)?;

    census.age_distribution[age_range as usize] = census.age_distribution[age_range as usize]
        .checked_add(1)
        .ok_or(CensusError::ArithmeticOverflow)?;

    if census.enable_location {
        census.continent_distribution[continent as usize] = census.continent_distribution
            [continent as usize]
            .checked_add(1)
            .ok_or(CensusError::ArithmeticOverflow)?;
    }

    census.last_updated = clock.unix_timestamp;

    msg!(
        "Proof submitted for census: {}, total members: {}",
        census.census_id,
        census.total_members
    );

    Ok(())
}
