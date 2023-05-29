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

  // Deploy Web3Function on IPFS
  console.log("Deploying Web3Function on IPFS...");
  const cid = await gitidraW3f.deploy();
  console.log(`Web3Function IPFS CID: ${cid}`);

  // Create task using automate sdk
  console.log("Creating automate task...");
  const { taskId, tx } = await automate.createBatchExecTask({
    name: "Web3Function - GitIDRA",
    web3FunctionHash: cid,
    web3FunctionArgs: {
      ida: "0xCA32B2597e7acE6FD2B0aB1297E3e55C830Edd15",
      github: "jvaleskadevs",
      repos: [ "testgithubappauth" ]
    },
  });
  await tx.wait();
  console.log(`Task created, taskId: ${taskId} (tx hash: ${tx.hash})`);
  console.log(
    `> https://beta.app.gelato.network/task/${taskId}?chainId=${chainId}`
  );

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
