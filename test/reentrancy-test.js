const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DonationBox reentrancy demo", function () {
  it("Attacker drains funds from vulnerable DonationBox", async function () {
    const [deployer, donor, attackerEOA] = await ethers.getSigners();

    // Deploy vulnerable contract
    const DonationBox = await ethers.getContractFactory("DonationBox_vulnerable", deployer);
    const donationBox = await DonationBox.deploy();
    await donationBox.waitForDeployment();

    // Fund the contract with credited deposits (so they can be withdrawn)
    await donationBox.connect(deployer).deposit({ value: ethers.parseEther("5.0") });
    await donationBox.connect(donor).deposit({ value: ethers.parseEther("3.0") });

    // Attacker deploys Attacker contract
    const Attacker = await ethers.getContractFactory("Attacker", attackerEOA);
    const attacker = await Attacker.deploy(await donationBox.getAddress());
    await attacker.waitForDeployment();

    // Call attack() with a deposit amount (attacker.contract will call deposit on target)
    // This will deposit 1.0 ETH into the DonationBox and then try to withdraw and reenter
    await attacker.connect(attackerEOA).attack({ value: ethers.parseEther("1.0") });

    // Check results: donationBox should be drained (approx 0)
    const finalTargetBal = await ethers.provider.getBalance(await donationBox.getAddress());
    const attackerFinal = await ethers.provider.getBalance(await attacker.getAddress());

    console.log("Final target balance:", ethers.formatEther(finalTargetBal));
    console.log("Attacker contract balance:", ethers.formatEther(attackerFinal));

    expect(finalTargetBal).to.be.lt(ethers.parseEther("0.5")); // drained mostly
  });
});
