const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Faucet Contract Test", function () {
  let Token, token, Faucet, faucet;
  let owner, user1, user2;
  const maxClaim = ethers.utils.parseEther("100"); // 100 tokens per claim
  const cooldown = 24 * 60 * 60; // 24 hours in seconds

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy test token
    Token = await ethers.getContractFactory("XToken");
    token = await Token.deploy();
    await token.deployed();

    // Deploy faucet
    Faucet = await ethers.getContractFactory("Faucet");
    faucet = await Faucet.deploy(token.address, maxClaim, cooldown);
    await faucet.deployed();

    // Fund faucet with tokens
    await token.transfer(faucet.address, ethers.utils.parseEther("1000"));
  });

  it("User can claim tokens once", async function () {
    await faucet.connect(user1).claim();
    const balance = await token.balanceOf(user1.address);
    expect(balance).to.equal(maxClaim);
  });

  it("Cannot claim again before 24h", async function () {
    await faucet.connect(user1).claim();
    await expect(faucet.connect(user1).claim()).to.be.revertedWith(
      "Wait 24h before claiming again"
    );
  });

  it("Claimed event fires", async function () {
    await expect(faucet.connect(user1).claim())
      .to.emit(faucet, "Claimed")
      .withArgs(user1.address, maxClaim);
  });

  it("Multiple users can claim independently", async function () {
    await faucet.connect(user1).claim();
    await faucet.connect(user2).claim();

    const balance1 = await token.balanceOf(user1.address);
    const balance2 = await token.balanceOf(user2.address);

    expect(balance1).to.equal(maxClaim);
    expect(balance2).to.equal(maxClaim);
  });
});
