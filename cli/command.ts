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
} from "./scripts";

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

programCommand('list')
  .option('-a, --address <string>', 'nft mint pubkey')
  .option('-p, --price <number>', 'sell price')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .action(async (directory, cmd) => {
    const {
      env,
      address,
      price,
    } = cmd.opts();

    console.log('Solana config: ', env);
    await setClusterConfig(env);

    if (address === undefined) {
      console.log("Error Mint input");
      return;
    }
    if (price === undefined || isNaN(parseFloat(price))) {
      console.log("Error Price input");
      return;
    }
    
    await listNftForSale(new PublicKey(address), parseFloat(price) * LAMPORTS_PER_SOL);
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
