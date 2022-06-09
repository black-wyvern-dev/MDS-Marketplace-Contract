import {
    Connection,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const METAPLEX = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export const getOwnerOfNFT = async (nftMintPk : PublicKey, connection: Connection) : Promise<PublicKey> => {
    let tokenAccountPK = await getNFTTokenAccount(nftMintPk, connection);
    let tokenAccountInfo = await connection.getAccountInfo(tokenAccountPK);
    
    console.log("nftMintPk=", nftMintPk.toBase58());
    console.log("tokenAccountInfo =", tokenAccountInfo);
  
    if (tokenAccountInfo && tokenAccountInfo.data ) {
      let ownerPubkey = new PublicKey(tokenAccountInfo.data.slice(32, 64))
      console.log("ownerPubkey=", ownerPubkey.toBase58());
      return ownerPubkey;
    }
    return new PublicKey("");
}
  
export const getTokenAccount = async (mintPk : PublicKey, userPk: PublicKey, connection: Connection) : Promise<PublicKey> => {
    let tokenAccount = await connection.getProgramAccounts(
      TOKEN_PROGRAM_ID,
      {
        filters: [
          {
            dataSize: 165
          },
          {
            memcmp: {
              offset: 0,
              bytes: mintPk.toBase58()
            }
          },
          {
            memcmp: {
              offset: 32,
              bytes: userPk.toBase58()
            }
          },
        ]
      }
    );
    return tokenAccount[0].pubkey;
}
  
export const getNFTTokenAccount = async (nftMintPk : PublicKey, connection: Connection) : Promise<PublicKey> => {
    console.log("getNFTTokenAccount nftMintPk=", nftMintPk.toBase58());
    let tokenAccount = await connection.getProgramAccounts(
      TOKEN_PROGRAM_ID,
      {
        filters: [
          {
            dataSize: 165
          },
          {
            memcmp: {
              offset: 64,
              bytes: '2'
            }
          },
          {
            memcmp: {
              offset: 0,
              bytes: nftMintPk.toBase58()
            }
          },
        ]
      }
    );
    return tokenAccount[0].pubkey;
}
  
export const getAssociatedTokenAccount = async (ownerPubkey : PublicKey, mintPk : PublicKey) : Promise<PublicKey> => {
    let associatedTokenAccountPubkey = (await PublicKey.findProgramAddress(
        [
            ownerPubkey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintPk.toBuffer(), // mint address
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];
    return associatedTokenAccountPubkey;
}

export const getATokenAccountsNeedCreate = async (
    connection: Connection,
    walletAddress: PublicKey,
    owner: PublicKey,
    nfts: PublicKey[],
) => {
    let instructions = [], destinationAccounts = [];
    for (const mint of nfts) {
        const destinationPubkey = await getAssociatedTokenAccount(owner, mint);
        const response = await connection.getAccountInfo(destinationPubkey);
        if (!response) {
            const createATAIx = createAssociatedTokenAccountInstruction(
            destinationPubkey,
            walletAddress,
            owner,
            mint,
            );
            instructions.push(createATAIx);
        }
        destinationAccounts.push(destinationPubkey);
    }
    return {
        instructions,
        destinationAccounts,
    };
}
  
export const createAssociatedTokenAccountInstruction = (
    associatedTokenAddress: PublicKey,
    payer: PublicKey,
    walletAddress: PublicKey,
    splTokenMintAddress: PublicKey
) => {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
        { pubkey: walletAddress, isSigner: false, isWritable: false },
        { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
        {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        {
            pubkey: SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
    ];
    return new TransactionInstruction({
        keys,
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        data: Buffer.from([]),
    });
}

/** Get metaplex mint metadata account address */
export const getMetadata = async (mint: PublicKey): Promise<PublicKey> => {
    return (
        await PublicKey.findProgramAddress([Buffer.from('metadata'), METAPLEX.toBuffer(), mint.toBuffer()], METAPLEX)
    )[0];
};
