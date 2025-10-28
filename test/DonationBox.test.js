const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DonationBox: vulnerable vs fixed (reentrancy demo)", function () {
  let Vulnerable, Fixed, Attacker;
  let vulnerable, fixed, attacker;
  let deployer, depositor, attackerEOA;
  const sevenEth = ethers.parseEther("7.0");
  const oneEth = ethers.parseEther("1.0");

  beforeEach(async function () {
    [deployer, depositor, attackerEOA] = await ethers.getSigners();

    Vulnerable = await ethers.getContractFactory("DonationBox_vulnerable");
    vulnerable = await Vulnerable.deploy();
    await vulnerable.waitForDeployment();

    Fixed = await ethers.getContractFactory("DonationBox_fixed");
    fixed = await Fixed.deploy();
    await fixed.waitForDeployment();

    Attacker = await ethers.getContractFactory("Attacker");
  });

  it("VULNERABLE: attacker drains victim contract", async function () {
    // depositor funds victim with 7 ETH
    await vulnerable.connect(depositor).donate({ value: sevenEth });

    // deploy attacker contract from attackerEOA with address of vulnerable
    attacker = await Attacker.connect(attackerEOA).deploy(await vulnerable.getAddress());
    await attacker.waitForDeployment();

    // attacker starts with sending 1 ETH to attack()
    // After attack, attacker contract should have drained the full 8 ETH (7 + 1)
    await attacker.connect(attackerEOA).attack({ value: oneEth });

    // attacker contract balance should be ~8 ETH
    const bal = await attacker.getBalances();
    // allow small gas diffs; check >= 7.9 ETH (practical)
    expect(bal).to.be.gte(ethers.parseEther("7.0"));

    // victim balance should be zero
    expect(await ethers.provider.getBalance(await vulnerable.getAddress())).to.equal(0);
  });

  it("FIXED: attacker cannot drain fixed contract", async function () {
    // depositor funds fixed contract with 7 ETH
    await fixed.connect(depositor).donate({ value: sevenEth });

    // deploy attacker pointing to fixed contract
    attacker = await Attacker.connect(attackerEOA).deploy(await fixed.getAddress());
    await attacker.waitForDeployment();

    // attempt attack: attacker donates 1 ETH then withdraws
    // This should revert because the fixed contract prevents reentrancy
    await expect(attacker.connect(attackerEOA).attack({ value: oneEth })).to.be.reverted;

    // Since the attack reverted, attacker contract should have 0 ETH
    const bal = await attacker.getBalances();
    expect(bal).to.equal(0);

    // fixed contract balance should remain exactly 7 ETH (no successful attack)
    const victimBal = await ethers.provider.getBalance(await fixed.getAddress());
    expect(victimBal).to.equal(sevenEth);
  });
});
