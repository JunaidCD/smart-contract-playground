// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Treasury {
    address public immutable owner;

    // Emitted when plain ETH is received (via receive)
    event Deposit(address indexed from, uint256 amount);

    // Optional: emitted when fallback is triggered
    event FallbackCalled(address indexed from, uint256 amount, bytes data);

    constructor() {
        owner = msg.sender;
    }

    // receive: called on plain ETH transfer (no calldata)
    receive() external payable {
        if (msg.value > 0) {
            emit Deposit(msg.sender, msg.value);
        }
    }

    // fallback: called when calldata doesn't match any function
    fallback() external payable {
        emit FallbackCalled(msg.sender, msg.value, msg.data);
    }

    // owner-only withdraw
    function withdraw(address payable to, uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        require(address(this).balance >= amount, "Insufficient balance");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Transfer failed");
    }

    // helper to check balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
