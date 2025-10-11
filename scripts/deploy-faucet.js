// scripts/deploy-faucet.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // PARAMETERS: update or pass via env/cli
  // Example values: token address, maxClaimAmount (in token smallest unit), cooldownSeconds
  const tokenAddress = process.env.TOKEN_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const maxClaimAmount = process.env.MAX_CLAIM || hre.ethers.parseUnits("10", 18); // default 10 tokens
  const cooldownSeconds = process.env.COOLDOWN_SECS || 24 * 60 * 60; // default 24h

  if (!tokenAddress || tokenAddress === "<PUT_TOKEN_ADDRESS_HERE>") {
    throw new Error("Set TOKEN_ADDRESS env var or edit script");
  }

  const Faucet = await hre.ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(tokenAddress, maxClaimAmount, cooldownSeconds);

  await faucet.waitForDeployment();

  console.log("Faucet deployed to:", await faucet.getAddress());
  console.log("Token:", tokenAddress);
  console.log("Max claim amount (raw):", maxClaimAmount.toString());
  console.log("Cooldown (sec):", cooldownSeconds.toString());
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
