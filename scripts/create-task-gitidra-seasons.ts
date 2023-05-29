import hre from "hardhat";
import { AutomateSDK, Web3Function } from "@gelatonetwork/automate-sdk";
import { IDRAon } from "../typechain";

const { ethers, w3f } = hre;

const main = async () => {
  const [deployer] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId;
  
  const gitidra = <IDRAonSeasons>await ethers.getContractAt("IDRAonSeasons", "0x7f5Cf69F81eD1b2cB6F41a7d5632da819D78Ac85", deployer);
  const gitidraW3f = w3f.get("gitIDRAon");

  const automate = new AutomateSDK(chainId, deployer);
  const web3Function = new Web3Function(chainId, deployer);

  // gitidra-onchain w3f cid, we no need to deploy a new w3f.
  // we only need to set the address of our IDRA Seasons contract.
  const cid = "QmWtbCfoNmnNLL5TUY5BZ2BKEcW3mUcgWZJeyzfR8BCy3a";

  // Create task using automate sdk
  console.log("Creating automate task...");
  const { taskId, tx } = await automate.createBatchExecTask({
    name: "GitHidra - onchain - Seasons example",
    web3FunctionHash: cid,
    web3FunctionArgs: {
      ida: gitidra.address,
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
