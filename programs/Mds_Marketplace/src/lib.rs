use anchor_lang::{
    prelude::*,
};
// use solana_program::borsh::try_from_slice_unchecked;
use solana_program::program::{invoke_signed, invoke};
use solana_program::{
    system_instruction,
};
use anchor_spl::{
    token::{self, Token, TokenAccount, Transfer },
};
use metaplex_token_metadata::state::Metadata;
use spl_associated_token_account;

pub mod account;
pub mod error;
pub mod constants;

use account::*;
use error::*;
use constants::*;

declare_id!("3TfzeR3fQsoHzaXBkr84WWoYcqseJgUtqzppbu5wafMS");

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
        // Assert payer is the superadmin
        require!(global_authority.super_admin == ctx.accounts.admin.key(), MarketplaceError::InvalidSuperOwner);
        require!(sol_fee < PERMYRIAD && token_fee < PERMYRIAD, MarketplaceError::InvalidFeePercent);

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
        // Assert payer is the superadmin
        require!(global_authority.super_admin == ctx.accounts.admin.key(), MarketplaceError::InvalidSuperOwner);
        // Max Team Treasury Count is 8
        require!(global_authority.team_count < 8, MarketplaceError::MaxTeamCountExceed);
        // Distribution rate by Permyriad
        require!(rate <= PERMYRIAD && rate > 0, MarketplaceError::InvalidFeePercent);

        let mut exist: u8 = 0;
        let mut sum: u64 = rate;
        for i in 0..global_authority.team_count {
            let index = i as usize;
            if global_authority.team_treasury[index].eq(&address) {
                exist = 1;
            }
            sum += global_authority.treasury_rate[index];
        }
        require!(exist == 0, MarketplaceError::TreasuryAddressAlreadyAdded);
        // Total sum of treasury rates less than full permyriad
        require!(sum <= PERMYRIAD, MarketplaceError::MaxTreasuryRateSumExceed);

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
        // Assert payer is the superadmin
        require!(global_authority.super_admin == ctx.accounts.admin.key(), MarketplaceError::InvalidSuperOwner);
        // Assert no treasury exist
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
    
    // Initialize User PDA for Escrow & Traded Volume
    pub fn init_user_pool(ctx: Context<InitUserPool>, _bump: u8) -> Result<()> {
        let user_pool = &mut ctx.accounts.user_pool;
        user_pool.address = ctx.accounts.owner.key();
        Ok(())
    }
    
    // Init NFT listed info - Sell Data PDA
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
        
        // Get Collection address from Metadata
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
        // Assert NFT seller is payer
        require!(ctx.accounts.owner.key().eq(&sell_data_info.seller), MarketplaceError::SellerMismatch);
        // Assert Already Delisted NFT
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

    pub fn purchase<'info>(
        ctx: Context<'_, '_, '_, 'info, PurchaseNft<'info>>,
        global_bump: u8,
        _nft_bump: u8,
        _seller_bump: u8,
        _buyer_bump: u8,
        by_token: u8,
    ) -> Result<()> {
        // By Token should be zero or one
        require!(by_token < 2, MarketplaceError::InvalidParamInput);
        let sell_data_info = &mut ctx.accounts.sell_data_info;
        let buyer_user_pool = &mut ctx.accounts.buyer_user_pool;
        let seller_user_pool = &mut ctx.accounts.seller_user_pool;

        msg!("Purchase Mint: {:?}, By Token: {}", sell_data_info.mint, by_token == 1);

        // Assert NFT Pubkey with Sell Data PDA Mint
        require!(ctx.accounts.nft_mint.key().eq(&sell_data_info.mint), MarketplaceError::InvalidNFTDataAcount);
        require!(sell_data_info.active == 1, MarketplaceError::NotListedNFT);
        // Assert Seller Sell Data Address
        require!(ctx.accounts.seller.key().eq(&sell_data_info.seller), MarketplaceError::SellerAccountMismatch);
        // Assert Seller User PDA Address
        require!(ctx.accounts.seller.key().eq(&seller_user_pool.address), MarketplaceError::InvalidOwner);
        // Assert Buyer User PDA Address
        require!(ctx.accounts.buyer.key().eq(&buyer_user_pool.address), MarketplaceError::InvalidOwner);

        sell_data_info.active = 0;

        let nft_token_account_info = &mut &ctx.accounts.user_nft_token_account;
        let dest_nft_token_account_info = &mut &ctx.accounts.dest_nft_token_account;
        let buyer_token_account_info = &mut &ctx.accounts.user_token_account;
        let seller_token_account_info = &mut &ctx.accounts.seller_token_account;
        let token_program = &mut &ctx.accounts.token_program;
        let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];
        let signer = &[&seeds[..]];

        let global_authority = &mut ctx.accounts.global_authority;
        let remaining_accounts: Vec<AccountInfo> = ctx.remaining_accounts.to_vec();
        // At least one treasury should exist to trade NFT
        require!(global_authority.team_count > 0, MarketplaceError::NoTeamTreasuryYet);
        require!(global_authority.team_count == remaining_accounts.len() as u64, MarketplaceError::TeamTreasuryCountMismatch);

        if by_token == 0 {
            let fee_amount: u64 = sell_data_info.price_sol * global_authority.market_fee_sol / PERMYRIAD;

            invoke(&system_instruction::transfer(ctx.accounts.buyer.key, ctx.accounts.seller.key, sell_data_info.price_sol - fee_amount),
                &[
                    ctx.accounts.buyer.to_account_info().clone(),
                    ctx.accounts.seller.to_account_info().clone(),
                    ctx.accounts.system_program.to_account_info().clone(),
                ]
            )?;

            let mut i = 0;
            // This is not expensive cuz the max count is 8
            for team_account in remaining_accounts {
                require!(team_account.key().eq(&global_authority.team_treasury[i]), MarketplaceError::TeamTreasuryAddressMismatch);
                invoke(&system_instruction::transfer(ctx.accounts.buyer.key, &global_authority.team_treasury[i], fee_amount * global_authority.treasury_rate[i] / PERMYRIAD),
                &[
                    ctx.accounts.buyer.to_account_info().clone(),
                    team_account.clone(),
                    ctx.accounts.system_program.to_account_info().clone(),
                    ]
                )?;
                i += 1;
            }
            buyer_user_pool.traded_volume += sell_data_info.price_sol;
            seller_user_pool.traded_volume += sell_data_info.price_sol;
        } else {
            let fee_amount: u64 = sell_data_info.price_token * global_authority.market_fee_token / PERMYRIAD;

            let cpi_accounts = Transfer {
                from: buyer_token_account_info.to_account_info().clone(),
                to: seller_token_account_info.to_account_info().clone(),
                authority: ctx.accounts.buyer.to_account_info()
            };
            token::transfer(
                CpiContext::new(token_program.clone().to_account_info(), cpi_accounts),
                sell_data_info.price_token - fee_amount,
            )?;

            let mut i = 0;
            // This is not expensive cuz the max count is 8
            // remaining_accounts should be tokenAccount for token purchasing
            for team_token_account in remaining_accounts {
                // Get ATA of Treasury Account
                let team_ata = spl_associated_token_account::get_associated_token_address(
                    &global_authority.team_treasury[i], &REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap()
                );
                // Assert Provied Remaining Account is Treasury ATA
                require!(team_token_account.key().eq(&team_ata), MarketplaceError::TeamTreasuryAddressMismatch);
                // Assert Treasury ATA is Initialized
                require!(team_token_account.owner == &token::ID, MarketplaceError::TeamTreasuryAddressMismatch);

                let cpi_accounts = Transfer {
                    from: buyer_token_account_info.to_account_info().clone(),
                    to: team_token_account.clone(),
                    authority: ctx.accounts.buyer.to_account_info()
                };
                token::transfer(
                    CpiContext::new(token_program.clone().to_account_info(), cpi_accounts),
                    fee_amount * global_authority.treasury_rate[i] / PERMYRIAD,
                )?;
    
                i += 1;
            }
            buyer_user_pool.traded_token_volume += sell_data_info.price_token;
            seller_user_pool.traded_token_volume += sell_data_info.price_token;
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

    pub fn init_offer_data(ctx: Context<InitOfferData>, nft: Pubkey, _bump: u8) -> Result<()> {
        let offer_data_info = &mut ctx.accounts.offer_data_info;
        offer_data_info.mint = nft;
        offer_data_info.buyer = ctx.accounts.payer.key();
        Ok(())
    }
    
    pub fn make_offer(
        ctx: Context<MakeOffer>,
        _sell_bump: u8,
        _offer_bump: u8,
        _user_bump: u8,
        _escrow_bump: u8,
        price: u64,
        by_token: u64,
    ) -> Result<()> {
        // By Token Param should be zero or one
        require!(by_token < 2, MarketplaceError::InvalidParamInput);
        let sell_data_info = &mut ctx.accounts.sell_data_info;
        msg!("Mint: {:?}, buyer: {:?}", sell_data_info.mint, ctx.accounts.owner.key());
        
        // Assert NFT Pubkey with Sell Data PDA Mint
        require!(ctx.accounts.nft_mint.key().eq(&sell_data_info.mint), MarketplaceError::InvalidNFTDataAcount);

        let offer_data_info = &mut ctx.accounts.offer_data_info;
        require!(ctx.accounts.nft_mint.key().eq(&offer_data_info.mint), MarketplaceError::InvalidOfferDataMint);
        // Assert Payer is same with Offer Data Buyer
        require!(ctx.accounts.owner.key().eq(&offer_data_info.buyer), MarketplaceError::InvalidOfferDataBuyer);
        // Assert Already delisted NFT
        require!(sell_data_info.active == 1, MarketplaceError::OfferForNotListedNFT);
        // Offer price range is from x1 to x0.5
        if by_token == 1 {
            require!(sell_data_info.price_token > price && sell_data_info.price_token / 2 <= price, MarketplaceError::InvalidOfferPrice);
        } else {
            require!(sell_data_info.price_sol > price && sell_data_info.price_sol / 2 <= price, MarketplaceError::InvalidOfferPrice);
        }

        offer_data_info.offer_listing_date = sell_data_info.listed_date;
        offer_data_info.offer_price = price;
        offer_data_info.by_token = by_token;
        offer_data_info.active = 1;

        let user_pool = &mut ctx.accounts.user_pool;
        msg!("User: {:?}, Deposit: {}, By Token: {}", user_pool.address, price, by_token);

        // Assert User Pubkey with User Data PDA Address
        require!(ctx.accounts.owner.key().eq(&user_pool.address), MarketplaceError::InvalidOwner);

        let user_token_account_info = &mut &ctx.accounts.user_token_account;
        let vault_token_account_info = &mut &ctx.accounts.escrow_token_account;
        let token_program = &mut &ctx.accounts.token_program;

        if by_token == 0 {
            invoke(&system_instruction::transfer(ctx.accounts.owner.key, ctx.accounts.escrow_vault.key, price),
                &[
                    ctx.accounts.owner.to_account_info().clone(),
                    ctx.accounts.escrow_vault.to_account_info().clone(),
                    ctx.accounts.system_program.to_account_info().clone(),
                ]
            )?;
            user_pool.escrow_sol_balance += price;
        }

        if by_token == 1 {
            let cpi_accounts = Transfer {
                from: user_token_account_info.to_account_info().clone(),
                to: vault_token_account_info.to_account_info().clone(),
                authority: ctx.accounts.owner.to_account_info()
            };
            token::transfer(
                CpiContext::new(token_program.clone().to_account_info(), cpi_accounts),
                price,
            )?;
            user_pool.escrow_token_balance += price;
        }
        Ok(())
    }
    
    pub fn cancel_offer(
        ctx: Context<CancelOffer>,
        _offer_bump: u8,
    ) -> Result<()> {
        let offer_data_info = &mut ctx.accounts.offer_data_info;
        msg!("Mint: {:?}, buyer: {:?}", offer_data_info.mint, ctx.accounts.owner.key());
        
        // Assert NFT Pubkey with Offer Data PDA Mint
        require!(ctx.accounts.nft_mint.key().eq(&offer_data_info.mint), MarketplaceError::InvalidOfferDataMint);
        // Asser Payer is the Offer Data Address
        require!(ctx.accounts.owner.key().eq(&offer_data_info.buyer), MarketplaceError::InvalidOfferDataBuyer);
        require!(offer_data_info.active == 1, MarketplaceError::DisabledOffer);

        offer_data_info.active = 0;

        Ok(())
    }
    
    pub fn accept_offer<'info>(
        ctx: Context<'_, '_, '_, 'info, AcceptOffer<'info>>,
        global_bump: u8,
        _nft_bump: u8,
        _offer_bump: u8,
        _buyer_bump: u8,
        _seller_bump: u8,
        escrow_bump: u8,
    ) -> Result<()> {
        let sell_data_info = &mut ctx.accounts.sell_data_info;

        let buyer_user_pool = &mut ctx.accounts.buyer_user_pool;
        let seller_user_pool = &mut ctx.accounts.seller_user_pool;
        // Assert Buyer User PDA Address
        require!(ctx.accounts.buyer.key().eq(&buyer_user_pool.address), MarketplaceError::InvalidOwner);
        // Assert Seller User PDA Address
        require!(ctx.accounts.seller.key().eq(&seller_user_pool.address), MarketplaceError::InvalidOwner);

        // Assert NFT Pubkey with Sell Data PDA Mint
        require!(ctx.accounts.nft_mint.key().eq(&sell_data_info.mint), MarketplaceError::InvalidNFTDataAcount);
        // Assert Already Delisted NFT
        require!(sell_data_info.active == 1, MarketplaceError::NotListedNFT);
        // Assert Seller Pubkey with Sell Data PDA Seller Address
        require!(ctx.accounts.seller.key().eq(&sell_data_info.seller), MarketplaceError::SellerAccountMismatch);

        let offer_data_info = &mut ctx.accounts.offer_data_info;
        // Assert NFT Pubkey with Offer Data PDA Mint
        require!(ctx.accounts.nft_mint.key().eq(&offer_data_info.mint), MarketplaceError::InvalidOfferDataMint);
        // Assert Buyer Pubkey with Offer Data PDA Buyer Address
        require!(ctx.accounts.buyer.key().eq(&offer_data_info.buyer), MarketplaceError::InvalidOfferDataBuyer);
        // Assert Already Disabled Offer
        require!(offer_data_info.active == 1, MarketplaceError::DisabledOffer);
        // Assert Offer provided date with the NFT Listed Date
        require!(offer_data_info.offer_listing_date == sell_data_info.listed_date, MarketplaceError::OfferForExpiredListingNFT);

        msg!("Offer Mint: {:?}, Seller: {:?}, Buyer: {:?}, Price: {}, ByToken: {}",
            offer_data_info.mint,
            sell_data_info.seller,
            offer_data_info.buyer,
            offer_data_info.offer_price,
            offer_data_info.by_token,
        );

        offer_data_info.active = 0;
        sell_data_info.active = 0;

        if offer_data_info.by_token == 1 {
            require!(offer_data_info.offer_price <= buyer_user_pool.escrow_token_balance, MarketplaceError::InsufficientBuyerTokenBalance);
            buyer_user_pool.escrow_token_balance -= offer_data_info.offer_price;
            buyer_user_pool.traded_token_volume += offer_data_info.offer_price;
            seller_user_pool.traded_token_volume += offer_data_info.offer_price;
        } else {
            require!(offer_data_info.offer_price <= buyer_user_pool.escrow_sol_balance, MarketplaceError::InsufficientBuyerSolBalance);
            buyer_user_pool.escrow_sol_balance -= offer_data_info.offer_price;
            buyer_user_pool.traded_volume += offer_data_info.offer_price;
            seller_user_pool.traded_volume += offer_data_info.offer_price;
        }

        let user_token_account_info = &mut &ctx.accounts.user_token_account;
        let vault_token_account_info = &mut &ctx.accounts.escrow_token_account;
        let token_program = &mut &ctx.accounts.token_program;
        let seeds = &[ESCROW_VAULT_SEED.as_bytes(), &[escrow_bump]];
        let signer = &[&seeds[..]];

        let global_authority = &mut ctx.accounts.global_authority;
        let remaining_accounts: Vec<AccountInfo> = ctx.remaining_accounts.to_vec();
        require!(global_authority.team_count > 0, MarketplaceError::NoTeamTreasuryYet);
        require!(global_authority.team_count == remaining_accounts.len() as u64, MarketplaceError::TeamTreasuryCountMismatch);

        if offer_data_info.by_token == 0 {
            let fee_amount: u64 = offer_data_info.offer_price * global_authority.market_fee_sol / PERMYRIAD;

            invoke_signed(&system_instruction::transfer(ctx.accounts.escrow_vault.key, ctx.accounts.seller.key, offer_data_info.offer_price - fee_amount),
                &[
                    ctx.accounts.seller.to_account_info().clone(),
                    ctx.accounts.escrow_vault.to_account_info().clone(),
                    ctx.accounts.system_program.to_account_info().clone(),
                ],
                signer,
            )?;
            
            let mut i = 0;
            // This is not expensive cuz the max count is 8
            for team_account in remaining_accounts {
                // Assert Provided Remaining Account is Treasury
                require!(team_account.key().eq(&global_authority.team_treasury[i]), MarketplaceError::TeamTreasuryAddressMismatch);
                invoke_signed(&system_instruction::transfer(ctx.accounts.escrow_vault.key, &global_authority.team_treasury[i], fee_amount * global_authority.treasury_rate[i] / PERMYRIAD),
                    &[
                        ctx.accounts.escrow_vault.to_account_info().clone(),
                        team_account.clone(),
                        ctx.accounts.system_program.to_account_info().clone(),
                    ],
                    signer,
                )?;
                i += 1;
            }
        } else {
            let fee_amount: u64 = offer_data_info.offer_price * global_authority.market_fee_token / PERMYRIAD;

            let cpi_accounts = Transfer {
                from: vault_token_account_info.to_account_info().clone(),
                to: user_token_account_info.to_account_info().clone(),
                authority: ctx.accounts.escrow_vault.to_account_info()
            };
            token::transfer(
                CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
                offer_data_info.offer_price - fee_amount,
            )?;
            
            let mut i = 0;
            // This is not expensive cuz the max count is 8
            for team_account in remaining_accounts {
                // Get ATA of Treasury Account
                let team_ata = spl_associated_token_account::get_associated_token_address(
                    &global_authority.team_treasury[i], &REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap()
                );
                // Assert Provied Remaining Account is Treasury ATA
                require!(team_account.key().eq(&team_ata), MarketplaceError::TeamTreasuryAddressMismatch);
                // Assert Treasury ATA is Initialized
                require!(team_account.owner == &token::ID, MarketplaceError::TeamTreasuryAddressMismatch);

                let cpi_accounts = Transfer {
                    from: vault_token_account_info.to_account_info().clone(),
                    to: team_account.to_account_info().clone(),
                    authority: ctx.accounts.escrow_vault.to_account_info()
                };
                token::transfer(
                    CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
                    fee_amount * global_authority.treasury_rate[i] / PERMYRIAD,
                )?;
                i += 1;
            }
        }

        let nft_token_account_info = &mut &ctx.accounts.user_nft_token_account;
        let dest_nft_token_account_info = &mut &ctx.accounts.dest_nft_token_account;
        let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];
        let signer = &[&seeds[..]];

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
                ctx.accounts.seller.key,
                &ctx.accounts.global_authority.key(),
                &[],
            )?,
            &[
                token_program.clone().to_account_info(),
                dest_nft_token_account_info.to_account_info().clone(),
                ctx.accounts.seller.to_account_info().clone(),
                ctx.accounts.global_authority.to_account_info().clone(),
            ],
            signer,
        )?;
        
        Ok(())
    }
    
    pub fn init_auction_data(ctx: Context<InitAuctionData>, nft: Pubkey, _bump: u8) -> Result<()> {
        let auction_data_info = &mut ctx.accounts.auction_data_info;
        auction_data_info.mint = nft;
        Ok(())
    }
    
    pub fn create_auction(
        ctx: Context<CreateAuction>,
        _global_bump: u8,
        _auction_bump: u8,
        start_price: u64,
        min_increase: u64,
        by_token: u64,
        end_date: i64,
    ) -> Result<()> {
        // By Token Param should be zero or one
        require!(by_token < 2, MarketplaceError::InvalidParamInput);
        let auction_data_info = &mut ctx.accounts.auction_data_info;
        msg!("Mint: {:?}", auction_data_info.mint);

        // Assert NFT Pubkey with Auction Data PDA Mint
        require!(ctx.accounts.nft_mint.key().eq(&auction_data_info.mint), MarketplaceError::InvalidNFTDataAcount);
        
        let timestamp = Clock::get()?.unix_timestamp;
        msg!("Created Date: {}", timestamp);

        auction_data_info.creator = ctx.accounts.owner.key();
        auction_data_info.start_price = start_price;
        auction_data_info.min_increase_amount = min_increase;
        auction_data_info.by_token = by_token;
        auction_data_info.end_date = end_date;
        auction_data_info.last_bidder = Pubkey::default();
        auction_data_info.highest_bid = start_price;
        auction_data_info.status = 1;

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
    
    pub fn place_bid(
        ctx: Context<PlaceBid>,
        _auction_bump: u8,
        escrow_bump: u8,
        price: u64,
    ) -> Result<()> {
        let auction_data_info = &mut ctx.accounts.auction_data_info;

        let timestamp = Clock::get()?.unix_timestamp;
        msg!("Place Date: {}", timestamp);
        // Assert NFT Pubkey with Auction Data PDA Mint
        require!(ctx.accounts.nft_mint.key().eq(&auction_data_info.mint), MarketplaceError::InvalidNFTDataAcount);
        // Assert Auction Already Ended
        require!(auction_data_info.end_date > timestamp, MarketplaceError::EndedAuction);
        // Assert Already Disabled Auction
        require!(auction_data_info.status == 1, MarketplaceError::NotListedNFT);
        // New Bid should be increased more than min_increase_amount
        require!(auction_data_info.highest_bid + auction_data_info.min_increase_amount <= price, MarketplaceError::InvalidBidPrice);
        // Assert OutBidder Address with the Last Bidder
        require!(Pubkey::default().eq(&auction_data_info.last_bidder) || ctx.accounts.out_bidder.key().eq(&auction_data_info.last_bidder), MarketplaceError::OutBidderMismatch);
        // Assert New Bidder is same with the Last Bidder
        require!(!ctx.accounts.bidder.key().eq(&auction_data_info.last_bidder), MarketplaceError::DoubleBidFromOneBidder);
        // Assert Bid from Auction Creator
        require!(!ctx.accounts.bidder.key().eq(&auction_data_info.creator), MarketplaceError::BidFromAuctionCreator);
        
        msg!("Mint: {:?}, Bidder: {:?}", auction_data_info.mint, ctx.accounts.bidder.key());

        let user_token_account_info = &mut &ctx.accounts.bidder_token_account;
        let vault_token_account_info = &mut &ctx.accounts.escrow_token_account;
        let token_program = &mut &ctx.accounts.token_program;
        let seeds = &[ESCROW_VAULT_SEED.as_bytes(), &[escrow_bump]];
        let signer = &[&seeds[..]];

        if auction_data_info.by_token == 0 {
            // Refund Last Bidder Escrow
            if !Pubkey::default().eq(&auction_data_info.last_bidder) {
                invoke_signed(&system_instruction::transfer(ctx.accounts.escrow_vault.key, ctx.accounts.out_bidder.key, auction_data_info.highest_bid),
                    &[
                        ctx.accounts.out_bidder.to_account_info().clone(),
                        ctx.accounts.escrow_vault.to_account_info().clone(),
                        ctx.accounts.system_program.to_account_info().clone(),
                    ],
                    signer,
                )?;
            }
            // Escrow New Bidder funds
            invoke(&system_instruction::transfer(ctx.accounts.bidder.key, ctx.accounts.escrow_vault.key, price),
                &[
                    ctx.accounts.bidder.to_account_info().clone(),
                    ctx.accounts.escrow_vault.to_account_info().clone(),
                    ctx.accounts.system_program.to_account_info().clone(),
                ]
            )?;
        } else {
            // Refund Last Bidder Escrow
            if !Pubkey::default().eq(&auction_data_info.last_bidder) {
                let cpi_accounts = Transfer {
                    from: vault_token_account_info.to_account_info().clone(),
                    to: ctx.accounts.out_bidder_token_account.to_account_info().clone(),
                    authority: ctx.accounts.escrow_vault.to_account_info()
                };
                token::transfer(
                    CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
                    auction_data_info.highest_bid,
                )?;
            }
            // Escrow New Bidder funds
            let cpi_accounts = Transfer {
                from: user_token_account_info.to_account_info().clone(),
                to: vault_token_account_info.to_account_info().clone(),
                authority: ctx.accounts.bidder.to_account_info()
            };
            token::transfer(
                CpiContext::new(token_program.clone().to_account_info(), cpi_accounts),
                price,
            )?;
        }

        auction_data_info.last_bid_date = timestamp;
        auction_data_info.last_bidder = ctx.accounts.bidder.key();
        auction_data_info.highest_bid = price;

        Ok(())
    }
    
    pub fn claim_auction<'info>(
        ctx: Context<'_, '_, '_, 'info, ClaimAuction<'info>>,
        global_bump: u8,
        _auction_bump: u8,
        escrow_bump: u8,
    ) -> Result<()> {
        let auction_data_info = &mut ctx.accounts.auction_data_info;
        msg!("Mint: {:?}", auction_data_info.mint);

        let timestamp = Clock::get()?.unix_timestamp;
        msg!("Claim Date: {}", timestamp);
        // Assert NFT Pubkey with Auction Data PDA Mint
        require!(ctx.accounts.nft_mint.key().eq(&auction_data_info.mint), MarketplaceError::InvalidNFTDataAcount);
        // Assert Auction End Date is Passed
        require!(auction_data_info.end_date <= timestamp, MarketplaceError::NotEndedAuction);
        // Assert Already Ended or Not Started Auction
        require!(auction_data_info.status == 1, MarketplaceError::NotListedNFT);
        // Assert Creator Pubkey with Auction Data Creator Address
        require!(ctx.accounts.creator.key().eq(&auction_data_info.creator), MarketplaceError::CreatorAccountMismatch);
        // Assert Bidder Pubkey with Auction Data Last Bidder Address
        require!(ctx.accounts.bidder.key().eq(&auction_data_info.last_bidder), MarketplaceError::BidderAccountMismatch);
        
        let bidder_user_pool = &mut ctx.accounts.bidder_user_pool;
        let creator_user_pool = &mut ctx.accounts.creator_user_pool;
        // Assert Bidder User PDA Address
        require!(ctx.accounts.bidder.key().eq(&bidder_user_pool.address), MarketplaceError::BidderAccountMismatch);
        // Assert Creator User PDA Address
        require!(ctx.accounts.creator.key().eq(&creator_user_pool.address), MarketplaceError::CreatorAccountMismatch);

        // Set Flag as Claimed Auction
        auction_data_info.status = 2;
        bidder_user_pool.traded_volume += auction_data_info.highest_bid;
        creator_user_pool.traded_volume += auction_data_info.highest_bid;

        let token_account_info = &mut &ctx.accounts.user_token_account;
        let dest_token_account_info = &mut &ctx.accounts.dest_nft_token_account;
        let token_program = &mut &ctx.accounts.token_program;
        let seeds = &[ESCROW_VAULT_SEED.as_bytes(), &[escrow_bump]];
        let signer = &[&seeds[..]];

        let global_authority = &mut ctx.accounts.global_authority;
        let remaining_accounts: Vec<AccountInfo> = ctx.remaining_accounts.to_vec();
        require!(global_authority.team_count > 0, MarketplaceError::NoTeamTreasuryYet);
        require!(global_authority.team_count == remaining_accounts.len() as u64, MarketplaceError::TeamTreasuryCountMismatch);

        if auction_data_info.by_token == 0 {
            let fee_amount: u64 = auction_data_info.highest_bid * global_authority.market_fee_sol / PERMYRIAD;
            
            invoke_signed(&system_instruction::transfer(ctx.accounts.escrow_vault.key, ctx.accounts.creator.key, auction_data_info.highest_bid - fee_amount),
                &[
                    ctx.accounts.creator.to_account_info().clone(),
                    ctx.accounts.escrow_vault.to_account_info().clone(),
                    ctx.accounts.system_program.to_account_info().clone(),
                ],
                signer,
            )?;
            
            let mut i = 0;
            // This is not expensive cuz the max count is 8
            for team_account in remaining_accounts {
                // Assert Provided Remaining Account is Treasury
                require!(team_account.key().eq(&global_authority.team_treasury[i]), MarketplaceError::TeamTreasuryAddressMismatch);
                invoke_signed(&system_instruction::transfer(ctx.accounts.escrow_vault.key, &global_authority.team_treasury[i], fee_amount * global_authority.treasury_rate[i] / PERMYRIAD),
                    &[
                        ctx.accounts.escrow_vault.to_account_info().clone(),
                        team_account.clone(),
                        ctx.accounts.system_program.to_account_info().clone(),
                    ],
                    signer,
                )?;
                i += 1;
            }
        } else {
            let fee_amount: u64 = auction_data_info.highest_bid * global_authority.market_fee_token / PERMYRIAD;
            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info().clone(),
                to: ctx.accounts.creator_token_account.to_account_info().clone(),
                authority: ctx.accounts.escrow_vault.to_account_info()
            };
            token::transfer(
                CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
                auction_data_info.highest_bid - fee_amount,
            )?;
            
            let mut i = 0;
            // This is not expensive cuz the max count is 8
            // remaining_accounts should be tokenAccount for token purchasing
            for team_token_account in remaining_accounts {
                // Get ATA of Treasury Account
                let team_ata = spl_associated_token_account::get_associated_token_address(
                    &global_authority.team_treasury[i], &REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap()
                );
                // Assert Provied Remaining Account is Treasury ATA
                require!(team_token_account.key().eq(&team_ata), MarketplaceError::TeamTreasuryAddressMismatch);
                // Assert Treasury ATA is Initialized
                require!(team_token_account.owner == &token::ID, MarketplaceError::TeamTreasuryAddressMismatch);
                let cpi_accounts = Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info().clone(),
                    to: team_token_account.clone(),
                    authority: ctx.accounts.escrow_vault.to_account_info()
                };
                token::transfer(
                    CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
                    fee_amount * global_authority.treasury_rate[i] / PERMYRIAD,
                )?;
    
                i += 1;
            }
        }
        let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: dest_token_account_info.to_account_info().clone(),
            to: token_account_info.to_account_info().clone(),
            authority: ctx.accounts.global_authority.to_account_info().clone()
        };
        token::transfer(
            CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
            1
        )?;
        
        invoke_signed(
            &spl_token::instruction::close_account(
                token_program.key,
                &dest_token_account_info.key(),
                ctx.accounts.bidder.key,
                &ctx.accounts.global_authority.key(),
                &[],
            )?,
            &[
                token_program.clone().to_account_info(),
                dest_token_account_info.to_account_info().clone(),
                ctx.accounts.bidder.to_account_info().clone(),
                ctx.accounts.global_authority.to_account_info().clone(),
            ],
            signer,
        )?;
        
        Ok(())
    }

    pub fn cancel_auction(
        ctx: Context<CancelAuction>,
        global_bump: u8,
        _auction_bump: u8,
    ) -> Result<()> {
        let auction_data_info = &mut ctx.accounts.auction_data_info;
        msg!("Mint: {:?}", auction_data_info.mint);

        let timestamp = Clock::get()?.unix_timestamp;
        msg!("Cancel Date: {}", timestamp);
        // Assert NFT Pubkey with Auction Data PDA Mint
        require!(ctx.accounts.nft_mint.key().eq(&auction_data_info.mint), MarketplaceError::InvalidNFTDataAcount);
        // Assert Auction End Date is passed
        require!(auction_data_info.end_date <= timestamp, MarketplaceError::NotEndedAuction);
        // Assert Already Ended Or Not Started Auction
        require!(auction_data_info.status == 1, MarketplaceError::NotListedNFT);
        // Assert Auction Has No Bidder
        require!(Pubkey::default().eq(&auction_data_info.last_bidder), MarketplaceError::AuctionHasBid);
        // Assert Creator Pubkey is same with the Auction Data Creator
        require!(ctx.accounts.creator.key().eq(&auction_data_info.creator), MarketplaceError::CreatorAccountMismatch);
        
        auction_data_info.status = 0;

        let token_account_info = &mut &ctx.accounts.user_token_account;
        let dest_token_account_info = &mut &ctx.accounts.dest_nft_token_account;
        let token_program = &mut &ctx.accounts.token_program;
        let seeds = &[GLOBAL_AUTHORITY_SEED.as_bytes(), &[global_bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: dest_token_account_info.to_account_info().clone(),
            to: token_account_info.to_account_info().clone(),
            authority: ctx.accounts.global_authority.to_account_info().clone()
        };
        token::transfer(
            CpiContext::new_with_signer(token_program.clone().to_account_info(), cpi_accounts, signer),
            1
        )?;
        
        invoke_signed(
            &spl_token::instruction::close_account(
                token_program.key,
                &dest_token_account_info.key(),
                ctx.accounts.creator.key,
                &ctx.accounts.global_authority.key(),
                &[],
            )?,
            &[
                token_program.clone().to_account_info(),
                dest_token_account_info.to_account_info().clone(),
                ctx.accounts.creator.to_account_info().clone(),
                ctx.accounts.global_authority.to_account_info().clone(),
            ],
            signer,
        )?;
        
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
    pub buyer_user_pool: Account<'info, UserData>,

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
    
    #[account(
        mut,
        seeds = [USER_DATA_SEED.as_ref(), seller.key().as_ref()],
        bump,
    )]
    pub seller_user_pool: Account<'info, UserData>,

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

#[derive(Accounts)]
#[instruction(nft: Pubkey, bump: u8)]
pub struct InitOfferData<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        seeds = [OFFER_DATA_SEED.as_ref(), nft.to_bytes().as_ref(), payer.key().to_bytes().as_ref()],
        bump,
        space = 8 + 96,
        payer = payer,
    )]
    pub offer_data_info: Account<'info, OfferData>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct MakeOffer<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [SELL_DATA_SEED.as_ref(), nft_mint.key().to_bytes().as_ref()],
        bump,
    )]
    pub sell_data_info: Account<'info, SellData>,
    
    #[account(
        mut,
        seeds = [OFFER_DATA_SEED.as_ref(), nft_mint.key().to_bytes().as_ref(), owner.key().to_bytes().as_ref()],
        bump,
    )]
    pub offer_data_info: Account<'info, OfferData>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_mint: AccountInfo<'info>,
    
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
pub struct CancelOffer<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [OFFER_DATA_SEED.as_ref(), nft_mint.key().to_bytes().as_ref(), owner.key().to_bytes().as_ref()],
        bump,
    )]
    pub offer_data_info: Account<'info, OfferData>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_mint: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct AcceptOffer<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [SELL_DATA_SEED.as_ref(), nft_mint.key().to_bytes().as_ref()],
        bump,
    )]
    pub sell_data_info: Box<Account<'info, SellData>>,
    
    #[account(mut)]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub buyer: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [OFFER_DATA_SEED.as_ref(), nft_mint.key().to_bytes().as_ref(), buyer.key().to_bytes().as_ref()],
        bump,
    )]
    pub offer_data_info: Box<Account<'info, OfferData>>,

    #[account(
        mut,
        seeds = [USER_DATA_SEED.as_ref(), seller.key().as_ref()],
        bump,
    )]
    pub seller_user_pool: Box<Account<'info, UserData>>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_mint: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    #[account(
        mut,
        seeds = [USER_DATA_SEED.as_ref(), buyer.key().as_ref()],
        bump,
    )]
    pub buyer_user_pool: Box<Account<'info, UserData>>,

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
        constraint = user_token_account.owner == *seller.key,
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
pub struct InitAuctionData<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        seeds = [AUCTION_DATA_SEED.as_ref(), nft.to_bytes().as_ref()],
        bump,
        space = 8 + 152,
        payer = payer,
    )]
    pub auction_data_info: Account<'info, AuctionData>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateAuction<'info> {
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
        seeds = [AUCTION_DATA_SEED.as_ref(), nft_mint.key().to_bytes().as_ref()],
        bump,
    )]
    pub auction_data_info: Account<'info, AuctionData>,
    
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
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct PlaceBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,

    #[account(
        mut,
        seeds = [AUCTION_DATA_SEED.as_ref(), nft_mint.key().to_bytes().as_ref()],
        bump,
    )]
    pub auction_data_info: Account<'info, AuctionData>,
    
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_mint: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [ESCROW_VAULT_SEED.as_ref()],
        bump,
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub escrow_vault: AccountInfo<'info>,

    #[account(
        mut,
        constraint = bidder_token_account.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = bidder_token_account.owner == *bidder.key,
    )]
    pub bidder_token_account: Box<Account<'info, TokenAccount>>,
    
    #[account(
        mut,
        constraint = escrow_token_account.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = escrow_token_account.owner == *escrow_vault.key,
    )]
    pub escrow_token_account: Box<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub out_bidder: SystemAccount<'info>,

    #[account(
        mut,
        constraint = out_bidder_token_account.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = out_bidder_token_account.owner == *out_bidder.key,
    )]
    pub out_bidder_token_account: Box<Account<'info, TokenAccount>>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct ClaimAuction<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,
    
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    #[account(
        mut,
        seeds = [AUCTION_DATA_SEED.as_ref(), nft_mint.key().to_bytes().as_ref()],
        bump,
    )]
    pub auction_data_info: Account<'info, AuctionData>,
    
    #[account(
        mut,
        constraint = user_token_account.mint == nft_mint.key(),
        constraint = user_token_account.owner == *bidder.key,
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

    #[account(
        mut,
        seeds = [ESCROW_VAULT_SEED.as_ref()],
        bump,
    )]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub escrow_vault: AccountInfo<'info>,
    
    #[account(
        mut,
        constraint = escrow_token_account.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = escrow_token_account.owner == *escrow_vault.key,
    )]
    pub escrow_token_account: Box<Account<'info, TokenAccount>>,
    
    #[account(
        mut,
        seeds = [USER_DATA_SEED.as_ref(), bidder.key().as_ref()],
        bump,
    )]
    pub bidder_user_pool: Box<Account<'info, UserData>>,

    #[account(mut)]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub creator: SystemAccount<'info>,

    #[account(
        mut,
        constraint = creator_token_account.mint == REWARD_TOKEN_MINT_PUBKEY.parse::<Pubkey>().unwrap(),
        constraint = creator_token_account.owner == *creator.key,
    )]
    pub creator_token_account: Box<Account<'info, TokenAccount>>,
    
    #[account(
        mut,
        seeds = [USER_DATA_SEED.as_ref(), creator.key().as_ref()],
        bump,
    )]
    pub creator_user_pool: Box<Account<'info, UserData>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CancelAuction<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        mut,
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_authority: Box<Account<'info, GlobalPool>>,

    #[account(
        mut,
        seeds = [AUCTION_DATA_SEED.as_ref(), nft_mint.key().to_bytes().as_ref()],
        bump,
    )]
    pub auction_data_info: Box<Account<'info, AuctionData>>,
    
    #[account(
        mut,
        constraint = user_token_account.mint == nft_mint.key(),
        constraint = user_token_account.owner == *creator.key,
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,
    
    #[account(
        mut,
        constraint = dest_nft_token_account.mint == nft_mint.key(),
        constraint = dest_nft_token_account.owner == global_authority.key(),
        constraint = dest_nft_token_account.amount == 1,
    )]
    pub dest_nft_token_account: Box<Account<'info, TokenAccount>>,
    
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub nft_mint: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}