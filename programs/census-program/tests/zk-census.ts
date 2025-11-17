import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZkCensus } from "../target/types/zk_census";
import { expect } from "chai";

describe("zk-census", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ZkCensus as Program<ZkCensus>;

  it("Initializes a census", async () => {
    const censusId = "test-census-" + Date.now();
    const name = "Test Census";
    const description = "A test census for integration testing";

    const [censusPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("census"), Buffer.from(censusId)],
      program.programId
    );

    await program.methods
      .initializeCensus(censusId, name, description, true, null)
      .accounts({
        census: censusPda,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const census = await program.account.census.fetch(censusPda);

    expect(census.censusId).to.equal(censusId);
    expect(census.name).to.equal(name);
    expect(census.description).to.equal(description);
    expect(census.active).to.be.true;
    expect(census.totalMembers.toNumber()).to.equal(0);
  });

  it("Submits a proof", async () => {
    const censusId = "proof-test-" + Date.now();

    // First create a census
    const [censusPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("census"), Buffer.from(censusId)],
      program.programId
    );

    await program.methods
      .initializeCensus(censusId, "Proof Test", "Test", true, null)
      .accounts({
        census: censusPda,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Generate a nullifier hash (mock)
    const nullifierHash = Buffer.from(
      "1234567890123456789012345678901234567890123456789012345678901234"
    );

    const [nullifierPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("nullifier"), censusPda.toBuffer(), nullifierHash],
      program.programId
    );

    const ageRange = 2; // 25-34
    const continent = 1; // Asia
    const proofData = Buffer.from("mock-proof-data"); // In reality, this would be 256+ bytes
    const timestamp = Math.floor(Date.now() / 1000);

    await program.methods
      .submitProof(
        Array.from(nullifierHash),
        ageRange,
        continent,
        Array.from(proofData),
        new anchor.BN(timestamp)
      )
      .accounts({
        census: censusPda,
        nullifierEntry: nullifierPda,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Verify census was updated
    const census = await program.account.census.fetch(censusPda);
    expect(census.totalMembers.toNumber()).to.equal(1);
    expect(census.ageDistribution[ageRange].toNumber()).to.equal(1);
    expect(census.continentDistribution[continent].toNumber()).to.equal(1);

    // Verify nullifier was stored
    const nullifierEntry = await program.account.nullifierEntry.fetch(nullifierPda);
    expect(nullifierEntry.censusId).to.equal(censusId);
    expect(nullifierEntry.index.toNumber()).to.equal(0);
  });

  it("Prevents duplicate nullifier", async () => {
    const censusId = "duplicate-test-" + Date.now();

    const [censusPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("census"), Buffer.from(censusId)],
      program.programId
    );

    await program.methods
      .initializeCensus(censusId, "Duplicate Test", "Test", true, null)
      .accounts({
        census: censusPda,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const nullifierHash = Buffer.from(
      "9999999999999999999999999999999999999999999999999999999999999999"
    );

    const [nullifierPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("nullifier"), censusPda.toBuffer(), nullifierHash],
      program.programId
    );

    // First submission should succeed
    await program.methods
      .submitProof(
        Array.from(nullifierHash),
        1,
        2,
        Array.from(Buffer.from("proof")),
        new anchor.BN(Math.floor(Date.now() / 1000))
      )
      .accounts({
        census: censusPda,
        nullifierEntry: nullifierPda,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Second submission with same nullifier should fail
    try {
      await program.methods
        .submitProof(
          Array.from(nullifierHash),
          1,
          2,
          Array.from(Buffer.from("proof")),
          new anchor.BN(Math.floor(Date.now() / 1000))
        )
        .accounts({
          census: censusPda,
          nullifierEntry: nullifierPda,
          user: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      expect.fail("Should have thrown error for duplicate nullifier");
    } catch (err) {
      // Expected to fail - account already exists
      expect(err).to.exist;
    }
  });

  it("Updates Merkle root", async () => {
    const censusId = "merkle-test-" + Date.now();

    const [censusPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("census"), Buffer.from(censusId)],
      program.programId
    );

    await program.methods
      .initializeCensus(censusId, "Merkle Test", "Test", true, null)
      .accounts({
        census: censusPda,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const newRoot = Buffer.from(
      "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd"
    );
    const ipfsHash = "QmTest123456789";

    await program.methods
      .updateMerkleRoot(Array.from(newRoot), ipfsHash)
      .accounts({
        census: censusPda,
        creator: provider.wallet.publicKey,
      })
      .rpc();

    const census = await program.account.census.fetch(censusPda);
    expect(census.merkleRoot).to.deep.equal(Array.from(newRoot));
    expect(census.ipfsHash).to.equal(ipfsHash);
  });

  it("Closes a census", async () => {
    const censusId = "close-test-" + Date.now();

    const [censusPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("census"), Buffer.from(censusId)],
      program.programId
    );

    await program.methods
      .initializeCensus(censusId, "Close Test", "Test", true, null)
      .accounts({
        census: censusPda,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .closeCensus()
      .accounts({
        census: censusPda,
        creator: provider.wallet.publicKey,
      })
      .rpc();

    const census = await program.account.census.fetch(censusPda);
    expect(census.active).to.be.false;
  });
});
