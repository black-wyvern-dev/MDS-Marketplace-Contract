use anchor_lang::prelude::*;

#[error_code]
pub enum MarketplaceError {
    #[msg("Invalid Super Owner")]
    InvalidSuperOwner,
    #[msg("Invalid Owner")]
    InvalidOwner,
    #[msg("Invalid Global Pool Address")]
    InvalidGlobalPool,
    #[msg("Marketplace Fee is Permille")]
    InvalidFeePercent,

    #[msg("Max Team Count is 8")]
    MaxTeamCountExceed,
    #[msg("Treasury Wallet Not Configured")]
    NoTeamTreasuryYet,
    #[msg("Treasury Address Not Exist")]
    TreasuryAddressNotFound,
    #[msg("Treasury Address Already Exist")]
    TreasuryAddressAlreadyAdded,
    #[msg("Total Treasury Rate Sum Should Less Than 100%")]
    MaxTreasuryRateSumExceed,

    #[msg("Uninitialized Account")]
    Uninitialized,
    #[msg("Instruction Parameter is Invalid")]
    InvalidParamInput,

    #[msg("Invalid Super Owner")]
    InvalidSuperOwner,
    #[msg("Payer Mismatch with NFT Seller")]
    SellerMismatch,
    #[msg("Invalid NFT Data Account")]
    InvalidNFTDataAcount,
    #[msg("The NFT Is Not Listed")]
    NotListedNFT,

    #[msg("Seller Account Mismatch with NFT Seller Data")]
    SellerAcountMismatch,
    #[msg("Buyer Sol Balance is Less than NFT SOL Price")]
    InsufficientBuyerSolBalance,

    #[msg("Invalid Metadata Address")]
    InvaliedMetadata,
    #[msg("Can't Parse The NFT's Creators")]
    MetadataCreatorParseError,
}