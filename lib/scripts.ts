import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
    PublicKey,
    Connection,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
} from '@solana/web3.js';
import {
    MARKETPLACE_PROGRAM_ID,
    GLOBAL_AUTHORITY_SEED,
    GlobalPool,
    SellData,
    SELL_DATA_SEED,
    SELL_DATA_SIZE,
} from './types';
import {
    getAssociatedTokenAccount,
    getATokenAccountsNeedCreate,
    getNFTTokenAccount,
    getOwnerOfNFT,
    getMetadata,
    METAPLEX,
} from './utils';

export const getNFTPoolState = async (
    mint: PublicKey,
    program: anchor.Program,
): Promise<SellData | null> => {
    if (!mint) return null;

    const [sellData, _] = await PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    console.log('Sell Data PDA: ', sellData.toBase58());
    try {
        let poolState = await program.account.sellData.fetch(sellData);
        return poolState as unknown as SellData;
    } catch {
        return null;
    }
}

/** Get all registered NFTs info for max stake amount calculation */
export const getAllListedNFTs = async (connection: Connection, rpcUrl: string | undefined) => {
    let solConnection = connection;

    if (rpcUrl) {
        solConnection = new anchor.web3.Connection(rpcUrl, "confirmed");
    }

    let poolAccounts = await solConnection.getProgramAccounts(
      MARKETPLACE_PROGRAM_ID,
      {
        filters: [
          {
            dataSize: SELL_DATA_SIZE,
          },
        ]
      }
    );

    console.log(`Encounter ${poolAccounts.length} NFT Data Accounts`);

    let result: SellData[] = [];

    try {
        for (let idx = 0; idx < poolAccounts.length; idx++) {
            let data = poolAccounts[idx].account.data;
            const mint = new PublicKey(data.slice(8, 40));

            let seller = new PublicKey(data.slice(40, 72));

            let collection = new PublicKey(data.slice(72, 104));

            let buf = data.slice(104, 112).reverse();
            let price = (new anchor.BN(buf));

            buf = data.slice(112, 120).reverse();
            let active = (new anchor.BN(buf));

            if (active.toNumber() == 1)
                result.push({
                    mint,
                    seller,
                    collection,
                    price,
                    active,
                });
        }
    } catch (e) {
        console.log(e);
        return {};
    }

    return {
        count: result.length,
        data: result.map((info: SellData) => {
            return {
                mint: info.mint.toBase58(),
                seller: info.seller.toBase58(),
                collection: info.collection.toBase58(),
                price: info.price.toNumber(),
                active: info.active.toNumber(),
            }
        })
    }
};

export const getGlobalState = async (
    program: anchor.Program,
): Promise<GlobalPool | null> => {
    const [globalAuthority, _] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID
    );
    try {
        let globalState = await program.account.globalPool.fetch(globalAuthority);
        return globalState as unknown as GlobalPool;
    } catch {
        return null;
    }
}

export const createInitializeTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );
    
    let tx = new Transaction();
    console.log('==>initializing program', globalAuthority.toBase58());

    tx.add(program.instruction.initialize(
        bump, {
        accounts: {
            admin: userAddress,
            globalAuthority,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createInitSellDataTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    program: anchor.Program,
) => {
    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    
    let tx = new Transaction();
    console.log('==>initializing sell PDA', mint.toBase58(), nftData.toBase58());

    tx.add(program.instruction.initSellData(
        mint, nft_bump, {
        accounts: {
            payer: userAddress,
            sellDataInfo: nftData,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createListForSellNftTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    program: anchor.Program,
    connection: Connection,
    price: number,
) => {
    if (price < 0) {
        throw 'Invalid Price Value';
    }

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    let userTokenAccount = await getAssociatedTokenAccount(userAddress, mint);
    let accountOfNFT = await getNFTTokenAccount(mint, connection);
    if (userTokenAccount.toBase58() != accountOfNFT.toBase58()) {
        let nftOwner = await getOwnerOfNFT(mint, connection);
        if (nftOwner.toBase58() == userAddress.toBase58()) userTokenAccount = accountOfNFT;
        else if (nftOwner.toBase58() !== globalAuthority.toBase58()) {
            throw 'Error: Nft is not owned by user';
        }
    }
    console.log("NFT = ", mint.toBase58(), userTokenAccount.toBase58());

    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        globalAuthority,
        [mint]
    );

    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58())

    const metadata = await getMetadata(mint);
    console.log("Metadata=", metadata.toBase58());

    let tx = new Transaction();

    if (instructions.length > 0) instructions.map((ix) => tx.add(ix));
    console.log('==>listing', mint.toBase58(), price);

    tx.add(program.instruction.listNftForSale(
        bump, nft_bump, new anchor.BN(price), {
        accounts: {
            owner: userAddress,
            globalAuthority,
            sellDataInfo: nftData,
            userTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            mintMetadata: metadata,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: METAPLEX,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createDelistNftTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    program: anchor.Program,
    connection: Connection,
) => {
    let ret = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        userAddress,
        [mint]
    );
    let userTokenAccount = ret.destinationAccounts[0];
    console.log("User NFT = ", mint.toBase58(), userTokenAccount.toBase58());

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID
    );

    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID
    );

    let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        globalAuthority,
        [mint]
    );

    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58());

    let tx = new Transaction();

    if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
    console.log('==> withdrawing', mint.toBase58());
    tx.add(program.instruction.delistNft(
        bump, nft_bump, {
        accounts: {
            owner: userAddress,
            globalAuthority,
            sellDataInfo: nftData,
            userTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}
