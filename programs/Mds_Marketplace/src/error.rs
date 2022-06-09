use anchor_lang::prelude::*;

#[error_code]
pub enum MarketplaceError {
    #[msg("Invalid Global Pool Address")]
    InvalidGlobalPool,
    #[msg("Uninitialized Account")]
    Uninitialized,
    #[msg("Invalid Super Owner")]
    InvalidSuperOwner,
    #[msg("Payer Mismatch with NFT Seller")]
    SellerMismatch,
    #[msg("Invalid NFT Data Account")]
    InvalidNFTDataAcount,
    #[msg("The NFT Is Not Listed")]
    NotListedNFT,
    #[msg("Invalid Metadata Address")]
    InvaliedMetadata,
    #[msg("Can't Parse The NFT's Creators")]
    MetadataCreatorParseError,
}