const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VaultFuzzTest", function () {
  let vault, owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const DonationBox = await ethers.getContractFactory("DonationBox_fixed");
    vault = await DonationBox.deploy();
    await vault.waitForDeployment();
  });

  it("Fuzz test: random deposits and withdraws", async function () {
    const users = [user1, user2];

    for (let i = 0; i < 50; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomValue = ethers.parseEther((Math.random() * 0.5).toFixed(3));

      if (Math.random() < 0.5) {
        await vault.connect(randomUser).deposit({ value: randomValue });
      } else {
        try {
          await vault.connect(randomUser).withdraw();
        } catch (e) {}
      }

      const totalBalances = await vault.totalBalances();
      const contractBalance = await ethers.provider.getBalance(vault.target);
      expect(totalBalances).to.equal(contractBalance);
    }
  });
});
