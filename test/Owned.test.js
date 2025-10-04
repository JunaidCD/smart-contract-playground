const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Owned", function () {
  let Owned, owned, alice, bob, carol;

  beforeEach(async function () {
    [alice, bob, carol] = await ethers.getSigners();
    Owned = await ethers.getContractFactory("Owned");
    owned = await Owned.connect(alice).deploy();

    // compatibility for ethers v5 / v6
    if (typeof owned.waitForDeployment === "function") {
      await owned.waitForDeployment();
    } else if (typeof owned.deployed === "function") {
      await owned.deployed();
    }
  });

  it("deployer (Alice) becomes owner", async function () {
    expect(await owned.owner()).to.equal(alice.address);
  });

  it("onlyOwner modifier blocks non-owner", async function () {
    // try to call transferOwnership from Bob (not owner)
    await expect(
      owned.connect(bob).transferOwnership(carol.address)
    ).to.be.revertedWith("Owned: caller is not the owner");
  });

  it("owner can transfer ownership to Bob and event emitted", async function () {
    await expect(owned.connect(alice).transferOwnership(bob.address))
      .to.emit(owned, "OwnershipTransferred")
      .withArgs(alice.address, bob.address);

    expect(await owned.owner()).to.equal(bob.address);
  });

  it("renounceOwnership sets owner to zero and emits event", async function () {
    // Get zero address (compatibility for ethers v5 / v6)
    const zeroAddress = ethers.ZeroAddress || ethers.constants.AddressZero;
    
    // renounce as Alice
    await expect(owned.connect(alice).renounceOwnership())
      .to.emit(owned, "OwnershipTransferred")
      .withArgs(alice.address, zeroAddress);

    expect(await owned.owner()).to.equal(zeroAddress);
  });

  it("after transfer, previous owner cannot call onlyOwner", async function () {
    // transfer to Bob
    await owned.connect(alice).transferOwnership(bob.address);

    // Alice (previous owner) should be blocked now
    await expect(owned.connect(alice).renounceOwnership()).to.be.revertedWith("Owned: caller is not the owner");
  });
});
