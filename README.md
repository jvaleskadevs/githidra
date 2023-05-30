# GitHidra
GitHidra allows teams, organizations and individuals to track merged pull requests and assign rewards on chain.

### GitHidra onchain Seasons example
The GitHidra onchain Seasons example relevants files are `deploy/IDRAonSeasons.jvaleskadeploy.ts`, `contracts/examples/IDRAonSeasons.sol` and 
`scripts/create-task-gitidra-seasons.ts`.
This is not reseting the share units after distribution. I think the best option to do that will be
combining the GitHidra with [PoB](https://github.com/jvaleskadevs/pob).

### GitHidra onchain
The GitHidra onchain relevants files are `deploy/IDRAon.jvaleskadeploy.ts`, `contracts/examples/IDRAon.sol` and 
`scripts/create-task-gitidra.ts`.

### GitHidra offchain
The GitHidra offchain relevants files are `deploy/IDRA.jvaleskadeploy.ts`, `contracts/examples/IDRA.sol` and 
`scripts/create-task-gitidra.ts`.

### Github
There is a folder called `github` in the `web3-functions` folder. It contains the most basic example without IDRA.
Its relevants files are `contracts/examplesGithubContributionsRewardsManager.sol`, the mentioned folder and the `scripts/create-task-github.ts`.


## About this repo
This repository is a copy of Gelato [web3-functions-template](https://github.com/gelatodigital/web3-functions-template) repository.
This is a list of all our modifications:
- In the `contracts/examples` folder all our contracts start with the word `IDRA`. In addition,
there is a contract called `GithubContributionsRewardsManager` that does not implement IDRA.
- In the `deploy` folder, we have added the suffix `jvaleskadeploy` to our deploys.
- In the `web3-functions` folder all our w3fs are prefixed with `Git`.
- And we have created three tasks in the `scripts` folder (git word), plus a script to set the secrets.

### About nomenclature
Throughout this repository the name `GitIDRA` is used, without H. We think with H is more cool. 
But to keep the repository the same as the contracts deployed prior to the name change 
it will remain without H. Said that, GitHidra == GitIDRA.

Another important detail is that the `offchain` variants (lower computation in the chain)
do not add any suffix (GitIDRA) and the `onchain` variants will be suffixed with `on` or `onchain` (GitIDRAon).

### About GitHidra
To learn more about GitHidra, read this great [article](https://eggplant-crowley-6f3.notion.site/GITHIDRA-99ebc24d7cc84022b12062c2483ec2ab) created by J. Valeska, builder of GitHidra.

### About Web 3 Functions
To learn more about Web 3 Functions, read the `GELATO_README` file or/and visit their [docs](https://docs.gelato.network/developer-services/web3-functions).

### About IDA (on which IDRA is based)
To learn more about Instant Distribution Agreement. Visit the Superfluid [docs](https://docs.superfluid.finance/superfluid/protocol-overview/in-depth-overview/super-agreements/instant-distribution-agreement-ida).


## Setup

- Install dependencies with yarn
```
yarn
```
- Deploy a Web 3 Function
```
npx hardhat w3f-deploy <Web3FunctionFolderName>
npx hardhat w3f-deploy gitIDRAon
```
- Deploy an IDRA contract
```
npx hardhat run deploy/IDRAon.jvaleskadeploy.ts
```
- Install our [GitHidra Gelato W3F integration github app](https://github.com/apps/gelato-w3f-integration) (or create your own) with read permissions
on desired repos and take note of your `appId`, `private key`(may need to create one) and `installationID`.
You will need them to set your GitHidra secrets (Take care with the PK format, it is very sensitive).
- Create a task with the [Gelato UI](https://beta.app.gelato.network/) or with the automate SDK. Install the Automate SDK.
```
yarn install @gelatonetwork/automate-sdk@beta
```
- Copy the `.env.sample` to a `.env` file and set your secrets. (script only)
- Create a task (script)
```
npx hardhat run scripts/create-task-gitidra.ts
```
- Set secrets of a previously deployed task (script)
```
npx hardhat run scripts/set-task-secrets.ts
```

After that, your GitHidra implementation should be working, tracking merged pull requests and assigning rewards on the blockchain.


## Our deployments

- Polygon scan IDRA [contract](https://mumbai.polygonscan.com/address/0xca32b2597e7ace6fd2b0ab1297e3e55c830edd15)
- Polygon scan IDRAon [contract](https://mumbai.polygonscan.com/address/0x8e3be80f041c4784fa4f0e813d9d1563c6641351)
- Polygon scan IDRAon Seasons [contract](https://mumbai.polygonscan.com/address/0x7f5cf69f81ed1b2cb6f41a7d5632da819d78ac85)
- Polygon scan GithubContributionsRewardsManager no IDRA [contract](https://mumbai.polygonscan.com/address/0xba6e11e846994c42158659c0bd3c77e4d5c7aec8)
- [GitHidra Gelato W3F integration github app](https://github.com/apps/gelato-w3f-integration)
- GithubContributionsRewardsManager [task](https://beta.app.gelato.network/task/0x6ff609003f3849ca8d05c974c32e8c365f1c8eacf4f9fc7d04e25edec9cf7a5a?chainId=80001)
- GitIDRA [task](https://beta.app.gelato.network/task/0x01efd787db2db4fd927032d94449a6848bd0cbbd7fc85937e09c036129f6769e?chainId=80001)
- GitIDRAon [task](https://beta.app.gelato.network/task/0xa26c60630ab1ad820dcbce6095a0c03d88835434ba6096d9304a03e560f97574?chainId=80001)
- GitIDRA onchain Seasons example [task](https://beta.app.gelato.network/task/0x9d39d387aa2c34e0852c3d7ce1a0d578c33920020d889e4b3ebff7c75fa6777d?chainId=80001)
- Deployer, publisher, task creator, contributor... 0x33bE97e6E15301988E3F326bb7DAC3c55C8EA472
