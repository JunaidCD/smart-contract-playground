// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
Simple Staking Contract
- Users stake ETH
- Earn rewards over time
*/

contract StakingRewards {

    mapping(address => uint256) public balance;
    mapping(address => uint256) public lastUpdate;
    mapping(address => uint256) public rewards;

    uint256 public rewardRate = 1e14; // reward per second per ETH

    event Staked(address user, uint256 amount);
    event Withdrawn(address user, uint256 amount);
    event RewardClaimed(address user, uint256 reward);

    function _updateReward(address user) internal {
        if (balance[user] > 0) {
            uint256 timeDiff = block.timestamp - lastUpdate[user];
            rewards[user] += (balance[user] * timeDiff * rewardRate) / 1e18;
        }
        lastUpdate[user] = block.timestamp;
    }

    function stake() external payable {
        require(msg.value > 0, "No ETH");

        _updateReward(msg.sender);

        balance[msg.sender] += msg.value;

        emit Staked(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(balance[msg.sender] >= amount, "Insufficient balance");

        _updateReward(msg.sender);

        balance[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);

        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() external {
        _updateReward(msg.sender);

        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No reward");

        rewards[msg.sender] = 0;
        payable(msg.sender).transfer(reward);

        emit RewardClaimed(msg.sender, reward);
    }

    receive() external payable {}
}