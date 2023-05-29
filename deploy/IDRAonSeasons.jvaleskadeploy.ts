import { ethers } from "hardhat";

async function main() {
  const IDRA = await ethers.getContractFactory("IDRAonSeasons");
  const idra = await IDRA.deploy("0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f"); // fDAI address

  await idra.deployed();

  console.log(
    `IDRAonSeasons deployed to ${idra.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

