use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::*;

#[account]
#[derive(Default)]
pub struct GlobalPool {
    // 8 + 32
    pub super_admin: Pubkey,      // 32
}

#[account]
#[derive(Default)]
pub struct SellData {
    // 8 + 112
    pub mint: Pubkey,           // 32
    pub seller: Pubkey,         // 32
    pub collection: Pubkey,     // 32
    pub price: u64,             // 8
    pub active: u64,            // 8
}

// #[zero_copy]
// #[derive(Default, PartialEq)]
// pub struct StakedData {
//     pub mint: Pubkey,      // 32
//     pub staked_time: i64,  // 8
// }

// #[account(zero_copy)]
// pub struct UserPool {
//     // 8 + 4048
//     pub owner: Pubkey,                                 // 32
//     pub last_reward_time: i64,                         // 8
//     pub staked_count: u64,                             // 8
//     // pub staked_mints: [StakedData; STAKE_MAX_COUNT],   // 40 * 100
// }

// impl Default for UserPool {
//     #[inline]
//     fn default() -> UserPool {
//         UserPool {
//             owner: Pubkey::default(),
//             last_reward_time: 0,
//             staked_count: 0,
//             // staked_mints: [
//             //     StakedData {
//             //         ..Default::default()
//             //     }; STAKE_MAX_COUNT
//             // ],
//         }
//     }
// }

// impl UserPool {
//     pub fn add_nft(
//         &mut self,
//         nft_pubkey: Pubkey,
//         now: i64,
//     ) {
//         let idx = self.staked_count as usize;
//         // self.staked_mints[idx].mint = nft_pubkey;
//         // self.staked_mints[idx].staked_time = now;
//         self.staked_count += 1;
//     }
// }