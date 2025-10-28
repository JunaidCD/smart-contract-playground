// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DonationBox_fixed
/// @notice CEI-safe withdraw (state updated before external call)
contract DonationBox_fixed {
    mapping(address => uint256) public donations;

    event Donated(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    function donate() external payable {
        require(msg.value > 0, "no ether");
        donations[msg.sender] += msg.value;
        emit Donated(msg.sender, msg.value);
    }

    /// Safe withdraw: update state before external call (CEI)
    function withdraw() external {
        uint256 amt = donations[msg.sender];
        require(amt > 0, "no funds");

        // EFFECT first
        donations[msg.sender] = 0;

        // INTERACTION
        (bool ok, ) = payable(msg.sender).call{value: amt}("");
        require(ok, "send failed");

        emit Withdrawn(msg.sender, amt);
    }

    function totalBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
