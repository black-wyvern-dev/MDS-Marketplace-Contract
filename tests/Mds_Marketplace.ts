import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";
import fs from "fs";
import {
  createAddTreasuryTx,
  createDelistNftTx,
  createDepositTx,
  createInitializeTx,
  createInitSellDataTx,
  createInitUserTx,
  createListForSellNftTx,
  createPurchaseTx,
  createRemoveTreasuryTx,
  createUpdateFeeTx,
  createWithdrawTx,
  getGlobalState,
  getNFTPoolState,
  getUserPoolState,
} from "../lib/scripts";
import { ABB_TOKEN_DECIMAL, ABB_TOKEN_MINT, MARKETPLACE_PROGRAM_ID, SELL_DATA_SEED, USER_DATA_SEED } from "../lib/types";
import { airdropSOL, createTokenMint, getAssociatedTokenAccount, getATokenAccountsNeedCreate, getEscrowBalance, getTokenAccountBalance, isExistAccount } from "../lib/utils";
import { MdsMarketplace } from "../target/types/mds_marketplace";

// Configure the client to use the local cluster.
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const payer = provider.wallet;
console.log('Payer: ', payer.publicKey.toBase58());


const program = anchor.workspace.MDSMarketplace as Program<MDSMarketplace>;

let superOwner = null;
let user = null;
let user1 = null;
let reward = null;
let nft = null;
let rewardVault = null;
let unRegisteredNft = null;

describe("MDS_Marketplace Load Program Object & Prepare testers", () => {
  assert(program.programId.toBase58() == MARKETPLACE_PROGRAM_ID.toBase58(), "Program load Failure!");

  it('Load Testers', async () => {
    const rawdata = fs.readFileSync(process.env.ANCHOR_WALLET);
    const keyData = JSON.parse(rawdata.toString());

    superOwner = anchor.web3.Keypair.fromSecretKey(new Uint8Array(keyData));
    user = anchor.web3.Keypair.generate();
    user1 = anchor.web3.Keypair.generate();

    console.log('Admin: ', superOwner.publicKey.toBase58());
    console.log('User: ', user.publicKey.toBase58());
    console.log('user1: ', user1.publicKey.toBase58());
  });
  it('Load Reward Token', async () => {
    const rawdata = fs.readFileSync('./tests/keys/reward_mint.json');
    const keyData = JSON.parse(rawdata.toString());
    reward = anchor.web3.Keypair.fromSecretKey(new Uint8Array(keyData));
    assert(reward.publicKey.toBase58() == ABB_TOKEN_MINT.toBase58(), 'Load ABB Token Keypair Failure!');

    await createTokenMint(
      provider.connection,
      superOwner,
      reward,
    );

    assert(await isExistAccount(reward.publicKey, provider.connection), 'Create ABB Token mint failure!');
  });
  it('Airdrop SOL for Testers', async () => {
    await airdropSOL(user.publicKey, 1 * 1e9, provider.connection);
    let res = await provider.connection.getBalance(user.publicKey);
    assert(res == 1 * 1e9, 'Airdrop 1 SOL for user Failed');

    await airdropSOL(user1.publicKey, 1000 * 1e9, provider.connection);
    res = await provider.connection.getBalance(user1.publicKey);
    assert(res == 1000 * 1e9, 'Airdrop 1000 SOL for user1 Failed');
  });
});

describe('Contract Creation', async () => {
  it('Contract creator has a role of Admin', async () => {
    const tx = await createInitializeTx(
      superOwner.publicKey,
      program as unknown as anchor.Program,
    );
    const txId = await provider.connection.sendTransaction(tx, [superOwner]);
    await provider.connection.confirmTransaction(txId, 'confirmed');
    console.log("TxHash=", txId);

    let globalInfo = await getGlobalState(program as unknown as anchor.Program);
    assert(globalInfo.superAdmin.toBase58() == superOwner.publicKey.toBase58(), "GlobalInfo Admin Address mismatch with SuperOwner Pubkey");
  });
  it('Admin can change the Marketplace Fee', async () => {
    let globalInfo = await getGlobalState(program as unknown as anchor.Program);
    assert(globalInfo.superAdmin.toBase58() == superOwner.publicKey.toBase58(), "GlobalInfo Admin Address mismatch with SuperOwner Pubkey");

    const tx = await createUpdateFeeTx(
      superOwner.publicKey,
      program as unknown as anchor.Program,
      100,
      12,
    );
    const txId = await provider.connection.sendTransaction(tx, [superOwner]);
    await provider.connection.confirmTransaction(txId, 'confirmed');
    console.log("TxHash=", txId);

    globalInfo = await getGlobalState(program as unknown as anchor.Program);
    assert(globalInfo.marketFeeSol.toNumber() == 100, "Sol Fee is not 10%");
    assert(globalInfo.marketFeeToken.toNumber() == 12, "Token Fee is not 1.2%");
  });
  it('Admin can add himself as team', async () => {
    let globalInfo = await getGlobalState(program as unknown as anchor.Program);
    assert(globalInfo.superAdmin.toBase58() == superOwner.publicKey.toBase58(), "GlobalInfo Admin Address mismatch with SuperOwner Pubkey");

    const tx = await createAddTreasuryTx(
      superOwner.publicKey,
      program as unknown as anchor.Program,
      superOwner.publicKey,
      500,
    );
    const txId = await provider.connection.sendTransaction(tx, [superOwner]);
    await provider.connection.confirmTransaction(txId, 'confirmed');
    console.log("TxHash=", txId);

    globalInfo = await getGlobalState(program as unknown as anchor.Program);
    assert(globalInfo.teamCount.toNumber() == 1, "No team treasury added");
    assert(globalInfo.teamTreasury[0].toBase58() == superOwner.publicKey.toBase58(), "Superowner is team");
    assert(globalInfo.treasuryRate[0].toNumber() == 500, "Superowner is treasury rate is 50%");
  });
  it('Admin can remove himself from team', async () => {
    let globalInfo = await getGlobalState(program as unknown as anchor.Program);
    assert(globalInfo.superAdmin.toBase58() == superOwner.publicKey.toBase58(), "GlobalInfo Admin Address mismatch with SuperOwner Pubkey");
    assert(globalInfo.teamCount.toNumber() == 1, "GlobalInfo Team Treasury Count is not 1");

    const tx = await createRemoveTreasuryTx(
      superOwner.publicKey,
      program as unknown as anchor.Program,
      superOwner.publicKey,
    );
    const txId = await provider.connection.sendTransaction(tx, [superOwner]);
    await provider.connection.confirmTransaction(txId, 'confirmed');
    console.log("TxHash=", txId);

    globalInfo = await getGlobalState(program as unknown as anchor.Program);
    assert(globalInfo.teamCount.toNumber() == 0, "Team treasury is still exist");
  });
  it('Admin can add himself as team', async () => {
    let globalInfo = await getGlobalState(program as unknown as anchor.Program);
    assert(globalInfo.superAdmin.toBase58() == superOwner.publicKey.toBase58(), "GlobalInfo Admin Address mismatch with SuperOwner Pubkey");

    const tx = await createAddTreasuryTx(
      superOwner.publicKey,
      program as unknown as anchor.Program,
      superOwner.publicKey,
      30,
    );
    const txId = await provider.connection.sendTransaction(tx, [superOwner]);
    await provider.connection.confirmTransaction(txId, 'confirmed');
    console.log("TxHash=", txId);

    globalInfo = await getGlobalState(program as unknown as anchor.Program);
    assert(globalInfo.teamCount.toNumber() == 1, "No team treasury added");
    assert(globalInfo.teamTreasury[0].toBase58() == superOwner.publicKey.toBase58(), "Superowner is team");
    assert(globalInfo.treasuryRate[0].toNumber() == 30, "Superowner is treasury rate is 3% finally");
  });
});


describe('NFT Listing / Cancel Listing', async () => {
  it('Create one NFT for testing', async () => {
    nft = await Token.createMint(
      provider.connection,
      superOwner,
      superOwner.publicKey,
      superOwner.publicKey,
      0,
      TOKEN_PROGRAM_ID,
    );
    console.log('NFT Address:', nft.publicKey.toBase58())
    assert(await isExistAccount(nft.publicKey, provider.connection), 'NFT Create Mint Failure');
  });
  it('User can init NFT SellData PDA', async () => {
    const [nftData, _] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), nft.publicKey.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    assert((await isExistAccount(nftData, provider.connection)) != true, 'NFT SellData PDA is Already Initialized');

    const tx = await createInitSellDataTx(
      nft.publicKey,
      user.publicKey,
      program as unknown as anchor.Program,
    );
    const txId = await provider.connection.sendTransaction(tx, [user]);
    await provider.connection.confirmTransaction(txId, 'confirmed');
    console.log("TxHash=", txId);

    let nftInfo = await getNFTPoolState(nft.publicKey, program as unknown as anchor.Program);
    assert(nftInfo.mint.toBase58() == nft.publicKey.toBase58(), "NFT SellData Mint mismatch with NFT Pubkey");
  });
  it('Mint one NFT in my ATA for testing', async () => {
    const userNFTAccount = await nft.createAssociatedTokenAccount(
      user.publicKey,
    );
    console.log('User NFT Account:', userNFTAccount.toBase58())

    await nft.mintTo(
      userNFTAccount,
      superOwner,
      [],
      1,
    );

    assert((await getTokenAccountBalance(userNFTAccount, provider.connection)) == 1, 'Mint 1 NFT to User ATA failure');
  });
  it('User can list NFT for sale', async () => {
    const [nftData, _] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(SELL_DATA_SEED), nft.publicKey.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    assert((await isExistAccount(nftData, provider.connection)) == true, 'NFT SellData PDA is Not Initialized');

    const tx = await createListForSellNftTx(
      nft.publicKey,
      user.publicKey,
      program as unknown as anchor.Program,
      provider.connection,
      1.2 * 1e9,
      150 * ABB_TOKEN_DECIMAL,
    );
    const txId = await provider.connection.sendTransaction(tx, [user]);
    await provider.connection.confirmTransaction(txId, 'confirmed');
    console.log("TxHash=", txId);

    let nftInfo = await getNFTPoolState(nft.publicKey, program as unknown as anchor.Program);
    assert(nftInfo.mint.toBase58() == nft.publicKey.toBase58(), "NFT SellData Mint mismatch with NFT Pubkey");
    assert(nftInfo.priceSol.toNumber() == 1.2 * 1e9, "NFT SellData solPrice is not 1.2");
    assert(nftInfo.priceToken.toNumber() == 150 * ABB_TOKEN_DECIMAL, "NFT SellData TokenPrice is not 150");
    assert(nftInfo.active.toNumber() == 1, "NFT SellData is not actived");
  });
  // it('User can cancel listing', async () => {
  //   const [nftData, _] = await anchor.web3.PublicKey.findProgramAddress(
  //       [Buffer.from(SELL_DATA_SEED), nft.publicKey.toBuffer()],
  //       MARKETPLACE_PROGRAM_ID,
  //   );

  //   assert((await isExistAccount(nftData, provider.connection)) == true, 'NFT SellData PDA is Not Initialized');

  //   let nftInfo = await getNFTPoolState(nft.publicKey, program as unknown as anchor.Program);
  //   assert(nftInfo.mint.toBase58() == nft.publicKey.toBase58(), "NFT SellData Mint mismatch with NFT Pubkey");
  //   assert(nftInfo.seller.toBase58() == user.publicKey.toBase58(), "NFT Seller is not User Pubkey");
  //   assert(nftInfo.active.toNumber() == 1, "NFT SellData is not actived");

  //   const tx = await createDelistNftTx(
  //     nft.publicKey,
  //     user.publicKey,
  //     program as unknown as anchor.Program,
  //     provider.connection,
  //   );
  //   const txId = await provider.connection.sendTransaction(tx, [user]);
  //   await provider.connection.confirmTransaction(txId, 'confirmed');
  //   console.log("TxHash=", txId);

  //   nftInfo = await getNFTPoolState(nft.publicKey, program as unknown as anchor.Program);
  //   assert(nftInfo.mint.toBase58() == nft.publicKey.toBase58(), "NFT SellData Mint mismatch with NFT Pubkey");
  //   assert(nftInfo.active.toNumber() == 0, "NFT SellData is still actived");
  // });
});

describe('user1 Can Purchase NFT', async () => {
  it('Mint Enough ABB TOken in user1 ATA for staking', async () => {
    const rewardToken = new Token(
      provider.connection,
      ABB_TOKEN_MINT,
      TOKEN_PROGRAM_ID,
      superOwner,
    )
    let {instructions, destinationAccounts} = await getATokenAccountsNeedCreate(
      provider.connection,
      user1.publicKey,
      user1.publicKey,
      [ABB_TOKEN_MINT],
    );
    let user1ATA = destinationAccounts[0];
    console.log('user1ATA: ', user1ATA.toBase58());

    if (instructions.length > 0) {
      const tx = new anchor.web3.Transaction();
      tx.add(instructions[0]);
      const txId = await anchor.web3.sendAndConfirmTransaction(
        provider.connection,
        tx,
        [user1],
      );
      console.log("Tx Hash=", txId);
    }

    assert((await isExistAccount(user1ATA, provider.connection)), 'Create ABB ATA of my wallet failure!');

    await rewardToken.mintTo(user1ATA, superOwner, [], 100_000 * ABB_TOKEN_DECIMAL);
    assert((await getTokenAccountBalance(user1ATA, provider.connection)) == 100_000, 'Testing ABB Token amount is not 100_000');
  });
  it('User1 can init own UserPool PDA', async () => {
    const [userPool, _] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from(USER_DATA_SEED), user1.publicKey.toBuffer()],
        MARKETPLACE_PROGRAM_ID,
    );

    assert((await isExistAccount(userPool, provider.connection)) != true, 'UserPool PDA is Already Initialized');

    const tx = await createInitUserTx(
      user1.publicKey,
      program as unknown as anchor.Program,
    );
    const txId = await provider.connection.sendTransaction(tx, [user1]);
    await provider.connection.confirmTransaction(txId, 'confirmed');
    console.log("TxHash=", txId);

    let userInfo = await getUserPoolState(user1.publicKey, program as unknown as anchor.Program);
    assert(userInfo.address.toBase58() == user1.publicKey.toBase58(), "UserData Address mismatch with User1 Pubkey");
  });
  it('user1 can purchase NFT from user with ABB Token payment', async () => {
    let nftInfo = await getNFTPoolState(nft.publicKey, program as unknown as anchor.Program);
    assert(nftInfo.mint.toBase58() == nft.publicKey.toBase58(), "NFT SellData Mint mismatch with NFT Pubkey");
    assert(nftInfo.priceSol.toNumber() == 1.2 * 1e9, "NFT SellData solPrice is not 1.2");
    assert(nftInfo.priceToken.toNumber() == 150 * ABB_TOKEN_DECIMAL, "NFT SellData TokenPrice is not 150");
    assert(nftInfo.active.toNumber() == 1, "NFT SellData is not actived");
    assert(nftInfo.seller.toBase58() == user.publicKey.toBase58(), "NFT Seller is not user Pubkey");

    const tx = await createPurchaseTx(
      nft.publicKey,
      user1.publicKey,
      true,
      program as unknown as anchor.Program,
      provider.connection,
    );
    const txId = await provider.connection.sendTransaction(tx, [user1]);
    await provider.connection.confirmTransaction(txId, 'confirmed');
    console.log("TxHash=", txId);

    const user1ATA = await getAssociatedTokenAccount(user1.publicKey, nft.publicKey);
    assert((await getTokenAccountBalance(user1ATA, provider.connection)) == 1, 'Buyer NFT Account balance is zero');
    const userATA = await getAssociatedTokenAccount(user.publicKey, ABB_TOKEN_MINT);
    assert((await getTokenAccountBalance(userATA, provider.connection)) == nftInfo.priceToken.toNumber() / ABB_TOKEN_DECIMAL, 'Seller ABB Account balance is not same with TokenPrice');
    let userInfo = await getUserPoolState(user1.publicKey, program as unknown as anchor.Program);
    assert(userInfo.address.toBase58() == user1.publicKey.toBase58(), "UserData Address mismatch with User1 Pubkey");
    assert(userInfo.tradedTokenVolume.toNumber() == nftInfo.priceToken.toNumber(), "UserData TradeVolume is not priceToken");
  });
});

describe('Deposit / Withdraw Escrow Balance', async () => {
  it('User1 can deposit sol', async () => {    
    const tx = await createDepositTx(
      user1.publicKey,
      1.2 * 1e9,
      0,
      program as unknown as anchor.Program,
      provider.connection,
    );
    const txId = await provider.connection.sendTransaction(tx, [user1]);
    await provider.connection.confirmTransaction(txId, 'confirmed');
    console.log("TxHash=", txId);

    let userInfo = await getUserPoolState(user1.publicKey, program as unknown as anchor.Program);
    assert(userInfo.address.toBase58() == user1.publicKey.toBase58(), "UserData Address mismatch with User1 Pubkey");
    assert(userInfo.escrowSolBalance.toNumber() == 1.2 * 1e9, "UserData Sol Balance is not 1.2");

    const escrowBalance = await getEscrowBalance(provider.connection);
    assert(escrowBalance.sol == 1.2 * 1e9, 'Escrow Sol Balance is not 1.2');
    assert(escrowBalance.token == 0, 'Escrow ABB Token balance is not 0');
  });
  it('User1 can deposit token', async () => {    
    const tx = await createDepositTx(
      user1.publicKey,
      0,
      1.3 * ABB_TOKEN_DECIMAL,
      program as unknown as anchor.Program,
      provider.connection,
    );
    const txId = await provider.connection.sendTransaction(tx, [user1]);
    await provider.connection.confirmTransaction(txId, 'confirmed');
    console.log("TxHash=", txId);

    let userInfo = await getUserPoolState(user1.publicKey, program as unknown as anchor.Program);
    assert(userInfo.address.toBase58() == user1.publicKey.toBase58(), "UserData Address mismatch with User1 Pubkey");
    assert(userInfo.escrowTokenBalance.toNumber() == 1.3 * ABB_TOKEN_DECIMAL, "UserData Token Balance is not 1.3");

    const escrowBalance = await getEscrowBalance(provider.connection);
    assert(escrowBalance.sol == 1.2 * 1e9, 'Escrow Sol Balance is not 1.2');
    assert(escrowBalance.token == 1.3 * ABB_TOKEN_DECIMAL, 'Escrow ABB Token balance is not 1.3');
  });
  it('User1 can withdraw token', async () => {    
    const tx = await createWithdrawTx(
      user1.publicKey,
      0,
      0.2 * ABB_TOKEN_DECIMAL,
      program as unknown as anchor.Program,
      provider.connection,
    );
    const txId = await provider.connection.sendTransaction(tx, [user1]);
    await provider.connection.confirmTransaction(txId, 'confirmed');
    console.log("TxHash=", txId);

    let userInfo = await getUserPoolState(user1.publicKey, program as unknown as anchor.Program);
    assert(userInfo.address.toBase58() == user1.publicKey.toBase58(), "UserData Address mismatch with User1 Pubkey");
    assert(userInfo.escrowTokenBalance.toNumber() == 1.1 * ABB_TOKEN_DECIMAL, "UserData Token Balance is not 1.3");

    const escrowBalance = await getEscrowBalance(provider.connection);
    assert(escrowBalance.sol == 1.2 * 1e9, 'Escrow Sol Balance is not 1.2');
    assert(escrowBalance.token == 1.1 * ABB_TOKEN_DECIMAL, 'Escrow ABB Token balance is not 1.1');
  });
  it('User1 can withdraw sol', async () => {    
    const tx = await createWithdrawTx(
      user1.publicKey,
      0.3 * 1e9,
      0,
      program as unknown as anchor.Program,
      provider.connection,
    );
    const txId = await provider.connection.sendTransaction(tx, [user1]);
    await provider.connection.confirmTransaction(txId, 'confirmed');
    console.log("TxHash=", txId);

    let userInfo = await getUserPoolState(user1.publicKey, program as unknown as anchor.Program);
    assert(userInfo.address.toBase58() == user1.publicKey.toBase58(), "UserData Address mismatch with User1 Pubkey");
    assert(userInfo.escrowSolBalance.toNumber() == 0.9 * 1e9, "UserData Sol Balance is not 0.9");

    const escrowBalance = await getEscrowBalance(provider.connection);
    assert(escrowBalance.sol == 0.9 * 1e9, 'Escrow Sol Balance is not 0.9');
    assert(escrowBalance.token == 1.1 * ABB_TOKEN_DECIMAL, 'Escrow ABB Token balance is not 1.1');
  });
});