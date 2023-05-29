// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import {ISuperfluid, ISuperToken } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import {IInstantDistributionAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IInstantDistributionAgreementV1.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";


contract IDRAonSeasons {
    /// @notice Super token to be distributed as reward.
    ISuperToken public spreaderToken;
    /// @notice SuperToken Library
    using SuperTokenV1Library for ISuperToken;
    /// @notice Index ID. Never changes.
    uint32 public constant INDEX_ID = 0;
    
    /// @notice the gelato sender allowed to call gainShare function
    address private gelatoSender;
    /// @notice the owner is able to change the gelato sender address and start seasons
    address private owner;

    /// @notice the minimum pull requests to allow distribution
    uint256 public minPullRequests;
    /// @notice the total number of pull requests rewarded the current season
    uint256 public totalSeasonPullRequests;
    /// @notice the deadline of the season
    uint256 public deadline;
    
    /// @notice history of rewarded pull requests hashes
    mapping (bytes32 => bool) private history;
    
    /// @notice Emitted after successfully increase the share units of a subscriber by one. The data param is helpful for verification.
    event ShareGained(address indexed subscriber, bytes32 indexed data);

    constructor(ISuperToken _spreaderToken) {
        spreaderToken = _spreaderToken;
        owner = msg.sender;
        
        // Creates the IDA Index through which tokens will be distributed
        _spreaderToken.createIndex(INDEX_ID);
    }

    // ---------------------------------------------------------------------------------------------
    // IDA OPERATIONS

    /// @notice Takes the entire balance of the designated spreaderToken in the contract and distributes it out to unit holders w/ IDA
    function distribute() public {
        bool isDistributionAllowed = _isDistributionAllowed(); 
        require(isDistributionAllowed, "Forbidden");
        totalSeasonPullRequests = 0;
        uint256 spreaderTokenBalance = spreaderToken.balanceOf(address(this));
        (uint256 actualDistributionAmount, ) = spreaderToken.calculateDistribution(
            address(this),
            INDEX_ID,
            spreaderTokenBalance
        );

        spreaderToken.distribute(INDEX_ID, actualDistributionAmount);
    }

    /// @notice lets an account gain a single distribution unit. 1 unit as reward per pull request.
    /// @param subscriber subscriber address whose units are to be incremented
    /// @param data 32 random bytes, helpful for verification
    function gainShare(address subscriber, bytes32 data) public {
        require(msg.sender == gelatoSender, "Forbiden");
        // store the pull request hash to keep track of rewarded repos
        history[data] = true;
        totalSeasonPullRequests++;
        // Get current units subscriber holds
        (, , uint256 currentUnitsHeld, ) = spreaderToken.getSubscription(
            address(this),
            INDEX_ID,
            subscriber
        );

        // Update to current amount + 1
        spreaderToken.updateSubscriptionUnits(
            INDEX_ID,
            subscriber,
            uint128(currentUnitsHeld + 1)
        );
        
        emit ShareGained(subscriber, data);
        // distribute(); // uncomment to allow Gelato W3F to distribute on every gainShare call
    }
    
    /// @notice let the creator of the smart contract choose how to manage the distribute call
    function _isDistributionAllowed() internal view returns (bool) {
        // return true;
        // return isActive;
        // return block.timestamp > deadline;
        // return totalPullRequests > minPullRequests;
        // return totalPullRequests % pullRequestsFrequency == 0;
        // return spreaderToken.balanceOf(address(this)) > minBalanceToDistribute; // could be combined with cfa
        return totalSeasonPullRequests > minPullRequests && block.timestamp > deadline; // recommended
    }
    
    /// @notice checks whether a pull request hash exists or not. If yes, it has been rewarded.
    function isRewarded(bytes32 prHash) public view returns (bool) {
        return history[prHash];
    }
    
    
    /// @notice Call this function to start a new season and set the constraints variables. Then, owner should deposit funds in the contract
    function startNewSeason(uint256 newDeadline, uint256 newMinPullRequests) public {
        require(msg.sender == owner, "Forbidden"); //optional?! anyone allowed to create and fund seasons? sounds cool
        require(block.timestamp > deadline && spreaderToken.balanceOf(address(this)) == 0, "On going season");
        deadline = newDeadline;
        minPullRequests = newMinPullRequests;
    }
    
    
    // ---------------------------------------------------------------------------------------------
    // OWNER OPERATIONS
    
    /// @notice lets the owner to set the gelato sender
    function setGelatoSender(address _gelatoSender) external {
        require(msg.sender == owner, "Forbidden");
        gelatoSender = _gelatoSender;
    }
    
    /// @notice lets the owner transfers ownership. Transfer to Zero address to renounce.
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Forbidden");
        owner = newOwner;
    }
}
