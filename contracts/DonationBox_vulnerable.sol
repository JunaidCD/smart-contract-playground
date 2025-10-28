// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DonationBox_vulnerable
/// @notice intentionally vulnerable withdraw() — sends before updating state (reentrancy)
contract DonationBox_vulnerable {
    mapping(address => uint256) public donations;

    event Donated(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    function donate() external payable {
        require(msg.value > 0, "no ether");
        donations[msg.sender] += msg.value;
        emit Donated(msg.sender, msg.value);
    }

    /// Vulnerable: external call occurs before state update
    function withdraw() external {
        require(donations[msg.sender] > 0, "no funds");
        uint256 amount = donations[msg.sender];

        // VULNERABLE: interaction happens before effect
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "send failed");

        // bug: state not updated correctly (should be donations[msg.sender] = 0)
        donations[msg.sender] = donations[msg.sender]; // intentional no-op to show vulnerability
        emit Withdrawn(msg.sender, amount);
    }

    // helper to read contract balance
    function totalBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
