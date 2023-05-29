import hre from "hardhat";
import { AutomateSDK, Web3Function } from "@gelatonetwork/automate-sdk";
import { IDRAon } from "../typechain";

const { ethers, w3f } = hre;

const main = async () => {
  const [deployer] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId;
  
  const gitidra = <IDRAon>await ethers.getContractAt("IDRAon", "0x8e3Be80f041C4784Fa4F0e813d9D1563C6641351", deployer);
  const gitidraW3f = w3f.get("gitIDRAon");

  const automate = new AutomateSDK(chainId, deployer);
  const web3Function = new Web3Function(chainId, deployer);

  //const taskId = "0xa26c60630ab1ad820dcbce6095a0c03d88835434ba6096d9304a03e560f97574";
  const taskId = "0xc31d5e9faf2865853c5a095424ae11c36950f80a84e98b5ba58d6b91d661c403";
  // Set task specific secrets
  const secrets = gitidraW3f.getSecrets();
  if (Object.keys(secrets).length > 0) {
    await web3Function.secrets.set(secrets, taskId);
    console.log(`Secrets set`);
  }
};

main()
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
