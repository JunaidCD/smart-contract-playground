// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DonationBox_vulnerable
/// @notice Intentionally vulnerable withdraw(): sends Ether BEFORE updating state
contract DonationBox_vulnerable {
    mapping(address => uint256) public balances;

    event Deposit(address indexed from, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);

    /// @notice deposit Ether into the sender's balance
    function deposit() external payable {
        require(msg.value > 0, "Send some Ether");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /// @notice vulnerable withdraw: interaction (external call) happens BEFORE state update
    function withdraw() external {
        uint256 bal = balances[msg.sender];
        require(bal > 0, "No balance");

        // === VULNERABLE PATTERN: external call before updating internal state ===
        (bool success, ) = payable(msg.sender).call{value: bal}("");
        require(success, "Transfer failed");

        // state update happens after external call -> reentrancy possible
        balances[msg.sender] = 0;

        emit Withdraw(msg.sender, bal);
    }

    // Helper to check contract balance
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Fund the contract directly (owner/funders can send Ether to donate pool)
    receive() external payable {
        // optionally accept donations to the pool (not credited to sender balances)
    }
}
