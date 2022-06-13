export type MdsMarketplace = {
  "version": "0.1.0",
  "name": "mds_marketplace",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateFee",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "solFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addTeamTreasury",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "address",
          "type": "publicKey"
        },
        {
          "name": "rate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "removeTeamTreasury",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "address",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "initUserPool",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initSellData",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sellDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nft",
          "type": "publicKey"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "listNftForSale",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "sellBump",
          "type": "u8"
        },
        {
          "name": "priceSol",
          "type": "u64"
        }
      ]
    },
    {
      "name": "delistNft",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "sellBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "purchase",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerUserPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "seller",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerUserPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "nftBump",
          "type": "u8"
        },
        {
          "name": "sellerBump",
          "type": "u8"
        },
        {
          "name": "buyerBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositToEscrow",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "userBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        },
        {
          "name": "sol",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawFromEscrow",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "userBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        },
        {
          "name": "sol",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initOfferData",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "offerDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nft",
          "type": "publicKey"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "makeOffer",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sellDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offerDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "sellBump",
          "type": "u8"
        },
        {
          "name": "offerBump",
          "type": "u8"
        },
        {
          "name": "userBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        },
        {
          "name": "price",
          "type": "u64"
        }
      ]
    },
    {
      "name": "cancelOffer",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "offerDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "offerBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "acceptOffer",
      "accounts": [
        {
          "name": "seller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sellDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offerDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerUserPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerUserPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "nftBump",
          "type": "u8"
        },
        {
          "name": "offerBump",
          "type": "u8"
        },
        {
          "name": "buyerBump",
          "type": "u8"
        },
        {
          "name": "sellerBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initAuctionData",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auctionDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nft",
          "type": "publicKey"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createAuction",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auctionDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "auctionBump",
          "type": "u8"
        },
        {
          "name": "startPrice",
          "type": "u64"
        },
        {
          "name": "minIncrease",
          "type": "u64"
        },
        {
          "name": "endDate",
          "type": "i64"
        }
      ]
    },
    {
      "name": "placeBid",
      "accounts": [
        {
          "name": "bidder",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auctionDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "outBidder",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "auctionBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        },
        {
          "name": "price",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimAuction",
      "accounts": [
        {
          "name": "bidder",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auctionDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bidderUserPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorUserPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "auctionBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "cancelAuction",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auctionDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "auctionBump",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "publicKey"
          },
          {
            "name": "marketFeeSol",
            "type": "u64"
          },
          {
            "name": "teamCount",
            "type": "u64"
          },
          {
            "name": "teamTreasury",
            "type": {
              "array": [
                "publicKey",
                8
              ]
            }
          },
          {
            "name": "treasuryRate",
            "type": {
              "array": [
                "u64",
                8
              ]
            }
          }
        ]
      }
    },
    {
      "name": "sellData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "seller",
            "type": "publicKey"
          },
          {
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "priceSol",
            "type": "u64"
          },
          {
            "name": "listedDate",
            "type": "i64"
          },
          {
            "name": "active",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "offerData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "buyer",
            "type": "publicKey"
          },
          {
            "name": "offerPrice",
            "type": "u64"
          },
          {
            "name": "offerListingDate",
            "type": "i64"
          },
          {
            "name": "active",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "auctionData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "startPrice",
            "type": "u64"
          },
          {
            "name": "minIncreaseAmount",
            "type": "u64"
          },
          {
            "name": "endDate",
            "type": "i64"
          },
          {
            "name": "lastBidDate",
            "type": "i64"
          },
          {
            "name": "lastBidder",
            "type": "publicKey"
          },
          {
            "name": "highestBid",
            "type": "u64"
          },
          {
            "name": "status",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "userData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "tradedVolume",
            "type": "u64"
          },
          {
            "name": "escrowSolBalance",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "MarketplaceError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidSuperOwner"
          },
          {
            "name": "InvalidOwner"
          },
          {
            "name": "InvalidGlobalPool"
          },
          {
            "name": "InvalidFeePercent"
          },
          {
            "name": "MaxTeamCountExceed"
          },
          {
            "name": "NoTeamTreasuryYet"
          },
          {
            "name": "TreasuryAddressNotFound"
          },
          {
            "name": "TreasuryAddressAlreadyAdded"
          },
          {
            "name": "MaxTreasuryRateSumExceed"
          },
          {
            "name": "TeamTreasuryCountMismatch"
          },
          {
            "name": "TeamTreasuryAddressMismatch"
          },
          {
            "name": "Uninitialized"
          },
          {
            "name": "InvalidParamInput"
          },
          {
            "name": "SellerMismatch"
          },
          {
            "name": "InvalidNFTDataAcount"
          },
          {
            "name": "NotListedNFT"
          },
          {
            "name": "SellerAccountMismatch"
          },
          {
            "name": "InsufficientBuyerSolBalance"
          },
          {
            "name": "InsufficientBuyerTokenBalance"
          },
          {
            "name": "InvaliedMetadata"
          },
          {
            "name": "MetadataCreatorParseError"
          },
          {
            "name": "InvalidOfferDataMint"
          },
          {
            "name": "InvalidOfferDataBuyer"
          },
          {
            "name": "OfferForNotListedNFT"
          },
          {
            "name": "InvalidOfferPrice"
          },
          {
            "name": "DisabledOffer"
          },
          {
            "name": "OfferForExpiredListingNFT"
          },
          {
            "name": "EndedAuction"
          },
          {
            "name": "InvalidBidPrice"
          },
          {
            "name": "DoubleBidFromOneBidder"
          },
          {
            "name": "OutBidderMismatch"
          },
          {
            "name": "NotEndedAuction"
          },
          {
            "name": "CreatorAccountMismatch"
          },
          {
            "name": "BidderAccountMismatch"
          },
          {
            "name": "AuctionHasBid"
          },
          {
            "name": "BidFromAuctionCreator"
          }
        ]
      }
    }
  ]
};

export const IDL: MdsMarketplace = {
  "version": "0.1.0",
  "name": "mds_marketplace",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateFee",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "solFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addTeamTreasury",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "address",
          "type": "publicKey"
        },
        {
          "name": "rate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "removeTeamTreasury",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "address",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "initUserPool",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initSellData",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sellDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nft",
          "type": "publicKey"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "listNftForSale",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "sellBump",
          "type": "u8"
        },
        {
          "name": "priceSol",
          "type": "u64"
        }
      ]
    },
    {
      "name": "delistNft",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "sellBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "purchase",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerUserPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "seller",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerUserPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "nftBump",
          "type": "u8"
        },
        {
          "name": "sellerBump",
          "type": "u8"
        },
        {
          "name": "buyerBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositToEscrow",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "userBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        },
        {
          "name": "sol",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawFromEscrow",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "userBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        },
        {
          "name": "sol",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initOfferData",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "offerDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nft",
          "type": "publicKey"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "makeOffer",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sellDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offerDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "sellBump",
          "type": "u8"
        },
        {
          "name": "offerBump",
          "type": "u8"
        },
        {
          "name": "userBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        },
        {
          "name": "price",
          "type": "u64"
        }
      ]
    },
    {
      "name": "cancelOffer",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "offerDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "offerBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "acceptOffer",
      "accounts": [
        {
          "name": "seller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "sellDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "offerDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerUserPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerUserPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "nftBump",
          "type": "u8"
        },
        {
          "name": "offerBump",
          "type": "u8"
        },
        {
          "name": "buyerBump",
          "type": "u8"
        },
        {
          "name": "sellerBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initAuctionData",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auctionDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "nft",
          "type": "publicKey"
        },
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createAuction",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auctionDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "auctionBump",
          "type": "u8"
        },
        {
          "name": "startPrice",
          "type": "u64"
        },
        {
          "name": "minIncrease",
          "type": "u64"
        },
        {
          "name": "endDate",
          "type": "i64"
        }
      ]
    },
    {
      "name": "placeBid",
      "accounts": [
        {
          "name": "bidder",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "auctionDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "outBidder",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "auctionBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        },
        {
          "name": "price",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimAuction",
      "accounts": [
        {
          "name": "bidder",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auctionDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrowVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bidderUserPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorUserPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "auctionBump",
          "type": "u8"
        },
        {
          "name": "escrowBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "cancelAuction",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalAuthority",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "auctionDataInfo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destNftTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalBump",
          "type": "u8"
        },
        {
          "name": "auctionBump",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "superAdmin",
            "type": "publicKey"
          },
          {
            "name": "marketFeeSol",
            "type": "u64"
          },
          {
            "name": "teamCount",
            "type": "u64"
          },
          {
            "name": "teamTreasury",
            "type": {
              "array": [
                "publicKey",
                8
              ]
            }
          },
          {
            "name": "treasuryRate",
            "type": {
              "array": [
                "u64",
                8
              ]
            }
          }
        ]
      }
    },
    {
      "name": "sellData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "seller",
            "type": "publicKey"
          },
          {
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "priceSol",
            "type": "u64"
          },
          {
            "name": "listedDate",
            "type": "i64"
          },
          {
            "name": "active",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "offerData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "buyer",
            "type": "publicKey"
          },
          {
            "name": "offerPrice",
            "type": "u64"
          },
          {
            "name": "offerListingDate",
            "type": "i64"
          },
          {
            "name": "active",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "auctionData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "startPrice",
            "type": "u64"
          },
          {
            "name": "minIncreaseAmount",
            "type": "u64"
          },
          {
            "name": "endDate",
            "type": "i64"
          },
          {
            "name": "lastBidDate",
            "type": "i64"
          },
          {
            "name": "lastBidder",
            "type": "publicKey"
          },
          {
            "name": "highestBid",
            "type": "u64"
          },
          {
            "name": "status",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "userData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "tradedVolume",
            "type": "u64"
          },
          {
            "name": "escrowSolBalance",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "MarketplaceError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidSuperOwner"
          },
          {
            "name": "InvalidOwner"
          },
          {
            "name": "InvalidGlobalPool"
          },
          {
            "name": "InvalidFeePercent"
          },
          {
            "name": "MaxTeamCountExceed"
          },
          {
            "name": "NoTeamTreasuryYet"
          },
          {
            "name": "TreasuryAddressNotFound"
          },
          {
            "name": "TreasuryAddressAlreadyAdded"
          },
          {
            "name": "MaxTreasuryRateSumExceed"
          },
          {
            "name": "TeamTreasuryCountMismatch"
          },
          {
            "name": "TeamTreasuryAddressMismatch"
          },
          {
            "name": "Uninitialized"
          },
          {
            "name": "InvalidParamInput"
          },
          {
            "name": "SellerMismatch"
          },
          {
            "name": "InvalidNFTDataAcount"
          },
          {
            "name": "NotListedNFT"
          },
          {
            "name": "SellerAccountMismatch"
          },
          {
            "name": "InsufficientBuyerSolBalance"
          },
          {
            "name": "InsufficientBuyerTokenBalance"
          },
          {
            "name": "InvaliedMetadata"
          },
          {
            "name": "MetadataCreatorParseError"
          },
          {
            "name": "InvalidOfferDataMint"
          },
          {
            "name": "InvalidOfferDataBuyer"
          },
          {
            "name": "OfferForNotListedNFT"
          },
          {
            "name": "InvalidOfferPrice"
          },
          {
            "name": "DisabledOffer"
          },
          {
            "name": "OfferForExpiredListingNFT"
          },
          {
            "name": "EndedAuction"
          },
          {
            "name": "InvalidBidPrice"
          },
          {
            "name": "DoubleBidFromOneBidder"
          },
          {
            "name": "OutBidderMismatch"
          },
          {
            "name": "NotEndedAuction"
          },
          {
            "name": "CreatorAccountMismatch"
          },
          {
            "name": "BidderAccountMismatch"
          },
          {
            "name": "AuctionHasBid"
          },
          {
            "name": "BidFromAuctionCreator"
          }
        ]
      }
    }
  ]
};
