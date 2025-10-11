// scripts/fund-faucet.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const faucetAddress = process.env.FAUCET_ADDRESS || "<PUT_FAUCET_ADDRESS_HERE>";
  const tokenAddress = process.env.TOKEN_ADDRESS || "<PUT_TOKEN_ADDRESS_HERE>";
  const amountToSend = process.env.FUND_AMOUNT || hre.ethers.parseUnits("100", 18); // 100 tokens

  if (faucetAddress.includes("PUT") || tokenAddress.includes("PUT")) {
    throw new Error("Set FAUCET_ADDRESS and TOKEN_ADDRESS env vars or edit script");
  }

  const token = await hre.ethers.getContractAt("IERC20", tokenAddress);

  console.log("Funding faucet:", faucetAddress, "with", amountToSend.toString());

  // Approve faucet (if token requires)
  // Many tokens don't require approve for direct transferFrom unless faucet pulls.
  // Here we simply transfer tokens from deployer to faucet
  const tx = await token.transfer(faucetAddress, amountToSend);
  await tx.wait();
  console.log("Fund tx:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
