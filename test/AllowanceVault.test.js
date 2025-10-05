const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AllowanceVault", function () {
  let vaultFactory, vault;
  let owner, alice, bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    vaultFactory = await ethers.getContractFactory("AllowanceVault");
    vault = await vaultFactory.connect(owner).deploy();

    // compatibility: ethers v6 uses waitForDeployment()
    if (typeof vault.waitForDeployment === "function") {
      await vault.waitForDeployment();
    } else if (typeof vault.deployed === "function") {
      await vault.deployed();
    }
  });

  it("happy path: owner funds, sets allowance, beneficiary withdraws", async function () {
    // owner funds vault with 3 ETH
    const fundAmount = ethers.parseEther ? ethers.parseEther("3.0") : ethers.utils.parseEther("3.0");
    await owner.sendTransaction({ to: vault.target ? vault.target : vault.address, value: fundAmount });

    // event: Deposited
    // depending on ethers version, use tx receipt event check via expect
    // set allowance to 1 ETH for alice
    const allowanceAmount = fundAmount / 3n; // 1 ETH
    await expect(vault.connect(owner).setAllowance(alice.address, allowanceAmount))
      .to.emit(vault, "AllowanceSet")
      .withArgs(alice.address, allowanceAmount);

    // alice withdraws 1 ETH
    const withdrawAmount = allowanceAmount;
    const aliceBalanceBefore = await ethers.provider.getBalance(alice.address);
    const tx = await vault.connect(alice).withdraw(withdrawAmount);
    const receipt = await tx.wait();

    // event emitted
    await expect(tx).to.emit(vault, "Withdrawn").withArgs(alice.address, withdrawAmount);

    // check balances: vault decreased
    const vaultBal = await vault.getBalance();
    expect(vaultBal).to.equal(fundAmount - withdrawAmount);
  });

  it("negative: withdraw more than allowance reverts with custom error", async function () {
    // owner funds vault
    const fund = ethers.parseEther ? ethers.parseEther("1.0") : ethers.utils.parseEther("1.0");
    await owner.sendTransaction({ to: vault.target ? vault.target : vault.address, value: fund });

    // owner sets allowance to 0.33 ETH for bob
    const allowed = fund / 3n;
    await vault.connect(owner).setAllowance(bob.address, allowed);

    // bob tries to withdraw 0.5 ETH (more than allowed)
    const additionalAmount = ethers.parseEther ? ethers.parseEther("0.2") : ethers.utils.parseEther("0.2");
    const over = allowed + additionalAmount;

    await expect(vault.connect(bob).withdraw(over))
      .to.be.revertedWithCustomError(vault, "InsufficientAllowance")
      .withArgs(allowed, over);
  });

  it("negative: non-beneficiary (allowance 0) cannot withdraw", async function () {
    // fund contract
    const fund = ethers.parseEther ? ethers.parseEther("1.0") : ethers.utils.parseEther("1.0");
    await owner.sendTransaction({ to: vault.target ? vault.target : vault.address, value: fund });

    // carol has no allowance (we'll use alice as non-beneficiary)
    await expect(vault.connect(alice).withdraw(1))
      .to.be.revertedWithCustomError(vault, "InsufficientAllowance");
  });

  it("negative: withdraw fails if vault has no funds", async function () {
    // ensure vault has zero balance (fresh deploy)
    // owner sets allowance for bob to 1 ETH
    const one = ethers.parseEther ? ethers.parseEther("1.0") : ethers.utils.parseEther("1.0");
    await vault.connect(owner).setAllowance(bob.address, one);

    // bob tries to withdraw but vault has 0 balance
    await expect(vault.connect(bob).withdraw(one))
      .to.be.revertedWithCustomError(vault, "NoFunds");
  });

  it("only owner can set allowance", async function () {
    await expect(vault.connect(alice).setAllowance(bob.address, 1))
      .to.be.revertedWith("Owned: caller is not the owner");
  });
});
