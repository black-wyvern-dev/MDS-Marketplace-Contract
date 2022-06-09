use anchor_lang::{
    prelude::*,
    accounts::cpi_account::CpiAccount,
};
// use solana_program::borsh::try_from_slice_unchecked;
use solana_program::program::{invoke_signed, invoke};
use anchor_spl::{
    token::{self, Token, TokenAccount, Transfer, Burn, Mint },
};
use metaplex_token_metadata::state::Metadata;
use spl_token::state::{AccountState};

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

    pub fn initialize(ctx: Context<Initialize>, _global_bump: u8) -> Result<()> {
        let global_authority = &mut ctx.accounts.global_authority;
        global_authority.super_admin = ctx.accounts.admin.key();
        
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
        price: u64,
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

        sell_data_info.seller = ctx.accounts.owner.key();
        sell_data_info.price = price;
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
}

#[derive(Accounts)]
#[instruction(global_bump: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
        space = 8 + 32,
        payer = admin
    )]
    pub global_authority: Account<'info, GlobalPool>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
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
        space = 8 + 118,
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
    
    pub nft_mint: AccountInfo<'info>,
    /// the mint metadata
    #[account(
        mut,
        constraint = mint_metadata.owner == &metaplex_token_metadata::ID
    )]
    pub mint_metadata: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    // the token metadata program
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
    
    pub nft_mint: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}