use anchor_lang::{
    prelude::*,
};
// use solana_program::borsh::try_from_slice_unchecked;
use solana_program::program::{invoke_signed, invoke};
use solana_program::{
    system_instruction,
};
use anchor_spl::{
    token::{self, Token, TokenAccount, Transfer, Burn, Mint },
};
use metaplex_token_metadata::state::Metadata;

pub mod account;
pub mod error;
pub mod constants;

use account::*;
use error::*;
use constants::*;

declare_id!("5bw4QGFgrxigxxP5m3S7v7fZoF9a1F2QAMnxjhMjZKfR");

#[program]
pub mod mds_marketplace {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, _global_bump: u8, _escrow_bump: u8) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        global_authority.super_admin = ctx.accounts.admin.key();
        
        Ok(())
    }
    pub fn update_fee(
        ctx: Context<SetTreshold>,
        _global_bump: u8,
        sol_fee: u64,
        token_fee: u64,
    ) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        require!(global_authority.super_admin == ctx.accounts.admin.key(), MarketplaceError::InvalidSuperOwner);
        require!(sol_fee < 1000 && token_fee < 1000, MarketplaceError::InvalidFeePercent);

        global_authority.market_fee_sol = sol_fee;
        global_authority.market_fee_token = token_fee;
        Ok(())
    }
    pub fn add_team_treasury(
        ctx: Context<AddTreasury>,
        _global_bump: u8,
        address: Pubkey,
        rate: u64,
    ) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        require!(global_authority.super_admin == ctx.accounts.admin.key(), MarketplaceError::InvalidSuperOwner);
        require!(global_authority.team_count < 8, MarketplaceError::MaxTeamCountExceed);
        require!(rate < 1000, MarketplaceError::InvalidFeePercent);

        let mut exist: u8 = 0;
        let mut sum: u64 = 0;
        for i in 0..global_authority.team_count {
            let index = i as usize;
            if global_authority.team_treasury[index].eq(&address) {
                exist = 1;
            }
            sum += global_authority.treasury_rate[index];
        }
        require!(exist == 0, MarketplaceError::TreasuryAddressAlreadyAdded);
        require!(sum < 1000, MarketplaceError::MaxTreasuryRateSumExceed);

        let index: usize = global_authority.team_count as usize;
        global_authority.team_treasury[index] = address;
        global_authority.treasury_rate[index] = rate;
        global_authority.team_count += 1;
        Ok(())
    }
    pub fn remove_team_treasury(
        ctx: Context<RemoveTreasury>,
        _global_bump: u8,
        address: Pubkey,
    ) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        require!(global_authority.super_admin == ctx.accounts.admin.key(), MarketplaceError::InvalidSuperOwner);
        require!(global_authority.team_count > 0, MarketplaceError::NoTeamTreasuryYet);

        let mut exist: u8 = 0;
        for i in 0..global_authority.team_count {
            let index = i as usize;
            if global_authority.team_treasury[index].eq(&address) {
                if i < global_authority.team_count - 1 {
                    let last_idx = (global_authority.team_count - 1) as usize;
                    global_authority.team_treasury[index] = global_authority.team_treasury[last_idx];
                    global_authority.treasury_rate[index] = global_authority.treasury_rate[last_idx];
                }
                global_authority.team_count -= 1;
                exist = 1;
            }
        }
        require!(exist == 1, MarketplaceError::TreasuryAddressNotFound);
        Ok(())
    }

    pub fn init_user_pool(ctx: Context<InitUserPool>, _bump: u8) -> Result<()> {
        let user_pool = &mut ctx.accounts.user_pool;
        user_pool.address = ctx.accounts.owner.key();
        Ok(())
    }
    pub fn init_sell_data(ctx: Context<InitSellData>, nft: Pubkey, _bump: u8) -> Result<()> {
        let sell_data_info = &mut ctx.accounts.sell_data_info;
        sell_data_info.mint = nft;
        Ok(())
    }
    
    pub fn list_nft_for_sale(
        ctx: Context<ListNftForSale>,
        _global_bump: u8,
        _sell_bump: u8,
        price_sol: u64,
        price_token: u64,
    ) -> Result<()> {
        let sell_data_info = &mut ctx.accounts.sell_data_info;
        msg!("Mint: {:?}", sell_data_info.mint);

        // Assert NFT Pubkey with Sell Data PDA Mint
        require!(ctx.accounts.nft_mint.key().eq(&sell_data_info.mint), MarketplaceError::InvalidNFTDataAcount);
        
        let mint_metadata = &mut &ctx.accounts.mint_metadata;
        msg!("Metadata Account: {:?}", ctx.accounts.mint_metadata.key());
        let (metadata, _) = Pubkey::find_program_address(
            &[
                metaplex_token_metadata::state::PREFIX.as_bytes(),
                metaplex_token_metadata::id().as_ref(),
                ctx.accounts.nft_mint.key().as_ref(),
            ],
            &metaplex_token_metadata::id(),
        );
        require!(metadata == mint_metadata.key(), MarketplaceError::InvaliedMetadata);

        // verify metadata is legit
        let nft_metadata = Metadata::from_account_info(mint_metadata)?;

        if let Some(creators) = nft_metadata.data.creators {
            let mut collection: Pubkey = Pubkey::default();
            for creator in creators {       
                if creator.verified == true {
                    collection = creator.address;
                    break;
                }
            }
            sell_data_info.collection = collection;
            msg!("Collection= {:?}", collection);
        } else {
            return Err(error!(MarketplaceError::MetadataCreatorParseError));
        };

        let timestamp = Clock::get()?.unix_timestamp;
        msg!("Listed Date: {}", timestamp);

        sell_data_info.seller = ctx.accounts.owner.key();
        sell_data_info.price_sol = price_sol;
        sell_data_info.price_token = price_token;
        sell_data_info.listed_date = timestamp;
        sell_data_info.active = 1;

        let token_account_info = &mut &ctx.accounts.user_token_account;
        let dest_token_account_info = &mut &ctx.accounts.dest_nft_token_account;
        let token_program = &mut &ctx.accounts.token_program;

        let cpi_accounts = Transfer {
            from: token_account_info.to_account_info().clone(),
            to: dest_token_account_info.to_account_info().clone(),
            authority: ctx.accounts.owner.to_account_info().clone()
        };
        token::transfer(
            CpiContext::new(token_program.clone().to_account_info(), cpi_accounts),
            1
        )?;
        
        Ok(())
    }
    
    pub fn delist_nft(
        ctx: Context<DelistNft>,
        global_bump: u8,
        _sell_bump: u8,
    ) -> Result<()> {
        let sell_data_info = &mut ctx.accounts.sell_data_info;
        msg!("Mint: {:?}", sell_data_info.mint);

        // Assert NFT Pubkey with Sell Data PDA Mint
        require!(ctx.accounts.nft_mint.key().eq(&sell_data_info.mint), MarketplaceError::InvalidNFTDataAcount);
        require!(ctx.accounts.owner.key().eq(&sell_data_info.seller), MarketplaceError::SellerMismatch);
        require!(sell_data_info.active == 1, MarketplaceError::NotListedNFT);

        sell_data_info.active = 0;

        let token_account_info = &mut &ctx.accounts.user_token_account;
        let dest_token_account_info = &mut &ctx.accounts.dest_nft_token_account;
        let token_program = &mut &ctx.accounts.token_program;
        let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: dest_token_account_info.to_account_info().clone(),
            to: token_account_info.to_account_info().clone(),
            authority: ctx.accounts.global_authority.to_account_info()
        };
        token::transfer(
            CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
            1
        )?;

        invoke_signed(
            &spl_token::instruction::close_account(
                token_program.key,
                &dest_token_account_info.key(),
                ctx.accounts.owner.key,
                &ctx.accounts.global_authority.key(),
                &[],
            )?,
            &[
                token_program.clone().to_account_info(),
                dest_token_account_info.to_account_info().clone(),
                ctx.accounts.owner.to_account_info().clone(),
                ctx.accounts.global_authority.to_account_info().clone(),
            ],
            signer,
        )?;
        
        Ok(())
    }

    pub fn purchase(
        ctx: Context<PurchaseNft>,
        global_bump: u8,
        _sell_bump: u8,
        _user_bump: u8,
        by_token: u8,
    ) -> Result<()> {
        require!(by_token < 2, MarketplaceError::InvalidParamInput);
        let global_authority = &mut ctx.accounts.global_authority;
        let sell_data_info = &mut ctx.accounts.sell_data_info;
        let user_pool = &mut ctx.accounts.user_pool;
        msg!("Purchase Mint: {:?}, By Token: {}", sell_data_info.mint, by_token == 1);

        // Assert NFT Pubkey with Sell Data PDA Mint
        require!(ctx.accounts.nft_mint.key().eq(&sell_data_info.mint), MarketplaceError::InvalidNFTDataAcount);
        require!(sell_data_info.active == 1, MarketplaceError::NotListedNFT);
        // Assert Seller Info
        require!(ctx.accounts.seller.key().eq(&sell_data_info.seller), MarketplaceError::SellerAcountMismatch);

        sell_data_info.active = 0;

        let nft_token_account_info = &mut &ctx.accounts.user_nft_token_account;
        let dest_nft_token_account_info = &mut &ctx.accounts.dest_nft_token_account;
        let buyer_token_account_info = &mut &ctx.accounts.user_token_account;
        let seller_token_account_info = &mut &ctx.accounts.seller_token_account;
        let token_program = &mut &ctx.accounts.token_program;
        let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];
        let signer = &[&seeds[..]];

        if by_token == 0 {
            invoke(&system_instruction::transfer(ctx.accounts.buyer.key, ctx.accounts.seller.key, sell_data_info.price_sol),
                &[
                    ctx.accounts.buyer.to_account_info().clone(),
                    ctx.accounts.seller.to_account_info().clone(),
                    ctx.accounts.system_program.to_account_info().clone(),
                ]
            )?;
            user_pool.traded_volume += sell_data_info.price_sol;
        } else {
            let cpi_accounts = Transfer {
                from: buyer_token_account_info.to_account_info().clone(),
                to: seller_token_account_info.to_account_info().clone(),
                authority: ctx.accounts.buyer.to_account_info()
            };
            token::transfer(
                CpiContext::new(token_program.clone().to_account_info(), cpi_accounts),
                sell_data_info.price_token,
            )?;
            user_pool.traded_token_volume += sell_data_info.price_token;
        }

        let cpi_accounts = Transfer {
            from: dest_nft_token_account_info.to_account_info().clone(),
            to: nft_token_account_info.to_account_info().clone(),
            authority: ctx.accounts.global_authority.to_account_info()
        };
        token::transfer(
            CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
            1
        )?;

        invoke_signed(
            &spl_token::instruction::close_account(
                token_program.key,
                &dest_nft_token_account_info.key(),
                ctx.accounts.buyer.key,
                &ctx.accounts.global_authority.key(),
                &[],
            )?,
            &[
                token_program.clone().to_account_info(),
                dest_nft_token_account_info.to_account_info().clone(),
                ctx.accounts.buyer.to_account_info().clone(),
                ctx.accounts.global_authority.to_account_info().clone(),
            ],
            signer,
        )?;

        Ok(())
    }

    pub fn deposit_to_escrow(
        ctx: Context<Deposit>,
        _user_bump: u8,
        _escrow_bump: u8,
        sol: u64,
        token: u64,
    ) -> Result<()> {
        require!(sol > 0 || token > 0, MarketplaceError::InvalidParamInput);

        let user_pool = &mut ctx.accounts.user_pool;
        msg!("User: {:?}, Sol Deposit: {}, Token Deposit: {}", user_pool.address, sol, token);

        // Assert User Pubkey with User Data PDA Address
        require!(ctx.accounts.owner.key().eq(&user_pool.address), MarketplaceError::InvalidOwner);

        let user_token_account_info = &mut &ctx.accounts.user_token_account;
        let vault_token_account_info = &mut &ctx.accounts.escrow_token_account;
        let token_program = &mut &ctx.accounts.token_program;

        if sol > 0 {
            invoke(&system_instruction::transfer(ctx.accounts.owner.key, ctx.accounts.escrow_vault.key, sol),
                &[
                    ctx.accounts.owner.to_account_info().clone(),
                    ctx.accounts.escrow_vault.to_account_info().clone(),
                    ctx.accounts.system_program.to_account_info().clone(),
                ]
            )?;
            user_pool.escrow_sol_balance += sol;
        }

        if token > 0 {
            let cpi_accounts = Transfer {
                from: user_token_account_info.to_account_info().clone(),
                to: vault_token_account_info.to_account_info().clone(),
                authority: ctx.accounts.owner.to_account_info()
            };
            token::transfer(
                CpiContext::new(token_program.clone().to_account_info(), cpi_accounts),
                token,
            )?;
            user_pool.escrow_token_balance += token;
        }

        Ok(())
    }  

    pub fn withdraw_from_escrow(
        ctx: Context<Withdraw>,
        _user_bump: u8,
        escrow_bump: u8,
        sol: u64,
        token: u64,
    ) -> Result<()> {
        require!(sol > 0 || token > 0, MarketplaceError::InvalidParamInput);

        let user_pool = &mut ctx.accounts.user_pool;
        msg!("User: {:?}, Sol Withdraw: {}, Token Withdraw: {}", user_pool.address, sol, token);

        // Assert User Pubkey with User Data PDA Address
        require!(ctx.accounts.owner.key().eq(&user_pool.address), MarketplaceError::InvalidOwner);

        let user_token_account_info = &mut &ctx.accounts.user_token_account;
        let vault_token_account_info = &mut &ctx.accounts.escrow_token_account;
        let token_program = &mut &ctx.accounts.token_program;
        let seeds = &[ESCROW_VAULT_SEED.as_bytes(), &[escrow_bump]];
        let signer = &[&seeds[..]];

        if sol > 0 {
            invoke_signed(&system_instruction::transfer(ctx.accounts.escrow_vault.key, ctx.accounts.owner.key, sol),
                &[
                    ctx.accounts.owner.to_account_info().clone(),
                    ctx.accounts.escrow_vault.to_account_info().clone(),
                    ctx.accounts.system_program.to_account_info().clone(),
                ],
                signer,
            )?;
            user_pool.escrow_sol_balance -= sol;
        }

        if token > 0 {
            let cpi_accounts = Transfer {
                from: vault_token_account_info.to_account_info().clone(),
                to: user_token_account_info.to_account_info().clone(),
                authority: ctx.accounts.escrow_vault.to_account_info().clone(),
            };
            token::transfer(
                CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
                token,
            )?;
            user_pool.escrow_token_balance -= token;
        }

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
        space = 8 + 376,
        payer = admin
    )]
    pub global_authority: Account<'info, GlobalPool>,
    #[account(
        mut,
        seeds = [ESCROW_VAULT_SEED.as_ref()],
        bump,
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub escrow_vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
}
#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct SetTreshold<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,
}
#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct AddTreasury<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,
}
#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct RemoveTreasury<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Account<'info, GlobalPool>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitUserPool<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        seeds = [USER_DATA_SEED.as_ref(), owner.key().as_ref()],
        bump,
        space = 8 + 64,
        payer = owner,
    )]
    pub user_pool: Account<'info, UserData>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
}
#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_DATA_SEED.as_ref(), owner.key().as_ref()],
        bump,
    )]
    pub user_pool: Account<'info, UserData>,

    #[account(
        mut,
        seeds = [ESCROW_VAULT_SEED.as_ref()],
        bump,
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub escrow_vault: AccountInfo<'info>,

    #[account(
        mut,
        constraint = user_token_account.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = user_token_account.owner == *owner.key,
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = escrow_token_account.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = escrow_token_account.owner == *escrow_vault.key,
    )]
    pub escrow_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_DATA_SEED.as_ref(), owner.key().as_ref()],
        bump,
    )]
    pub user_pool: Account<'info, UserData>,

    #[account(
        mut,
        seeds = [ESCROW_VAULT_SEED.as_ref()],
        bump,
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub escrow_vault: AccountInfo<'info>,

    #[account(
        mut,
        constraint = user_token_account.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = user_token_account.owner == *owner.key,
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = escrow_token_account.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = escrow_token_account.owner == *escrow_vault.key,
    )]
    pub escrow_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(nft: Pubkey, bump: u8)]
pub struct InitSellData<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        seeds = [SELL_DATA_SEED.as_ref(), nft.to_bytes().as_ref()],
        bump,
        space = 8 + 128,
        payer = payer,
    )]
    pub sell_data_info: Account<'info, SellData>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct ListNftForSale<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    #[account(
        mut,
        seeds = [SELL_DATA_SEED.as_ref(), nft_mint.key().to_bytes().as_ref()],
        bump,
    )]
    pub sell_data_info: Account<'info, SellData>,
    
    #[account(
        mut,
        constraint = user_token_account.mint == nft_mint.key(),
        constraint = user_token_account.owner == *owner.key,
        constraint = user_token_account.amount == 1,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = dest_nft_token_account.mint == nft_mint.key(),
        constraint = dest_nft_token_account.owner == global_authority.key(),
    )]
    pub dest_nft_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_mint: AccountInfo<'info>,
    /// the mint metadata
    #[account(
        mut,
        constraint = mint_metadata.owner == &metaplex_token_metadata::ID
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub mint_metadata: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
/// CHECK: This is not dangerous because we don't read or write from this account
    #[account(constraint = token_metadata_program.key == &metaplex_token_metadata::ID)]
    pub token_metadata_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct DelistNft<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    #[account(
        mut,
        seeds = [SELL_DATA_SEED.as_ref(), nft_mint.key().to_bytes().as_ref()],
        bump,
    )]
    pub sell_data_info: Account<'info, SellData>,
    
    #[account(
        mut,
        constraint = user_token_account.mint == nft_mint.key(),
        constraint = user_token_account.owner == *owner.key,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = dest_nft_token_account.mint == nft_mint.key(),
        constraint = dest_nft_token_account.owner == global_authority.key(),
        constraint = dest_nft_token_account.amount == 1,
    )]
    pub dest_nft_token_account: Account<'info, TokenAccount>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_mint: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct PurchaseNft<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    #[account(
        mut,
        seeds = [SELL_DATA_SEED.as_ref(), nft_mint.key().to_bytes().as_ref()],
        bump,
    )]
    pub sell_data_info: Box<Account<'info, SellData>>,

    #[account(
        mut,
        seeds = [USER_DATA_SEED.as_ref(), buyer.key().as_ref()],
        bump,
    )]
    pub user_pool: Account<'info, UserData>,
    
    #[account(
        mut,
        constraint = user_nft_token_account.mint == nft_mint.key(),
        constraint = user_nft_token_account.owner == *buyer.key,
    )]
    pub user_nft_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = dest_nft_token_account.mint == nft_mint.key(),
        constraint = dest_nft_token_account.owner == global_authority.key(),
        constraint = dest_nft_token_account.amount == 1,
    )]
    pub dest_nft_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub seller: SystemAccount<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_mint: AccountInfo<'info>,

    #[account(
        mut,
        constraint = user_token_account.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = user_token_account.owner == *buyer.key,
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = seller_token_account.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = seller_token_account.owner == *seller.key,
    )]
    pub seller_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}