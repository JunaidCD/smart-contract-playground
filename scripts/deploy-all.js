// scripts/deploy-all.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Step 1: Deploy Test Token
  console.log("\n1. Deploying Test Token...");
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const token = await TestToken.deploy(
    "Test Token",
    "TEST", 
    hre.ethers.parseUnits("1000000", 18) // 1M tokens
  );
  
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("Test Token deployed to:", tokenAddress);

  // Step 2: Deploy Faucet
  console.log("\n2. Deploying Faucet...");
  const maxClaimAmount = hre.ethers.parseUnits("10", 18); // 10 tokens per claim
  const cooldownSeconds = 24 * 60 * 60; // 24 hours

  const Faucet = await hre.ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(tokenAddress, maxClaimAmount, cooldownSeconds);

  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  console.log("Faucet deployed to:", faucetAddress);

  // Step 3: Fund the Faucet
  console.log("\n3. Funding Faucet...");
  const fundAmount = hre.ethers.parseUnits("10000", 18); // 10k tokens to faucet
  const tx = await token.transfer(faucetAddress, fundAmount);
  await tx.wait();
  console.log("Faucet funded with:", fundAmount.toString(), "tokens");

  // Summary
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Test Token:", tokenAddress);
  console.log("Faucet:", faucetAddress);
  console.log("Max claim amount:", maxClaimAmount.toString());
  console.log("Cooldown (seconds):", cooldownSeconds);
  console.log("Faucet balance:", (await token.balanceOf(faucetAddress)).toString());
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
