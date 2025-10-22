const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TimeLockedVault", function () {
  let Vault, vault, owner, addr1;
  let unlockTime;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    unlockTime = Math.floor(Date.now() / 1000) + 60; // 1 minute in future

    Vault = await ethers.getContractFactory("TimeLockedVault");
    vault = await Vault.deploy(unlockTime);
    await vault.waitForDeployment();
  });

  it("Should accept deposits", async function () {
    await vault.connect(addr1).deposit({ value: ethers.parseEther("1") });
    const balance = await vault.getBalance();
    expect(balance).to.equal(ethers.parseEther("1"));
  });

  it("Should prevent early withdrawal", async function () {
    await vault.connect(addr1).deposit({ value: ethers.parseEther("1") });
    await expect(vault.withdraw()).to.be.revertedWith("Vault is still locked");
  });

  it("Should allow withdrawal after unlockTime", async function () {
    await vault.connect(addr1).deposit({ value: ethers.parseEther("1") });
    
    // Increase time in Hardhat
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine");

    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

    const tx = await vault.withdraw();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + ethers.parseEther("1") - gasUsed);
  });
});
