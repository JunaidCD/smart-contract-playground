// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TimeLockedVault {
    address public owner;
    uint public unlockTime;

    // Pull-payment style balance
    uint private ownerBalance;

    // Events
    event Deposited(address indexed from, uint amount);
    event Withdrawn(address indexed to, uint amount);

    // Set owner and unlock time in constructor
    constructor(uint _unlockTime) {
        require(_unlockTime > block.timestamp, "Unlock time must be in the future");
        owner = msg.sender;
        unlockTime = _unlockTime;
    }

    // Anyone can deposit Ether for the owner
    function deposit() external payable {
        require(msg.value > 0, "Must send some Ether");
        ownerBalance += msg.value; // update state first
        emit Deposited(msg.sender, msg.value);
    }

    // Owner can withdraw only after unlockTime
    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        require(block.timestamp >= unlockTime, "Vault is still locked");
        uint amount = ownerBalance;
        require(amount > 0, "No funds to withdraw");

        // CEI pattern: update state before interaction
        ownerBalance = 0;

        (bool sent, ) = owner.call{value: amount}("");
        require(sent, "Failed to send Ether");

        emit Withdrawn(owner, amount);
    }

    // Helper function to check balance
    function getBalance() external view returns (uint) {
        return ownerBalance;
    }
}
