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
          "name": "price",
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
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerTokenAccount",
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
          "name": "sellBump",
          "type": "u8"
        },
        {
          "name": "byToken",
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
            "name": "marketFeeToken",
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
            "name": "priceToken",
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
            "name": "byToken",
            "type": "u64"
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
            "name": "mintIncreaseAmount",
            "type": "u64"
          },
          {
            "name": "byToken",
            "type": "u64"
          },
          {
            "name": "endDate",
            "type": "i64"
          },
          {
            "name": "createdDate",
            "type": "i64"
          },
          {
            "name": "settled",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "bidData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "bidder",
            "type": "publicKey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "auctionCreatedDate",
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
      "name": "userData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "requiredEscrowSol",
            "type": "u64"
          },
          {
            "name": "requiredEscrowToken",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidSuperOwner",
      "msg": "Invalid Super Owner"
    },
    {
      "code": 6001,
      "name": "InvalidGlobalPool",
      "msg": "Invalid Global Pool Address"
    },
    {
      "code": 6002,
      "name": "InvalidFeePercent",
      "msg": "Marketplace Fee is Permille"
    },
    {
      "code": 6003,
      "name": "MaxTeamCountExceed",
      "msg": "Max Team Count is 8"
    },
    {
      "code": 6004,
      "name": "NoTeamTreasuryYet",
      "msg": "Treasury Wallet Not Configured"
    },
    {
      "code": 6005,
      "name": "TreasuryAddressNotFound",
      "msg": "Treasury Address Not Exist"
    },
    {
      "code": 6006,
      "name": "TreasuryAddressAlreadyAdded",
      "msg": "Treasury Address Already Exist"
    },
    {
      "code": 6007,
      "name": "MaxTreasuryRateSumExceed",
      "msg": "Total Treasury Rate Sum Should Less Than 100%"
    },
    {
      "code": 6008,
      "name": "Uninitialized",
      "msg": "Uninitialized Account"
    },
    {
      "code": 6009,
      "name": "InvalidParamInput",
      "msg": "Instruction Parameter is Invalid"
    },
    {
      "code": 6010,
      "name": "SellerMismatch",
      "msg": "Payer Mismatch with NFT Seller"
    },
    {
      "code": 6011,
      "name": "InvalidNFTDataAcount",
      "msg": "Invalid NFT Data Account"
    },
    {
      "code": 6012,
      "name": "NotListedNFT",
      "msg": "The NFT Is Not Listed"
    },
    {
      "code": 6013,
      "name": "SellerAcountMismatch",
      "msg": "Seller Account Mismatch with NFT Seller Data"
    },
    {
      "code": 6014,
      "name": "InsufficientBuyerSolBalance",
      "msg": "Buyer Sol Balance is Less than NFT SOL Price"
    },
    {
      "code": 6015,
      "name": "InvaliedMetadata",
      "msg": "Invalid Metadata Address"
    },
    {
      "code": 6016,
      "name": "MetadataCreatorParseError",
      "msg": "Can't Parse The NFT's Creators"
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
          "name": "price",
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
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerTokenAccount",
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
          "name": "sellBump",
          "type": "u8"
        },
        {
          "name": "byToken",
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
            "name": "marketFeeToken",
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
            "name": "priceToken",
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
            "name": "byToken",
            "type": "u64"
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
            "name": "mintIncreaseAmount",
            "type": "u64"
          },
          {
            "name": "byToken",
            "type": "u64"
          },
          {
            "name": "endDate",
            "type": "i64"
          },
          {
            "name": "createdDate",
            "type": "i64"
          },
          {
            "name": "settled",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "bidData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "bidder",
            "type": "publicKey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "auctionCreatedDate",
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
      "name": "userData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "requiredEscrowSol",
            "type": "u64"
          },
          {
            "name": "requiredEscrowToken",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidSuperOwner",
      "msg": "Invalid Super Owner"
    },
    {
      "code": 6001,
      "name": "InvalidGlobalPool",
      "msg": "Invalid Global Pool Address"
    },
    {
      "code": 6002,
      "name": "InvalidFeePercent",
      "msg": "Marketplace Fee is Permille"
    },
    {
      "code": 6003,
      "name": "MaxTeamCountExceed",
      "msg": "Max Team Count is 8"
    },
    {
      "code": 6004,
      "name": "NoTeamTreasuryYet",
      "msg": "Treasury Wallet Not Configured"
    },
    {
      "code": 6005,
      "name": "TreasuryAddressNotFound",
      "msg": "Treasury Address Not Exist"
    },
    {
      "code": 6006,
      "name": "TreasuryAddressAlreadyAdded",
      "msg": "Treasury Address Already Exist"
    },
    {
      "code": 6007,
      "name": "MaxTreasuryRateSumExceed",
      "msg": "Total Treasury Rate Sum Should Less Than 100%"
    },
    {
      "code": 6008,
      "name": "Uninitialized",
      "msg": "Uninitialized Account"
    },
    {
      "code": 6009,
      "name": "InvalidParamInput",
      "msg": "Instruction Parameter is Invalid"
    },
    {
      "code": 6010,
      "name": "SellerMismatch",
      "msg": "Payer Mismatch with NFT Seller"
    },
    {
      "code": 6011,
      "name": "InvalidNFTDataAcount",
      "msg": "Invalid NFT Data Account"
    },
    {
      "code": 6012,
      "name": "NotListedNFT",
      "msg": "The NFT Is Not Listed"
    },
    {
      "code": 6013,
      "name": "SellerAcountMismatch",
      "msg": "Seller Account Mismatch with NFT Seller Data"
    },
    {
      "code": 6014,
      "name": "InsufficientBuyerSolBalance",
      "msg": "Buyer Sol Balance is Less than NFT SOL Price"
    },
    {
      "code": 6015,
      "name": "InvaliedMetadata",
      "msg": "Invalid Metadata Address"
    },
    {
      "code": 6016,
      "name": "MetadataCreatorParseError",
      "msg": "Can't Parse The NFT's Creators"
    }
  ]
};