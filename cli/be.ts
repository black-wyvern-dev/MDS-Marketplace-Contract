import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Program, web3 } from '@project-serum/anchor';
import {
    PublicKey,
    Connection,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
} from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet';
import { decode } from '@project-serum/anchor/dist/cjs/utils/bytes/base64';

anchor.setProvider(anchor.AnchorProvider.local(web3.clusterApiUrl("devnet")));
const solConnection = anchor.getProvider().connection;
const payer = anchor.AnchorProvider.local().wallet;
var nonce = [
    'AsUkG8p1',
    '2ckYj9m2',
    'HY2XrSxn',
    'AJbPzu2U',
    '8YqEZQWE',
    'UJJfJRLD',
    '3CtceMPi',
    '2BWUiNsL',
    '2SaBBC7P',
    'VcryEr2T',
    '4G2WiD2C',
    '3h9PDpsK',
    '6Ahuf6jr',
    '2nDMvBoX',
    'ZkCkv1Hg',
    'PcLYN6YP',
    '4uY3yEhz',
    '9mtdhZPt',
    '882wV271',
    'AtH7do4b']

const main = async () => {

    const data = await solConnection.getSignaturesForAddress(new PublicKey("C29hER4SXQr3atHsuCrRmLAkXBpxvfLMCNeXg2TRTd9o"), {"limit": 10}, "confirmed");
    data.map( async (datum) => {
        // console.log(datum.signature);
        const dd = await solConnection.getTransaction(datum.signature,  {"commitment": "confirmed"});
        let length = dd.transaction.message.instructions.length;
        console.log(length, "=============>")
        let valid = -1;
        for (let i = 0; i < length; i ++) {
            for (let j = 0; j<nonce.length; j ++) {
                let hash = dd.transaction.message.instructions[i].data.slice(0, 8);
                if (hash == nonce[j]) {
                    valid = j;
                    break;
                }
            }
            if (valid > -1) break;
        }
        if (valid > -1) {
            console.log(dd.transaction.message.accountKeys[0].toBase58(), "Signer++++++++++>");
        }
       
        
    })
    // 44GoMVetnJTUJUYzbVbydKVU2f6UoK73Hhew7WW76xBRuyqJZwRXNcCt2dmPhnvjPjZmAsVCLoQDTDuKjQoYFZq3

    const dd = await solConnection.getTransaction('5JUKdSyZBVtiFxapy54dLoUda1muBeLhQNQcMXTrfU3CmrChmvAFbGxoxZW3s8vmpDzm18fCHBn6gmAyStUDw7Dh',  {"commitment": "confirmed"});
    let length = dd.transaction.message.instructions.length;
    console.log(length, "=============>")
    let valid = -1;
    for (let i = 0; i < length; i ++) {
        for (let j = 0; j<nonce.length; j ++) {
            let hash = dd.transaction.message.instructions[i].data.slice(0, 8);
            if (hash == nonce[j]) {
                valid = j;
                break;
            }
        }
        if (valid > -1) break;
    }
    if (valid > -1) {
    }
    console.log(dd.meta.preTokenBalances);
    

};

main()
