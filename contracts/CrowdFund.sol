// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
Crowdfunding Contract
- Users fund a campaign
- If goal reached → owner withdraws
- Else → users can refund
*/

contract CrowdFund {

    address public owner;
    uint256 public goal;
    uint256 public deadline;
    uint256 public totalFunds;

    mapping(address => uint256) public contributions;

    event Funded(address user, uint256 amount);
    event Withdrawn(uint256 amount);
    event Refunded(address user, uint256 amount);

    constructor(uint256 _goal, uint256 _duration) {
        owner = msg.sender;
        goal = _goal;
        deadline = block.timestamp + _duration;
    }

    function fund() external payable {
        require(block.timestamp < deadline, "Campaign ended");
        require(msg.value > 0, "No ETH");

        contributions[msg.sender] += msg.value;
        totalFunds += msg.value;

        emit Funded(msg.sender, msg.value);
    }

    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        require(block.timestamp >= deadline, "Not ended");
        require(totalFunds >= goal, "Goal not reached");

        uint256 amount = totalFunds;
        totalFunds = 0;

        payable(owner).transfer(amount);

        emit Withdrawn(amount);
    }

    function refund() external {
        require(block.timestamp >= deadline, "Not ended");
        require(totalFunds < goal, "Goal reached");

        uint256 amount = contributions[msg.sender];
        require(amount > 0, "No contribution");

        contributions[msg.sender] = 0;

        payable(msg.sender).transfer(amount);

        emit Refunded(msg.sender, amount);
    }
}