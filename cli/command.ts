#!/usr/bin/env ts-node
import * as dotenv from "dotenv";
import { program } from 'commander';
import { 
    PublicKey,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  initProject,
  getGlobalInfo,
  setClusterConfig,
  getNFTPoolInfo,
  listNftForSale,
  delistNft,
  getAllNFTs,
  purchase,
  getUserPoolInfo,
  depositEscrow,
  withdrawEscrow,
} from "./scripts";
import { ABB_TOKEN_DECIMAL } from "../lib/types";

dotenv.config({ path: __dirname+'/../.env' });

program.version('0.0.1');

programCommand('status')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
    } = cmd.opts();
    console.log('Solana config: ', env);
    await setClusterConfig(env);
    console.log(await getGlobalInfo());
});

programCommand('user_status')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .option('-a, --address <string>', 'nft user pubkey')
  .action(async (directory, cmd) => {
    const {
      env,
      address,
    } = cmd.opts();
    console.log('Solana config: ', env);
    await setClusterConfig(env);
    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    console.log(await getUserPoolInfo(new PublicKey(address)));
});

programCommand('deposit')
  .option('-s, --sol <number>', 'deposit sol amount')
  .option('-t, --token <number>', 'deposit token amount')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      sol,
      token,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (sol === undefined || isNaN(parseFloat(sol))) {
      console.log("Error Sol Amount input");
      return;
    }
    if (token === undefined || isNaN(parseFloat(token))) {
      console.log("Error Token Amount input");
      return;
    }

    await depositEscrow(parseFloat(sol) * LAMPORTS_PER_SOL, parseFloat(token) * ABB_TOKEN_DECIMAL);
});

programCommand('withdraw')
  .option('-s, --sol <number>', 'withdraw sol amount')
  .option('-t, --token <number>', 'withdraw token amount')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      sol,
      token,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (sol === undefined || isNaN(parseFloat(sol))) {
      console.log("Error Sol Amount input");
      return;
    }
    if (token === undefined || isNaN(parseFloat(token))) {
      console.log("Error Token Amount input");
      return;
    }

    await withdrawEscrow(parseFloat(sol) * LAMPORTS_PER_SOL, parseFloat(token) * ABB_TOKEN_DECIMAL);
});

programCommand('list')
  .option('-a, --address <string>', 'nft mint pubkey')
  .option('-p, --price_sol <number>', 'sell sol price')
  .option('-t, --price_token <number>', 'sell token price')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
      price_sol,
      price_token,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    if (price_sol === undefined || isNaN(parseFloat(price_sol))) {
      console.log("Error Sol Price input");
      return;
    }
    if (price_token === undefined || isNaN(parseFloat(price_token))) {
      console.log("Error Token Price input");
      return;
    }
    
    await listNftForSale(new PublicKey(address), parseFloat(price_sol) * LAMPORTS_PER_SOL, parseFloat(price_token) * ABB_TOKEN_DECIMAL);
});

programCommand('delist')
  .option('-a, --address <string>', 'nft mint pubkey')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    
    await delistNft(new PublicKey(address));
});

programCommand('purchase')
  .option('-a, --address <string>', 'nft mint pubkey')
  .option('-t, --by_token <number>', 'purchase nft By ABB token')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
      by_token,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    if (by_token === undefined || isNaN(parseInt(by_token))) {
      console.log("Error By Token input");
      return;
    }

    await purchase(new PublicKey(address), parseInt(by_token) == 1);
});

programCommand('listed_nft_data')
  .option('-a, --address <string>', 'nft mint pubkey')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error input");
      return;
    }
    console.log(await getNFTPoolInfo(new PublicKey(address)));
});

programCommand('get_all_listed_nfts')
  .option('-r, --rpc <string>', 'custom rpc url')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      rpc,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    console.log(await getAllNFTs(rpc));
});

programCommand('init')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
    } = cmd.opts();
    console.log('Solana config: ', env);
    await setClusterConfig(env);

    await initProject();
});

function programCommand(name: string) {
  return program
    .command(name)
    .option(
      '-e, --env <string>',
      'Solana cluster env name',
      'devnet', //mainnet-beta, testnet, devnet
    )
}

program.parse(process.argv);
