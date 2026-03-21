// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
Rate Limiter
- Restricts how often a user can call a function
*/

contract RateLimiter {

    uint256 public cooldown = 60; // seconds

    mapping(address => uint256) public lastCall;

    event ActionExecuted(address user, uint256 timestamp);

    function execute() external {
        require(
            block.timestamp >= lastCall[msg.sender] + cooldown,
            "Rate limit exceeded"
        );

        lastCall[msg.sender] = block.timestamp;

        emit ActionExecuted(msg.sender, block.timestamp);
    }

    function setCooldown(uint256 _cooldown) external {
        cooldown = _cooldown;
    }
}