// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Faucet is Ownable, ReentrancyGuard {
    IERC20 public token;
    uint256 public maxClaim;
    uint256 public cooldown; // seconds

    mapping(address => uint256) public lastClaimed;

    event Claimed(address indexed user, uint256 amount);

    constructor(address _token, uint256 _maxClaim, uint256 _cooldown) Ownable(msg.sender) {
        token = IERC20(_token);
        maxClaim = _maxClaim;
        cooldown = _cooldown;
    }

    function claim() external nonReentrant {
        require(block.timestamp - lastClaimed[msg.sender] >= cooldown, "Wait 24h before claiming again");
        require(token.balanceOf(address(this)) >= maxClaim, "Not enough tokens in faucet");

        lastClaimed[msg.sender] = block.timestamp;
        token.transfer(msg.sender, maxClaim);

        emit Claimed(msg.sender, maxClaim);
    }
}
