import { ethers } from "hardhat";

async function main() {
  const GCRM = await ethers.getContractFactory("GithubContributionsRewardsManager");
  const gcrm = await GCRM.deploy();

  await gcrm.deployed();

  console.log(
    `GCRM deployed to ${gcrm.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

