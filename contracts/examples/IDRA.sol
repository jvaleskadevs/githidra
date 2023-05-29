// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import {ISuperfluid, ISuperToken } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import {IInstantDistributionAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IInstantDistributionAgreementV1.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";


contract IDRA {
    /// @notice Super token to be distributed as reward.
    ISuperToken public spreaderToken;
    /// @notice SuperToken Library
    using SuperTokenV1Library for ISuperToken;
    /// @notice Index ID. Never changes.
    uint32 public constant INDEX_ID = 0;
    
    /// @notice the gelato sender allowed to call gainShare function
    address private gelatoSender;
    /// @notice the owner is able to change the gelato sender address
    address private owner;
    
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
    
    /// @notice let the creator of the smart contract choose how to manage the distribue call
    function _isDistributionAllowed() internal pure returns (bool) {
        return true;
        // return isActive;
        // return block.timestamp > deadline;
        // return totalShareUnits > minPullRequests;
        // return totalShareUnits % pullRequestsFrequency == 0;
        // return spreaderToken.balanceOf(address(this)) > minBalanceToDistribute;
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
