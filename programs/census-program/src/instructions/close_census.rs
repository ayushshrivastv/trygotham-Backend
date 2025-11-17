use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::CensusError;

#[derive(Accounts)]
pub struct CloseCensus<'info> {
    #[account(
        mut,
        seeds = [b"census", census.census_id.as_bytes()],
        bump = census.bump,
        constraint = census.creator == creator.key() @ CensusError::Unauthorized
    )]
    pub census: Account<'info, Census>,

    pub creator: Signer<'info>,
}

pub fn handler(ctx: Context<CloseCensus>) -> Result<()> {
    let census = &mut ctx.accounts.census;
    let clock = Clock::get()?;

    census.active = false;
    census.last_updated = clock.unix_timestamp;

    msg!("Census closed: {}", census.census_id);

    Ok(())
}
