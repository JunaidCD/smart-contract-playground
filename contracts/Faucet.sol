// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title Simple ERC20 Faucet (safe pattern)
/// @notice Users can claim up to `maxClaimAmount` once per `claimCooldown`.
contract Faucet is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;        // token distributed by faucet
    uint256 public maxClaimAmount;        // maximum per-claim
    uint256 public claimCooldown;         // cooldown in seconds

    mapping(address => uint256) public lastClaimed; // timestamp of last claim

    event Claimed(address indexed who, uint256 amount);
    event MaxClaimAmountChanged(uint256 oldAmt, uint256 newAmt);
    event ClaimCooldownChanged(uint256 oldSec, uint256 newSec);
    event FundsWithdrawn(address indexed to, uint256 amount);

    constructor(
        address _token,
        uint256 _maxClaimAmount,
        uint256 _claimCooldown
    ) Ownable(msg.sender) {
        require(_token != address(0), "Faucet: token zero address");
        token = IERC20(_token);
        maxClaimAmount = _maxClaimAmount;
        claimCooldown = _claimCooldown;
    }

    /// @notice Owner can change max claim amount
    function setMaxClaimAmount(uint256 newAmt) external onlyOwner {
        emit MaxClaimAmountChanged(maxClaimAmount, newAmt);
        maxClaimAmount = newAmt;
    }

    /// @notice Owner can change cooldown (seconds)
    function setClaimCooldown(uint256 newSec) external onlyOwner {
        emit ClaimCooldownChanged(claimCooldown, newSec);
        claimCooldown = newSec;
    }

    /// @notice Owner can withdraw leftover tokens
    function withdrawFunds(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Faucet: to zero");
        token.safeTransfer(to, amount);
        emit FundsWithdrawn(to, amount);
    }

    /// @notice Claim tokens from faucet (safe pattern)
    function claim(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0 && amount <= maxClaimAmount, "Faucet: invalid amount");

        uint256 last = lastClaimed[msg.sender];
        require(block.timestamp >= last + claimCooldown, "Faucet: wait before next claim");

        uint256 bal = token.balanceOf(address(this));
        require(bal >= amount, "Faucet: empty");

        // Effects
        lastClaimed[msg.sender] = block.timestamp;

        // Interaction
        token.safeTransfer(msg.sender, amount);

        emit Claimed(msg.sender, amount);
    }

    /// @notice pause / unpause faucet (owner)
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice helper: faucet token balance
    function getBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
