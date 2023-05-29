import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk"
import { Contract, ethers } from "ethers"
import { App, Octokit } from 'octokit'

const CONTRACT_ABI = [
  "function assignRewards(address,uint256,bytes32) external",
  "event RewardsAssigned(address indexed contributor, uint256 amount, bytes32 indexed data)"
]

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, /*gelatoArgs,*/ multiChainProvider } = context
  const provider = multiChainProvider.default()
  
  const contractAddress = "0x33bE97e6E15301988E3F326bb7DAC3c55C8EA472"
  const contract = new Contract(contractAddress, CONTRACT_ABI, provider)
  
  const owner = 'jvaleskadevs'
  const repo = 'testgithubappauth'
  // TODO multirepo
  
  // Get the ID of our github app. Return false if undefined.
  const githubAppID = await context.secrets.get("GITHUB_APP_ID")
  if (!githubAppID) return { canExec: false, message: "GITHUB_APP_ID not found" }
  // Get the private key of our github app. Return false if undefined.
  const githubAppPK = await context.secrets.get("GITHUB_APP_PK")
  if (!githubAppPK) return { canExec: false, message: "GITHUB_APP_PK not found" }
  // Get the ID of our octokit. Return false if undefined.
  const octokitID = await context.secrets.get("OCTOKIT_ID")
  if (!octokitID) return { canExec: false, message: "OCTOKIT_ID not found" }
  
  const githubApp = new App({ 
    appId: githubAppID,
    privateKey: githubAppPK
  })
  const octokit = await githubApp.getInstallationOctokit(octokitID)
  
  // list repo PULLS 
  // only works with public repos and github paid accounts
  const endpoint = 'GET /repos/{owner}/{repo}/pulls'
  const options = {
    owner: owner,
    repo: repo,
    state: 'closed',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  }
  
  const response = await octokit.request(endpoint, options)
  
  if (!response.status === 200) {
    return { canExec: false, message: "GITHUB_API error" } 
  }
  
  //console.log(response.data)
  const pullRequests = response.data
  
  // the lastMergeDate helps to remember which pull requests has been rewarded
  const lastMergeDate = (await storage.get('lastMergeDate')) ?? "0"
  console.log(lastMergeDate)
  
  const calldata = []
  let newLastMergeDate = "0";
  for (let i = 0; i < pullRequests.length; i++) {
    const pr = pullRequests[i]
    //console.log(pr)
    if (pr.merged_at && pr.merged_at > lastMergeDate) {
      newLastMergeDate = pr.merged_at > newLastMergeDate ? pr.merged_at : newLastMergeDate
      
      //console.log(pr.title)
      //console.log(pr.number)
      //console.log(pr.head.label)
      //console.log(pr.head.ref)
      //console.log(pr.merged_at)
      
      const prNumber = pullRequests[i].number.toString()
      const prHash = ethers.utils.solidityKeccak256(["string", "string"], [repo, prNumber])
      console.log(prHash)
      
      // every pull request should hardcode the address to be rewarded,
      // we are using the most significative 'word' to easily extract it here
      const contributorAddress = pr.head.ref.split('-').slice(-1)[0]
      console.log(contributorAddress)
      
      if (!ethers.utils.isAddress(contributorAddress)) continue
      
      const filter = contract.filters.RewardsAssigned(contributorAddress, null, prHash)
      const logs = await provider.getLogs(filter)
      console.log(logs)
      
      if (logs.length > 0) continue // this pr has already been rewarded

      const args = [contributorAddress, 1, prHash] // 1 reward per 1 contribution (PR)
      
      calldata.push({
        to: contractAddress,
        data: contract.interface.encodeFunctionData("assignRewards", args)
      })
    } else if (pr.merged_at && pr.merged_at < lastMergeDate) {
      break 
      // github sends the PRs sorted by date, so we drop the previous ones to lastMergeDate
    }
  }
  
  if (calldata.length === 0) return { canExec: false, message: "Already up to date" }
  console.log(calldata)
  
  await storage.set('lastMergeDate', newLastMergeDate)
  
  return { canExec: true, callData: calldata }
})
