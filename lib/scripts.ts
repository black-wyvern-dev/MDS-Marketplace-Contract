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
    ABB_TOKEN_MINT,
    ESCROW_VAULT_SEED,
    USER_DATA_SEED,
    UserData,
} from './types';
import {
    getAssociatedTokenAccount,
    getATokenAccountsNeedCreate,
    getNFTTokenAccount,
    getOwnerOfNFT,
    getMetadata,
    METAPLEX,
    isExistAccount,
    getTokenAccount,
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
    // let solConnection = connection;

    // if (rpcUrl) {
    //     solConnection = new anchor.web3.Connection(rpcUrl, "confirmed");
    // }

    // let poolAccounts = await solConnection.getProgramAccounts(
    //   MARKETPLACE_PROGRAM_ID,
    //   {
    //     filters: [
    //       {
    //         dataSize: SELL_DATA_SIZE,
    //       },
    //     ]
    //   }
    // );

    // console.log(`Encounter ${poolAccounts.length} NFT Data Accounts`);

    // let result: SellData[] = [];

    // try {
    //     for (let idx = 0; idx < poolAccounts.length; idx++) {
    //         let data = poolAccounts[idx].account.data;
    //         const mint = new PublicKey(data.slice(8, 40));

    //         let seller = new PublicKey(data.slice(40, 72));

    //         let collection = new PublicKey(data.slice(72, 104));

    //         let buf = data.slice(104, 112).reverse();
    //         let price = (new anchor.BN(buf));

    //         buf = data.slice(112, 120).reverse();
    //         let active = (new anchor.BN(buf));

    //         if (active.toNumber() == 1)
    //             result.push({
    //                 mint,
    //                 seller,
    //                 collection,
    //                 price,
    //                 active,
    //             });
    //     }
    // } catch (e) {
    //     console.log(e);
    //     return {};
    // }

    // return {
    //     count: result.length,
    //     data: result.map((info: SellData) => {
    //         return {
    //             mint: info.mint.toBase58(),
    //             seller: info.seller.toBase58(),
    //             collection: info.collection.toBase58(),
    //             price: info.price.toNumber(),
    //             active: info.active.toNumber(),
    //         }
    //     })
    // }
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

export const getUserPoolState = async (
    userAddress: PublicKey,
    program: anchor.Program,
): Promise<UserData | null> => {
    if (!userAddress) return null;

    const [userPool, _] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    console.log('User Data PDA: ', userPool.toBase58());
    try {
        let poolState = await program.account.userData.fetch(userPool);
        return poolState as unknown as UserData;
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
    const [escrowVault, escrow_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(ESCROW_VAULT_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    let tx = new Transaction();
    console.log('==>initializing program', globalAuthority.toBase58());

    tx.add(program.instruction.initialize(
        bump, escrow_bump, {
        accounts: {
            admin: userAddress,
            globalAuthority,
            escrowVault,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createUpdateFeeTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
    solFee: number,
    tokenFee: number,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    let tx = new Transaction();
    console.log('==>updating fee', globalAuthority.toBase58(), solFee, tokenFee);

    tx.add(program.instruction.updateFee(
        bump, new anchor.BN(solFee), new anchor.BN(tokenFee), {
        accounts: {
            admin: userAddress,
            globalAuthority,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createAddTreasuryTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
    address: PublicKey,
    rate: number,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    let tx = new Transaction();
    console.log('==>adding team treasury', globalAuthority.toBase58(), address.toBase58(), rate);

    tx.add(program.instruction.addTeamTreasury(
        bump, address, new anchor.BN(rate), {
        accounts: {
            admin: userAddress,
            globalAuthority,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createRemoveTreasuryTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
    address: PublicKey,
) => {
    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    let tx = new Transaction();
    console.log('==>removing team treasury', globalAuthority.toBase58(), address.toBase58());

    tx.add(program.instruction.removeTeamTreasury(
        bump, address, {
        accounts: {
            admin: userAddress,
            globalAuthority,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createInitUserTx = async (
    userAddress: PublicKey,
    program: anchor.Program,
) => {
    const [userPool, user_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    let tx = new Transaction();
    console.log('==>initializing user pool', userPool.toBase58());

    tx.add(program.instruction.initUserPool(
        user_bump, {
        accounts: {
            owner: userAddress,
            userPool,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createDepositTx = async (
    userAddress: PublicKey,
    sol: number,
    token: number,
    program: anchor.Program,
    connection: Connection,
) => {
    let userTokenAccount = await getAssociatedTokenAccount(userAddress, ABB_TOKEN_MINT);
    if (!await isExistAccount(userTokenAccount, connection)) {
        try {
            let accountOfABB = await getTokenAccount(ABB_TOKEN_MINT, userAddress, connection);
            userTokenAccount = accountOfABB;
        } catch (e) {
            throw 'No ABB Token Account for this user';
        }
    }
    console.log("User ABB Account = ", userTokenAccount.toBase58());

    const [escrowVault, escrow_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(ESCROW_VAULT_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    const [userPool, user_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    let ret1 = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        escrowVault,
        [ABB_TOKEN_MINT]
    );
    console.log('escrowVault = ', escrowVault.toBase58());
    console.log("EscrowVault ABB Account = ", ret1.destinationAccounts[0].toBase58());

    let tx = new Transaction();

    if (ret1.instructions.length > 0) ret1.instructions.map((ix) => tx.add(ix));
    console.log('==> Depositing', userAddress.toBase58(), 'Sol', sol, 'Token:', token);
    tx.add(program.instruction.depositToEscrow(
        user_bump, escrow_bump, new anchor.BN(sol), new anchor.BN(token), {
        accounts: {
            owner: userAddress,
            userPool,
            escrowVault,
            userTokenAccount,
            escrowTokenAccount: ret1.destinationAccounts[0],
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}

export const createWithdrawTx = async (
    userAddress: PublicKey,
    sol: number,
    token: number,
    program: anchor.Program,
    connection: Connection,
) => {
    const [escrowVault, escrow_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(ESCROW_VAULT_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );
    let escrowTokenAccount = await getAssociatedTokenAccount(escrowVault, ABB_TOKEN_MINT);
    console.log('escrowVault = ', escrowVault.toBase58());
    console.log("Escrow ABB Account = ", escrowTokenAccount.toBase58());

    const [userPool, user_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    let ret1 = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        userAddress,
        [ABB_TOKEN_MINT]
    );
    console.log("User ABB Account = ", ret1.destinationAccounts[0].toBase58());

    let tx = new Transaction();

    if (ret1.instructions.length > 0) ret1.instructions.map((ix) => tx.add(ix));
    console.log('==> Withdrawing', userAddress.toBase58(), 'Sol', sol, 'Token:', token);
    tx.add(program.instruction.withdrawFromEscrow(
        user_bump, escrow_bump, new anchor.BN(sol), new anchor.BN(token), {
        accounts: {
            owner: userAddress,
            userPool,
            escrowVault,
            userTokenAccount: ret1.destinationAccounts[0],
            escrowTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
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
    priceSol: number,
    priceToken: number,
) => {
    if (priceSol < 0 || priceToken < 0) {
        throw 'Invalid Price Value';
    }

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID,
    );

    let userTokenAccount = await getAssociatedTokenAccount(userAddress, mint);
    if (!await isExistAccount(userTokenAccount, connection)) {
        let accountOfNFT = await getNFTTokenAccount(mint, connection);
        if (userTokenAccount.toBase58() != accountOfNFT.toBase58()) {
            let nftOwner = await getOwnerOfNFT(mint, connection);
            if (nftOwner.toBase58() == userAddress.toBase58()) userTokenAccount = accountOfNFT;
            else if (nftOwner.toBase58() !== globalAuthority.toBase58()) {
                throw 'Error: Nft is not owned by user';
            }
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
    console.log('==>listing', mint.toBase58(), priceSol, priceToken);

    tx.add(program.instruction.listNftForSale(
        bump, nft_bump, new anchor.BN(priceSol), new anchor.BN(priceToken), {
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


export const createPurchaseTx = async (
    mint: PublicKey,
    userAddress: PublicKey,
    byToken: boolean,
    program: anchor.Program,
    connection: Connection,
) => {
    let ret = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        userAddress,
        [mint]
    );
    let userNftTokenAccount = ret.destinationAccounts[0];
    console.log("User NFT = ", mint.toBase58(), userNftTokenAccount.toBase58());

    let userTokenAccount = await getAssociatedTokenAccount(userAddress, ABB_TOKEN_MINT);
    if (!await isExistAccount(userTokenAccount, connection)) {
        try {
            let accountOfABB = await getTokenAccount(ABB_TOKEN_MINT, userAddress, connection);
            userTokenAccount = accountOfABB;
        } catch (e) {
            throw 'No ABB Token Account for this user';
        }
    }
    console.log("User ABB Account = ", userTokenAccount.toBase58());

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        MARKETPLACE_PROGRAM_ID
    );

    const [nftData, nft_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID
    );
    const [userPool, user_bump] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    let { destinationAccounts } = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        globalAuthority,
        [mint]
    );

    console.log("Dest NFT Account = ", destinationAccounts[0].toBase58());

    let sellInfo = await getNFTPoolState(mint, program);
    let seller = sellInfo.seller;
    let ret1 = await getATokenAccountsNeedCreate(
        connection,
        userAddress,
        seller,
        [ABB_TOKEN_MINT]
    );
    console.log('Seller = ', seller.toBase58());
    console.log("seller ABB Account = ", ret1.destinationAccounts[0].toBase58());

    let tx = new Transaction();

    if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
    if (ret1.instructions.length > 0) ret1.instructions.map((ix) => tx.add(ix));
    console.log('==> Purchasing', mint.toBase58(), 'By Token:', byToken);
    tx.add(program.instruction.purchase(
        bump, nft_bump, user_bump, new anchor.BN(byToken ? 1 : 0), {
        accounts: {
            buyer: userAddress,
            globalAuthority,
            userPool,
            sellDataInfo: nftData,
            userNftTokenAccount,
            destNftTokenAccount: destinationAccounts[0],
            nftMint: mint,
            seller,
            userTokenAccount,
            sellerTokenAccount: ret1.destinationAccounts[0],
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        },
        instructions: [],
        signers: [],
    }));

    return tx;
}