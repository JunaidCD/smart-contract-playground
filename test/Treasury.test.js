const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Treasury", function () {
  let treasury, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("Treasury");
    treasury = await Factory.deploy();
    await treasury.waitForDeployment();
  });

  it("accepts plain ETH and emits Deposit via receive()", async function () {
    const amount = ethers.parseEther("0.5");
    const tx = await owner.sendTransaction({ to: treasury.target, value: amount });
    await expect(tx).to.emit(treasury, "Deposit").withArgs(owner.address, amount);
    expect(await treasury.getBalance()).to.equal(amount);
  });

  it("triggers fallback when sending data", async function () {
    const amount = ethers.parseEther("0.1");
    const tx = await owner.sendTransaction({ to: treasury.target, value: amount, data: "0x1234" });
    await expect(tx).to.emit(treasury, "FallbackCalled");
    expect(await treasury.getBalance()).to.equal(amount);
  });

  it("owner can withdraw", async function () {
    const deposit = ethers.parseEther("1.0");
    await owner.sendTransaction({ to: treasury.target, value: deposit });
    await treasury.withdraw(addr1.address, ethers.parseEther("0.4"));
    const rem = await treasury.getBalance();
    expect(rem).to.equal(ethers.parseEther("0.6"));
  });

  it("non-owner cannot withdraw", async function () {
    await expect(treasury.connect(addr1).withdraw(addr1.address, 1)).to.be.revertedWith("Only owner");
  });
});
