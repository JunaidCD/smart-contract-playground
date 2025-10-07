const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("XToken", function () {
  let xToken, owner, alice, bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    const XTokenFactory = await ethers.getContractFactory("XToken");
    xToken = await XTokenFactory.deploy();
    await xToken.deployed();
  });

  // Positive tests
  it("Owner can mint tokens", async function () {
    await xToken.mint(alice.address, 100);
    expect(await xToken.balanceOf(alice.address)).to.equal(100);
  });

  it("Alice can transfer tokens to Bob", async function () {
    await xToken.mint(alice.address, 100);
    await xToken.connect(alice).transfer(bob.address, 50);
    expect(await xToken.balanceOf(bob.address)).to.equal(50);
  });

  it("Owner can burn tokens", async function () {
    await xToken.mint(alice.address, 100);
    await xToken.burn(alice.address, 50);
    expect(await xToken.balanceOf(alice.address)).to.equal(50);
  });

  // Negative tests
  it("Alice cannot mint tokens", async function () {
    await expect(xToken.connect(alice).mint(bob.address, 100))
      .to.be.revertedWith("AccessControl: account");
  });

  it("Cannot transfer more than balance", async function () {
    await xToken.mint(alice.address, 50);
    await expect(xToken.connect(alice).transfer(bob.address, 100))
      .to.be.reverted;
  });

  it("Cannot burn more than balance", async function () {
    await xToken.mint(alice.address, 50);
    await expect(xToken.burn(alice.address, 100)).to.be.reverted;
  });

  // Event tests
  it("Emits Transfer event on mint", async function () {
    await expect(xToken.mint(alice.address, 100))
      .to.emit(xToken, "Transfer")
      .withArgs(ethers.constants.AddressZero, alice.address, 100);
  });

  it("Emits Approval event on approve", async function () {
    await xToken.connect(alice).approve(bob.address, 50);
    await expect(xToken.connect(alice).approve(bob.address, 50))
      .to.emit(xToken, "Approval")
      .withArgs(alice.address, bob.address, 50);
  });
});
