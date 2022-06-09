import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { MdsMarketplace } from "../target/types/mds_marketplace";

describe("Mds_Marketplace", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.MdsMarketplace as Program<MdsMarketplace>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
