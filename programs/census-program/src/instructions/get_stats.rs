use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct GetStats<'info> {
    #[account(
        seeds = [b"census", census.census_id.as_bytes()],
        bump = census.bump
    )]
    pub census: Account<'info, Census>,
}

pub fn handler(ctx: Context<GetStats>) -> Result<CensusStats> {
    let census = &ctx.accounts.census;

    Ok(CensusStats {
        total_members: census.total_members,
        age_distribution: census.age_distribution,
        continent_distribution: census.continent_distribution,
        last_updated: census.last_updated,
    })
}
