// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Owned.sol";

error NotOwner(address caller);
error InsufficientAllowance(uint256 have, uint256 need);
error NoFunds(uint256 available, uint256 needed);
error TransferFailed(address to, uint256 amount);

contract AllowanceVault is Owned {
    mapping(address => uint256) public allowance;

    event AllowanceSet(address indexed who, uint256 amount);
    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    // receive() to accept plain ETH transfers
    receive() external payable {
        if (msg.value > 0) {
            emit Deposited(msg.sender, msg.value);
        }
    }

    // Owner sets allowance for a beneficiary
    function setAllowance(address who, uint256 amount) external onlyOwner {
        allowance[who] = amount;
        emit AllowanceSet(who, amount);
    }

    // Beneficiary pulls funds up to their allowance
    function withdraw(uint256 amount) external {
        uint256 allowed = allowance[msg.sender];
        if (allowed < amount) {
            revert InsufficientAllowance(allowed, amount);
        }

        uint256 bal = address(this).balance;
        if (bal < amount) {
            revert NoFunds(bal, amount);
        }

        // decrease allowance BEFORE transfer (pull-model, reentrancy-safe pattern)
        unchecked {
            allowance[msg.sender] = allowed - amount;
        }

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) {
            revert TransferFailed(msg.sender, amount);
        }

        emit Withdrawn(msg.sender, amount);
    }

    // helper: check contract balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
