const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");
const hre = require("hardhat");

async function main() {
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
  const metadataURL = METADATA_URL;

  const techusiasticContract = await ethers.getContractFactory("Techusiastic");

  const deployedTechusiasticContract = await techusiasticContract.deploy(
    metadataURL,
    whitelistContract
  );

  console.log(
    "Techusiastic Contract Address:",
    deployedTechusiasticContract.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
