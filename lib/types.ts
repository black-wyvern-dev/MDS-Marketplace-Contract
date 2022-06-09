import * as anchor from '@project-serum/anchor';
import {PublicKey} from '@solana/web3.js';

export const GLOBAL_AUTHORITY_SEED = "global-authority-v1";
export const SELL_DATA_SEED = "sell-info-v1";

export const MARKETPLACE_PROGRAM_ID = new PublicKey("5bw4QGFgrxigxxP5m3S7v7fZoF9a1F2QAMnxjhMjZKfR");

export interface GlobalPool {
    superAdmin: PublicKey,         // 32
}

export interface SellData {
    // 8 + 112
    mint: PublicKey,            // 32
    seller: PublicKey,          // 32
    collection: PublicKey,      // 32
    price: anchor.BN,           // 8
    active: anchor.BN,          // 8
}
