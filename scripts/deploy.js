async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const XToken = await ethers.getContractFactory("XToken");
  const xToken = await XToken.deploy(); // deploy contract
  await xToken.waitForDeployment();

  console.log("XToken deployed to:", xToken.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });