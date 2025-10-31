// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DonationBox_fixed
/// @notice CEI (Checks → Effects → Interactions) + totalBalances tracking for invariant testing
contract DonationBox_fixed {
    mapping(address => uint256) public balances;
    uint256 public totalBalances; // tracked sum of all balances

    event Deposit(address indexed from, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);

    /// @notice deposit Ether into the sender's balance
    function deposit() external payable {
        require(msg.value > 0, "Send some Ether");
        balances[msg.sender] += msg.value;
        totalBalances += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /// @notice safe withdraw following Checks -> Effects -> Interactions
    function withdraw() external {
        uint256 bal = balances[msg.sender];
        require(bal > 0, "No balance");

        // ---- EFFECTS first ----
        balances[msg.sender] = 0;
        totalBalances -= bal;

        // ---- INTERACTIONS after ----
        (bool success, ) = payable(msg.sender).call{value: bal}("");
        require(success, "Transfer failed");

        emit Withdraw(msg.sender, bal);
    }

    // Allow direct funding (donations to pool) that are NOT credited to balances
    receive() external payable {}

    /// @notice helper to read contract balance (for tests/invariants)
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
