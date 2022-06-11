import { Program, web3 } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import { Keypair, 
    PublicKey,
} from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';

import { GlobalPool, GLOBAL_AUTHORITY_SEED, MARKETPLACE_PROGRAM_ID, SellData, SELL_DATA_SEED, UserData, USER_DATA_SEED } from '../lib/types';
import {IDL as MarketplaceIDL} from '../target/types/mds_marketplace';
import {
    createDelistNftTx,
    createDepositTx,
    createInitializeTx,
    createInitSellDataTx,
    createInitUserTx,
    createListForSellNftTx,
    createPurchaseTx,
    createWithdrawTx,
    getAllListedNFTs,
    getGlobalState,
    getNFTPoolState,
    getUserPoolState
} from '../lib/scripts';

let solConnection = null;
let payer = null;
let program: Program = null;

// Address of the deployed program.
let programId = new anchor.web3.PublicKey(MARKETPLACE_PROGRAM_ID);

export const setClusterConfig = async (cluster: web3.Cluster) => {
    solConnection = new web3.Connection(web3.clusterApiUrl(cluster));
    const walletKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.resolve(process.env.ANCHOR_WALLET), 'utf-8'))), { skipValidation: true });
    const wallet = new NodeWallet(walletKeypair);
    // anchor.setProvider(anchor.AnchorProvider.local(web3.clusterApiUrl(cluster)));
    // Configure the client to use the local cluster.
    anchor.setProvider(new anchor.AnchorProvider(solConnection, wallet, {skipPreflight: true, commitment: 'confirmed'}));
    payer = wallet;

    // Generate the program client from IDL.
    program = new anchor.Program(MarketplaceIDL as anchor.Idl, programId);
    console.log('ProgramId: ', program.programId.toBase58());

    const [globalAuthority, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(GLOBAL_AUTHORITY_SEED)],
        program.programId
    );
    console.log('GlobalAuthority: ', globalAuthority.toBase58());

    // await main();
}

const main = async () => {

    // await initProject();
    // await addCollection(new PublicKey('B2FmSY81mionC1DYvKky5Y8nUXSWnhMmd5L5nbm99VHQ'));
    // await removeCollection(new PublicKey('B2FmSY81mionC1DYvKky5Y8nUXSWnhMmd5L5nbm99VHQ'));

    // const globalPool: GlobalPool = await getGlobalState();
    // console.log("globalPool =", globalPool.superAdmin.toBase58(), globalPool.fullStakePeriod.toNumber()
    // , globalPool.minStakePeriod.toNumber(), globalPool.rewardPeriod.toNumber()
    // , globalPool.rewardAmount.toNumber(), globalPool.totalStakedCount.toNumber(),
    // globalPool.collectionCount.toNumber(), globalPool.collections.slice(0, globalPool.collectionCount.toNumber()).map((addr) => addr.toBase58()));

    // await initUserPool(payer.publicKey);

    // await stakeNft(payer.publicKey, new PublicKey('554AJqCuVFWL7ZHtLqmh18NvuC4UYLP12Bc8fN4RvTex'));
    // await claimReward(payer.publicKey);
    // await withdrawNft(payer.publicKey, new PublicKey('554AJqCuVFWL7ZHtLqmh18NvuC4UYLP12Bc8fN4RvTex'));
    // await burnNft(payer.publicKey, new PublicKey('4Qw3PQqY3q8LbZAYXfwpjUGS4k7anqdRrPyDL9LWue4d'));

    // const userPool: UserPool = await getUserPoolState(new PublicKey('2EnGnSaf89uP6n7prHrKWK9Q41yAWbRkTN1b5ry8XxCw'));
    // console.log({
    //     ...userPool,
    //     owner: userPool.owner.toBase58(),
    //     stakedMints: userPool.stakedMints.slice(0, userPool.stakedCount.toNumber()).map((info) => {
    //         return {
    //             mint: info.mint.toBase58(),
    //             stakedTime: info.stakedTime.toNumber(),
    //         }
    //     })
    // });
    // calculateRewards(new PublicKey('GyjFWXkMn4AGrD5FPfBegP75zmodBeBxr9gBRJjr8qke'));
    
};

export const initProject = async (
) => {
    const tx = await createInitializeTx(payer.publicKey, program);
    const {blockhash} = await solConnection.getRecentBlockhash('confirmed');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "confirmed");
    console.log("txHash =", txId);
}

export const initSellData = async (
    mint: PublicKey,
) => {
    const tx = await createInitSellDataTx(mint, payer.publicKey, program);
    const {blockhash} = await solConnection.getRecentBlockhash('finalized');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "finalized");
    console.log("Your transaction signature", txId);
}

export const initUserPool = async (
) => {
    const tx = await createInitUserTx(payer.publicKey, program);
    const {blockhash} = await solConnection.getRecentBlockhash('finalized');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "finalized");
    console.log("Your transaction signature", txId);
}

export const depositEscrow = async (
    sol: number,
    token: number,
) => {
    let userAddress = payer.publicKey;
    console.log(userAddress.toBase58(), sol, token);

    const [userPool, _] = await PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), userAddress.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    console.log('User Data PDA: ', userPool.toBase58());

    let poolAccount = await solConnection.getAccountInfo(userPool);
    if (poolAccount === null || poolAccount.data === null) {
        await initUserPool();
    }

    const tx = await createDepositTx(userAddress, sol, token, program, solConnection);
    const {blockhash} = await solConnection.getRecentBlockhash('confirmed');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "confirmed");
    console.log("Your transaction signature", txId);
}

export const withdrawEscrow = async (
    sol: number,
    token: number,
) => {
    let userAddress = payer.publicKey;
    console.log(userAddress.toBase58(), sol, token);

    const tx = await createWithdrawTx(userAddress, sol, token, program, solConnection);
    const {blockhash} = await solConnection.getRecentBlockhash('confirmed');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "confirmed");
    console.log("Your transaction signature", txId);
}
    
export const listNftForSale = async (
    mint: PublicKey,
    priceSol: number,
    priceToken: number,
) => {
    console.log(mint.toBase58(), priceSol, priceToken);

    const [sellData, _] = await PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), mint.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );
    console.log('Sell Data PDA: ', sellData.toBase58());

    let poolAccount = await solConnection.getAccountInfo(sellData);
    if (poolAccount === null || poolAccount.data === null) {
        await initSellData(mint);
    }

    const tx = await createListForSellNftTx(mint, payer.publicKey, program, solConnection, priceSol, priceToken);
    const {blockhash} = await solConnection.getRecentBlockhash('confirmed');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "confirmed");
    console.log("Your transaction signature", txId);
}

export const delistNft = async (
    mint: PublicKey,
) => {
    console.log(mint.toBase58());

    const tx = await createDelistNftTx(mint, payer.publicKey, program, solConnection);
    const {blockhash} = await solConnection.getRecentBlockhash('confirmed');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "confirmed");
    console.log("Your transaction signature", txId);
}

export const purchase = async (
    mint: PublicKey,
    byToken: boolean,
) => {
    console.log(mint.toBase58(), byToken);

    const tx = await createPurchaseTx(mint, payer.publicKey, byToken, program, solConnection);
    const {blockhash} = await solConnection.getRecentBlockhash('confirmed');
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = blockhash;
    payer.signTransaction(tx);
    let txId = await solConnection.sendTransaction(tx, [(payer as NodeWallet).payer]);
    await solConnection.confirmTransaction(txId, "confirmed");
    console.log("Your transaction signature", txId);
}

export const getNFTPoolInfo = async (
    mint: PublicKey,
) => {
    const nftData: SellData = await getNFTPoolState(mint, program);
    return {
      mint: nftData.mint.toBase58(),
      seller: nftData.seller.toBase58(),
      collection: nftData.collection.toBase58(),
      priceSol: nftData.priceSol.toNumber(),
      priceToken: nftData.priceToken.toNumber(),
      listedDate: nftData.listedDate.toNumber(),
      active: nftData.active.toNumber(),
    };
}

export const getUserPoolInfo = async (
    userAddress: PublicKey,
) => {
    const userData: UserData = await getUserPoolState(userAddress, program);
    return {
      address: userData.address.toBase58(),
      escrowSol: userData.escrowSolBalance.toNumber(),
      escrowTokenBalance: userData.escrowTokenBalance.toNumber(),
      tradedVolume: userData.tradedVolume.toNumber(),
      tradedTokenVolume: userData.tradedTokenVolume.toNumber(),
    };
}

export const getGlobalInfo = async () => {
    const globalPool: GlobalPool = await getGlobalState(program);
    const result = {
      admin: globalPool.superAdmin.toBase58(),
      marketFeeSol: globalPool.marketFeeSol.toNumber(),
      marketFeeToken: globalPool.marketFeeToken.toNumber(),
    };

    return result;
}

export const getAllNFTs = async (rpc?: string) => {
    return await getAllListedNFTs(solConnection, rpc);
}