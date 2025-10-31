const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DonationBox_fixed — Hardhat tests", function () {
  let DonationBox, Attacker, db, attacker;
  let deployer, alice, bob, evil, other;

  beforeEach(async function () {
    [deployer, alice, bob, evil, other] = await ethers.getSigners();

    DonationBox = await ethers.getContractFactory("DonationBox_fixed", deployer);
    db = await DonationBox.deploy();
    await db.waitForDeployment();

    Attacker = await ethers.getContractFactory("Attacker", evil);
    // fund test signers with ETH if needed (Hardhat accounts already funded)
  });

  it("deposit & withdraw works normally", async function () {
    // Alice deposits 1 ETH
    await db.connect(alice).deposit({ value: ethers.parseEther("1.0") });
    expect(await db.balances(alice.address)).to.equal(ethers.parseEther("1.0"));
    expect(await db.totalBalances()).to.equal(ethers.parseEther("1.0"));
    // Alice withdraws
    await db.connect(alice).withdraw();
    expect(await db.balances(alice.address)).to.equal(0);
    expect(await db.totalBalances()).to.equal(0);
    // contract balance equals totalBalances
    const cBal = await ethers.provider.getBalance(await db.getAddress());
    expect(cBal).to.equal(await db.totalBalances());
  });

  it("attack attempt fails to drain contract", async function () {
    // Setup: Bob deposits 2 ETH (credited)
    await db.connect(bob).deposit({ value: ethers.parseEther("2.0") });

    // Deployer makes an uncredited donation of 1 ETH (direct send)
    await deployer.sendTransaction({ to: await db.getAddress(), value: ethers.parseEther("1.0") });

    // Attacker deploys
    attacker = await Attacker.connect(evil).deploy(await db.getAddress());
    await attacker.waitForDeployment();

    // Attacker deposits 0.1 ETH via attacker.attack()
    await attacker.connect(evil).attack({ value: ethers.parseEther("0.1") });

    // After attack:
    // - attacker should only be able to withdraw their 0.1 ETH (no extra)
    // - contract balance should equal totalBalances + uncredited donations
    const contractBal = await ethers.provider.getBalance(await db.getAddress());
    const totalBalances = await db.totalBalances();

    // Contract balance = totalBalances + 1 ETH uncredited donation
    expect(contractBal).to.equal(totalBalances + ethers.parseEther("1.0"));

    // totalBalances should be bob's 2.0 ETH (attacker's 0.1 was credited then withdrawn)
    // But because attacker withdrew their 0.1, totalBalances = 2 ETH (bob)
    expect(totalBalances).to.equal(ethers.parseEther("2.0"));

    // Ensure attacker contract didn't end up with huge funds
    const attackerBal = await ethers.provider.getBalance(await attacker.getAddress());
    // attacker may have 0 if they forwarded funds; just assert it's <= 0.1 ETH
    expect(attackerBal <= ethers.parseEther("0.1")).to.be.true;
  });

  it("simple fuzz-like test: random small deposits and withdraws", async function () {
    // perform 50 random operations between alice & bob
    for (let i = 0; i < 50; i++) {
      const who = Math.random() < 0.5 ? alice : bob;
      const doDeposit = Math.random() < 0.7; // more deposits than withdraws
      const amtEth = (Math.random() * 0.3).toFixed(6); // up to 0.3 ETH
      const amt = ethers.parseEther(amtEth.toString());

      if (doDeposit && amt > 0n) {
        await db.connect(who).deposit({ value: amt });
      } else {
        // try withdraw (may revert if no balance) — ignore revert
        try {
          await db.connect(who).withdraw();
        } catch (e) {
          // ignore
        }
      }

      // quick invariant check after each operation
      const cBal = await ethers.provider.getBalance(await db.getAddress());
      const totalBalances = await db.totalBalances();
      expect(cBal).to.equal(totalBalances);
    }
  });

  it("invariant test: random sequences keep contractBalance == totalBalances + uncreditedDonations", async function () {
    // We'll run a longer random sequence of operations across multiple actors
    const actors = [deployer, alice, bob, other];
    // Start with some known state: fund contract with 1 ETH (uncredited)
    await deployer.sendTransaction({ to: await db.getAddress(), value: ethers.parseEther("1.0") });
    let uncreditedDonations = ethers.parseEther("1.0");

    // Run 200 random steps
    for (let i = 0; i < 200; i++) {
      const actor = actors[Math.floor(Math.random() * actors.length)];
      const opRand = Math.random();
      const amtEth = (Math.random() * 0.5).toFixed(6); // up to 0.5 ETH
      const amt = ethers.parseEther(amtEth.toString());

      if (opRand < 0.5) {
        // deposit credited
        await db.connect(actor).deposit({ value: amt });
      } else if (opRand < 0.8) {
        // withdraw (may revert, ignore)
        try {
          await db.connect(actor).withdraw();
        } catch (e) {}
      } else {
        // direct donation (uncredited)
        await actor.sendTransaction({ to: await db.getAddress(), value: amt });
        uncreditedDonations += amt;
      }

      // Invariant assert after every step
      const cBal = await ethers.provider.getBalance(await db.getAddress());
      const totalBalances = await db.totalBalances();
      expect(cBal).to.equal(totalBalances + uncreditedDonations);
    }
  });
});
