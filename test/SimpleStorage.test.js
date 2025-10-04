const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleStorage", function () {
  let SimpleStorage, simpleStorage, owner, other;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();
    SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    simpleStorage = await SimpleStorage.connect(owner).deploy();

    // ethers v6: wait for deployment this way
    if (typeof simpleStorage.waitForDeployment === "function") {
      await simpleStorage.waitForDeployment();
    } else if (typeof simpleStorage.deployed === "function") {
      // fallback for ethers v5
      await simpleStorage.deployed();
    }
  });

  it("owner can store value and emits Stored event", async function () {
    expect(await simpleStorage.get()).to.equal(0);

    await expect(simpleStorage.store(42))
      .to.emit(simpleStorage, "Stored")
      .withArgs(owner.address, 42);

    expect(await simpleStorage.get()).to.equal(42);
  });

  it("non-owner cannot store (reverts with custom error)", async function () {
    await expect(
      simpleStorage.connect(other).store(7)
    ).to.be.revertedWithCustomError(simpleStorage, "NotOwner").withArgs(other.address);
  });
});
