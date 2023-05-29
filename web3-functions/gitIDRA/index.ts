import { Web3Function, Web3FunctionContext } from '@gelatonetwork/web3-functions-sdk'
import { Contract, ethers } from 'ethers'
import { App, Octokit } from 'octokit'

const CONTRACT_ABI = [
  "function gainShare(address,bytes32) public",
  "event ShareGained(address indexed subscriber, bytes32 indexed data)"
]

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, multiChainProvider } = context
  const provider = multiChainProvider.default()
  
  const idaAddress = userArgs.ida
  const ida = new Contract(idaAddress, CONTRACT_ABI, provider)
  
  // Get the owner of the github account and the repos to monitor
  const owner = userArgs.github
  const repos = userArgs.repos
  if (!owner || repos.length === 0) return { canExec: false, message: "InvalidUserArgs" }
  
  // the lastMergeDate helps to remember which pull requests has been rewarded
  const lastMergeDate = (await storage.get('lastMergeDate')) ?? "0"
  
  // Get the ID of our github app. Return false if undefined.
  const githubAppID = await context.secrets.get("GITHUB_APP_ID")
  if (!githubAppID) return { canExec: false, message: "GITHUB_APP_ID not found" }
  // Get the private key of our github app. Return false if undefined.
  const githubAppPK = await context.secrets.get("GITHUB_APP_PK")
  if (!githubAppPK) return { canExec: false, message: "GITHUB_APP_PK not found" }
  // Get the ID of our octokit. Return false if undefined.
  const octokitID = await context.secrets.get("OCTOKIT_ID")
  if (!octokitID) return { canExec: false, message: "OCTOKIT_ID not found" }
  
  let octokit;
  try {
    const githubApp = new App({ 
      appId: githubAppID,
      privateKey: githubAppPK
    })
    octokit = await githubApp.getInstallationOctokit(octokitID)
  } catch (err) {
    return { canExec: false, nessage: err.message }
  }
  if (!octokit) return { canExec: false, message: "No octokit" }
  
  // endpoint to get a list of repo PULLs (only public & gh paid accounts)
  const endpoint = 'GET /repos/{owner}/{repo}/pulls'
  const options = {
    owner: owner,
    repo: '',
    state: 'closed',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  }
  
  const pullRequests = []
  // Iterate trough repos array and check for new pull requests on them
  for (let i = 0; i < repos.length; i++) {
    // set the name of the repo to check this iteration
    options.repo = repos[i]
    try {
      // fetch pull requests of current repo
      const response = await octokit.request(endpoint, options)
      // no pull requests or something went wrong, ignore this repo
      if (!response.status === 200) continue
    
      pullRequests.push(...response.data)
    } catch (err) {
      console.log(err)
    }
  }
  
  const calldata = []
  let newLastMergeDate = "0";
  for (let i = 0; i < pullRequests.length; i++) {
    const pr = pullRequests[i]
    if (pr.merged_at && pr.merged_at > lastMergeDate) {
      newLastMergeDate = pr.merged_at > newLastMergeDate ? pr.merged_at : newLastMergeDate

      const repo = pr.head.repo.name
      const prNumber = pr.number.toString()
      //const prSHA = pr.head.sha
      const prHash = ethers.utils.solidityKeccak256(["string", "string"], [repo, prNumber])

      // every pull request should hardcode the address to be rewarded,
      // we are extracting the most significant 'word' here
      const contributorAddress = pr.head.ref.split('-').slice(-1)[0]
      
      if (!ethers.utils.isAddress(contributorAddress)) continue
      
      let logs = [];
      try {
        const filter = ida.filters.ShareGained(contributorAddress, prHash)
        logs = await provider.getLogs(filter)  
      } catch (err) {
        console.log(err)
      }
      if (logs.length > 0) continue // pr has already been rewarded
      
      calldata.push({
        to: idaAddress,
        data: ida.interface.encodeFunctionData("gainShare", [contributorAddress, prHash])
      })
    }
  }
  
  if (calldata.length === 0) return { canExec: false, message: "Already up to date" }
  
  await storage.set('lastMergeDate', newLastMergeDate)
  
  return { canExec: true, callData: calldata }
})
